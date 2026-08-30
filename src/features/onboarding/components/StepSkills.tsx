"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { SearchIcon, LoadingIcon } from "@/components/icons";
import { useOnboardingStore } from "@/store/onboarding.store";
import {
  saveOnboardingSkills,
  getOnboardingSkills,
  Skill,
} from "@/services/api/onboarding";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import OnboardingProgressBar from "./OnboardingProgressBar";
import PillButton from "./PillButton";

interface StepSkillsProps {
  onNext: (skills?: string[]) => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
}

const FALLBACK_SKILLS: string[] = [
  "Communication",
  "Leadership",
  "Teamwork",
  "Data Analysis",
  "Strategic Planning",
  "Financial Acumen",
  "Project Management",
  "Problem Solving",
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "Product Management",
  "Public Speaking",
  "Negotiation",
  "Marketing",
  "Graphic Design",
  "Sales",
];

export const StepSkills: React.FC<StepSkillsProps> = ({
  onNext,
  currentStep = 4,
  totalSteps = 5,
}) => {
  const {
    selectedSkills,
    setSelectedSkills,
  } = useOnboardingStore();

  const { toast } = useToast();

  // Search and available items state
  const [search, setSearch] = useState<string>("");
  const [availableSkills, setAvailableSkills] = useState<string[]>(FALLBACK_SKILLS);

  // Cursor-based pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Fetch initial skills list (or on debounced search change) using cursor API
  useEffect(() => {
    let isCancelled = false;
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const query = debouncedSearch.trim();
        // Only pass search query to backend if >= 3 characters
        const res = await getOnboardingSkills({
          q: query.length >= 3 ? query : undefined,
          limit: 30,
        });

        if (!isCancelled && res?.data) {
          const items = res.data.items || [];
          const fetchedNames = items.map((s: Skill) => s.name);
          
          if (query.length < 3) {
            setAvailableSkills(Array.from(new Set([...fetchedNames, ...FALLBACK_SKILLS])));
          } else {
            setAvailableSkills(fetchedNames);
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

    fetchSkills();
    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch]);

  // Load more skills on scroll using cursor pagination
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore || loading) return;

    setLoadingMore(true);
    try {
      const query = debouncedSearch.trim();
      const res = await getOnboardingSkills({
        q: query.length >= 3 ? query : undefined,
        cursor: nextCursor,
        limit: 30,
      });

      if (res?.data) {
        const items = res.data.items || [];
        const fetchedNames = items.map((s: Skill) => s.name);
        setAvailableSkills((prev) => Array.from(new Set([...prev, ...fetchedNames])));
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
    if (scrollHeight - scrollTop - clientHeight < 40) {
      handleLoadMore();
    }
  };

  // Toggle skill selection directly in store
  const handleToggleSkill = (skillName: string) => {
    const exists = selectedSkills.includes(skillName);
    
    if (!exists && selectedSkills.length >= 7) {
      return;
    }

    const updated = exists
      ? selectedSkills.filter((s) => s !== skillName)
      : [...selectedSkills, skillName];
    setSelectedSkills(updated);
  };

  // Search Results for Dropdown List View (only computed if >= 3 characters)
  const searchResults = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (q.length < 3) return [];
    const isAlreadySelected = selectedSkills.some((sel) => sel.toLowerCase() === q);
    const isAvailable = availableSkills.some((s) => s.toLowerCase() === q);
    const exactMatch = isAvailable || isAlreadySelected;
    
    const customOption = !exactMatch ? [search.trim()] : [];
    const matched = availableSkills.filter((s) => s.toLowerCase().includes(q));
    return Array.from(new Set([...customOption, ...matched]));
  }, [search, availableSkills, selectedSkills]);

  // Compute ordered chips list (when not actively searching):
  // 1. ALL selected skills ALWAYS come first
  // 2. Followed by unselected available skills
  const displayedChips = useMemo(() => {
    const selectedSet = new Set(selectedSkills);
    const unselected = availableSkills.filter((skill) => !selectedSet.has(skill));

    return {
      selected: selectedSkills,
      unselected,
    };
  }, [selectedSkills, availableSkills]);

  // Validation rules: 3 to 7 skills
  const isValid = selectedSkills.length >= 3 && selectedSkills.length <= 7;
  const isBelowMin = selectedSkills.length < 3;
  const isAboveMax = selectedSkills.length >= 7;

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await saveOnboardingSkills(selectedSkills);
      setSelectedSkills(selectedSkills);
      onNext(selectedSkills);
    } catch (error: any) {
      console.error("Failed to save skills:", error);
      const msg = error.response?.data?.message || "Failed to save skills. Please try again.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center font-sans text-[#FFECE6] select-none relative">
      {/* Centered Vertical Stack: Progress Bar + 20px gap + Main Content Container */}
      <div className="flex flex-col items-center gap-5 z-10">
        {/* Frame 41: Progress Bar (Step 4 of 5) */}
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        {/* Frame 1: Main Content Container (471px x 410px, padding 16px, gap 20px, rounded 24px) */}
        <div className="w-[471px] min-h-[410px] p-4 flex flex-col items-center gap-5 rounded-[24px] box-border">
          {/* Header Section */}
          <div className="w-full flex flex-col items-center p-0 gap-2 text-center">
            <h1 className="w-full font-sans font-bold text-[40px] leading-[48px] text-center text-[#FFECE6] tracking-normal m-0 p-0">
              What are you <span className="text-[#EC6229]">good at?</span>
            </h1>
            <p className="w-full font-sans font-semibold text-[16px] leading-[24px] text-center text-[#FFECE6] m-0 p-0">
              Choose skills that represent your expertise
            </p>
          </div>

          {/* Frame 2608512: Skills Input + Chips/Dropdown Section (260px, gap 12px) */}
          <div className="w-64 flex flex-col items-center p-0 gap-3">
            {/* Input with icon (260px x 36px, border-bottom 1px solid #2C2C33) */}
            <div className="w-64 flex flex-col items-start p-0 gap-2">
              <div className="w-64 h-[36px] py-2 border-b border-[#2C2C33] flex flex-row justify-between items-center box-border focus-within:border-[#EC6229] transition-colors">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                    const isSelected = selectedSkills.includes(item);
                    return (
                      <button
                        key={`search-skill-${item}-${index}`}
                        type="button"
                        onClick={() => {
                          handleToggleSkill(item);
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
                    {loading ? "Searching..." : "No skills found"}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Note / Helper message (260px x 16px, DM Sans 12px/16px) */}
                <div className="w-64 h-4 flex items-center justify-start">
                  {isBelowMin ? (
                    <span className="font-sans text-xs leading-4 font-normal text-[#B8ADA8]">
                      Minimum 3 skills
                    </span>
                  ) : isAboveMax ? (
                    <span className="font-sans text-xs leading-4 font-normal text-[#E5484D]">
                      Maximum limit of 7 reached
                    </span>
                  ) : null}
                </div>

                {/* Frame 2609486: Skill Chips Container (260px x 100px, fixed height, scrollable) */}
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="w-64 min-h-[64px] max-h-[100px] flex flex-row flex-wrap items-start content-start p-0 gap-2 overflow-y-auto scrollbar-hide pr-0.5"
                >
                  {/* 1. Selected Chips ALWAYS rendered first */}
                  {displayedChips.selected.map((skill, index) => (
                    <button
                      key={`selected-${skill}-${index}`}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className="h-7 py-1.5 px-2 bg-[#1A1A20] border border-[#EC6229] rounded-full flex flex-row justify-center items-center gap-2.5 transition-all cursor-pointer select-none shrink-0"
                    >
                      <span className="font-sans text-xs leading-4 font-normal text-[#B8ADA8] truncate max-w-[200px]">
                        {skill}
                      </span>
                    </button>
                  ))}

                  {/* 2. Unselected Available Chips follow after */}
                  {displayedChips.unselected.map((skill, index) => (
                    <button
                      key={`unselected-${skill}-${index}`}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className="h-7 py-1.5 px-2 bg-[#1A1A20] border border-transparent hover:border-[#2C2C33] rounded-full flex flex-row justify-center items-center gap-2.5 transition-all cursor-pointer select-none shrink-0"
                    >
                      <span className="font-sans text-xs leading-4 font-normal text-[#B8ADA8] truncate max-w-[200px]">
                        {skill}
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

          {/* Continue Button (260px x 36px) */}
          <div className="w-64 flex justify-center mt-1">
            <PillButton
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
              label="Continue"
              className="!w-64 !h-[36px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepSkills;
