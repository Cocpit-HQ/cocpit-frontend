"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { SearchIcon, LoadingIcon } from "@/components/icons";
import { useOnboardingStore } from "@/store/onboarding.store";
import {
  saveOnboardingInterests,
  getOnboardingInterests,
  completeOnboarding,
  Interest,
} from "@/services/api/onboarding";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import OnboardingProgressBar from "./OnboardingProgressBar";
import PillButton from "./PillButton";

interface StepInterestsProps {
  onNext?: (interests?: string[]) => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
}

const FALLBACK_INTERESTS: string[] = [
  "Drawing",
  "Painting",
  "Photography",
  "Pottery",
  "Hiking",
  "Genealogy",
  "Cooking",
  "Reading",
  "Writing",
  "Coding",
  "Design",
  "Music",
  "Gaming",
  "Traveling",
  "Fitness",
  "Yoga",
  "Gardening",
  "Fashion",
];

export const StepInterests: React.FC<StepInterestsProps> = ({
  onNext,
  currentStep = 5,
  totalSteps = 5,
}) => {
  const {
    selectedInterests,
    setSelectedInterests,
  } = useOnboardingStore();

  const { update } = useSession();
  const { toast } = useToast();

  // Search and available items state
  const [search, setSearch] = useState<string>("");
  const [availableInterests, setAvailableInterests] = useState<string[]>(FALLBACK_INTERESTS);

  // Cursor-based pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Fetch initial interests list (or on debounced search change) using cursor API
  useEffect(() => {
    let isCancelled = false;
    const fetchInterests = async () => {
      setLoading(true);
      try {
        const query = debouncedSearch.trim();
        // Only pass search query to backend if >= 3 characters
        const res = await getOnboardingInterests({
          q: query.length >= 3 ? query : undefined,
          limit: 30,
        });

        if (!isCancelled && res?.data) {
          const items = res.data.items || [];
          const fetchedNames = items.map((i: Interest) => i.name);

          if (query.length < 3) {
            setAvailableInterests(Array.from(new Set([...fetchedNames, ...FALLBACK_INTERESTS])));
          } else {
            setAvailableInterests(fetchedNames);
          }

          setNextCursor(res.data.next_cursor || null);
          setHasMore(!!res.data.has_more);
        }
      } catch (err) {
        // Fallback remains active
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchInterests();
    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch]);

  // Load more interests on scroll using cursor pagination
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore || loading) return;

    setLoadingMore(true);
    try {
      const query = debouncedSearch.trim();
      const res = await getOnboardingInterests({
        q: query.length >= 3 ? query : undefined,
        cursor: nextCursor,
        limit: 30,
      });

      if (res?.data) {
        const items = res.data.items || [];
        const fetchedNames = items.map((i: Interest) => i.name);
        setAvailableInterests((prev) => Array.from(new Set([...prev, ...fetchedNames])));
        setNextCursor(res.data.next_cursor || null);
        setHasMore(!!res.data.has_more);
      }
    } catch (err) {
      // Silently handle
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, nextCursor, loadingMore, loading, debouncedSearch]);

  // Scroll listener for infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 30) {
      handleLoadMore();
    }
  };

  // Toggle interest selection directly in store
  const handleToggleInterest = (interestName: string) => {
    const exists = selectedInterests.includes(interestName);
    
    if (!exists && selectedInterests.length >= 7) {
      return;
    }

    const updated = exists
      ? selectedInterests.filter((i) => i !== interestName)
      : [...selectedInterests, interestName];
    setSelectedInterests(updated);
  };

  // Search Results for Dropdown List View (only computed if >= 3 characters)
  const searchResults = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (q.length < 3) return [];
    const isAlreadySelected = selectedInterests.some((sel) => sel.toLowerCase() === q);
    const isAvailable = availableInterests.some((i) => i.toLowerCase() === q);
    const exactMatch = isAvailable || isAlreadySelected;
    
    const customOption = !exactMatch ? [search.trim()] : [];
    const matched = availableInterests.filter((i) => i.toLowerCase().includes(q));
    return Array.from(new Set([...customOption, ...matched]));
  }, [search, availableInterests, selectedInterests]);

  // Compute ordered chips list (when not actively searching):
  // 1. ALL selected interests ALWAYS come first
  // 2. Followed by unselected available interests
  const displayedChips = useMemo(() => {
    const selectedSet = new Set(selectedInterests);
    const unselected = availableInterests.filter((interest) => !selectedSet.has(interest));

    return {
      selected: selectedInterests,
      unselected,
    };
  }, [selectedInterests, availableInterests]);

  // Validation rules: 3 to 7 interests
  const isValid = selectedInterests.length >= 3 && selectedInterests.length <= 7;
  const isBelowMin = selectedInterests.length < 3;
  const isAboveMax = selectedInterests.length >= 7;

  // Submit Handler: Finish profile & complete onboarding
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await saveOnboardingInterests(selectedInterests);
      setSelectedInterests(selectedInterests);

      // Complete onboarding
      await completeOnboarding();
      sessionStorage.removeItem("cocpit_onboarding_step");
      sessionStorage.removeItem("cocpit_active_onboarding_session");

      // Update NextAuth session so middleware knows we are onboarded
      await update({ onboarding_complete: true });

      if (onNext) {
        onNext(selectedInterests);
      } else {
        setTimeout(() => {
          window.location.href = "/profile";
        }, 120000); // 2 minutes for testing
      }
    } catch (error: any) {
      console.error("Failed to complete onboarding:", error);
      const msg = error.response?.data?.message || "Failed to complete profile setup. Please try again.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center font-sans text-[#FFECE6] select-none relative">
      {/* Centered Vertical Stack: Progress Bar + 20px gap + Main Content Container */}
      <div className="flex flex-col items-center gap-5 z-10">
        {/* Frame 41: Progress Bar (Step 5 of 5) */}
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        {/* Frame 1: Main Content Container (573px x 374px, padding 16px, gap 20px, rounded 24px) */}
        <div className="w-[573px] min-h-[374px] p-4 flex flex-col items-center gap-5 rounded-[24px] box-border">
          {/* Header Section */}
          <div className="w-full flex flex-col items-center p-0 gap-2 text-center">
            <h1 className="w-full font-sans font-bold text-[40px] leading-[48px] text-center text-[#FFECE6] tracking-normal m-0 p-0">
              What are you <span className="text-[#EC6229]">interested in?</span>
            </h1>
            <p className="w-full font-sans font-semibold text-[16px] leading-[24px] text-center text-[#FFECE6] m-0 p-0">
              Choose interests to personalize your experience
            </p>
          </div>

          {/* Frame 2608512: Input + Chips/Dropdown Section (260px, gap 12px) */}
          <div className="w-64 flex flex-col items-center p-0 gap-3">
            {/* Input with icon (260px x 36px, border-bottom 1px solid #2C2C33) */}
            <div className="w-64 flex flex-col items-start p-0 gap-2">
              <div className="w-64 h-[36px] py-2 border-b border-[#2C2C33] flex flex-row justify-between items-center box-border focus-within:border-[#EC6229] transition-colors">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = search.trim();
                      if (val) {
                        handleToggleInterest(val);
                        setSearch("");
                      }
                    }
                  }}
                  placeholder="Search"
                  autoComplete="off"
                  className="w-[220px] bg-transparent border-none outline-none font-sans text-sm font-normal leading-normal text-[#FFECE6] placeholder-[#B8ADA8]"
                />
                <div className="w-4 h-4 p-[2px] flex items-center justify-center shrink-0">
                  <SearchIcon size={16} className="w-4 h-4 text-[#FFECE6]" />
                </div>
              </div>
            </div>

            {/* If searching >= 3 characters: Show Figma Dropdown List View */}
            {search.trim().length >= 3 ? (
              <div className="w-64 max-h-[180px] py-2 bg-black flex flex-col justify-start items-start gap-1 overflow-y-auto scrollbar-hide">
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => {
                    const isSelected = selectedInterests.includes(item);
                    return (
                      <button
                        key={`search-interest-${item}-${index}`}
                        type="button"
                        onClick={() => {
                          handleToggleInterest(item);
                          setSearch("");
                        }}
                        className={`self-stretch text-left font-['DM_Sans'] text-sm font-normal leading-5 py-1.5 transition-colors cursor-pointer truncate ${
                          isSelected
                            ? "text-[#EC6229] font-medium"
                            : "text-[#B8ADA8] hover:text-[#FFECE6]"
                        }`}
                      >
                        <span className="truncate">{item}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-2 text-xs text-stone-500 font-sans">
                    {loading ? "Searching..." : "No interests found"}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Note / Helper message (260px x 16px, DM Sans 12px/16px) */}
                <div className="w-64 h-4 flex items-center justify-start">
                  {isBelowMin ? (
                    <span className="font-sans text-xs leading-4 font-normal text-[#B8ADA8]">
                      Minimum 3 interest
                    </span>
                  ) : isAboveMax ? (
                    <span className="font-sans text-xs leading-4 font-normal text-[#E5484D]">
                      Maximum limit of 7 reached
                    </span>
                  ) : null}
                </div>

                {/* Frame 2609486: Interest Chips Container (260px x 64px, scrollable) */}
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="w-64 min-h-[64px] max-h-[100px] flex flex-row flex-wrap items-start content-start p-0 gap-2 overflow-y-auto scrollbar-hide pr-0.5"
                >
                  {/* 1. Selected Chips ALWAYS rendered first */}
                  {displayedChips.selected.map((interest, index) => (
                    <button
                      key={`selected-${interest}-${index}`}
                      type="button"
                      onClick={() => handleToggleInterest(interest)}
                      className="h-7 py-1.5 px-2 bg-[#1A1A20] border border-[#EC6229] rounded-full flex flex-row justify-center items-center gap-2.5 transition-all cursor-pointer select-none shrink-0"
                    >
                      <span className="font-sans text-xs leading-4 font-normal text-[#B8ADA8] truncate max-w-[200px]">
                        {interest}
                      </span>
                    </button>
                  ))}

                  {/* 2. Unselected Available Chips follow after */}
                  {displayedChips.unselected.map((interest, index) => (
                    <button
                      key={`unselected-${interest}-${index}`}
                      type="button"
                      onClick={() => handleToggleInterest(interest)}
                      className="h-7 py-1.5 px-2 bg-[#1A1A20] border border-transparent hover:border-[#2C2C33] rounded-full flex flex-row justify-center items-center gap-2.5 transition-all cursor-pointer select-none shrink-0"
                    >
                      <span className="font-sans text-xs leading-4 font-normal text-[#B8ADA8] truncate max-w-[200px]">
                        {interest}
                      </span>
                    </button>
                  ))}

                  {/* Loader indicator when loading more */}
                  {loadingMore && (
                    <div className="w-full py-2 flex items-center justify-center gap-2 text-stone-500 text-xs font-sans">
                      <LoadingIcon className="w-3 h-3 animate-spin-smooth" />
                      <span>Loading more...</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Finish profile Button (260px x 36px) */}
          <div className="w-64 flex justify-center mt-1">
            <PillButton
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
              label="Finish profile"
              className="!w-64 !h-[36px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepInterests;
