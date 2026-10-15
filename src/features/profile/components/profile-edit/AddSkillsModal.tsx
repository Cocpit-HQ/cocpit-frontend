"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { CloseCrossIcon, SearchIcon, LoadingIcon } from "@/components/icons";
import { getOnboardingSkills, Skill } from "@/services/api/onboarding";
import { getProfileSkills } from "@/services/api/profile";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { toTitleCase } from "@/lib/nameNormalizer";

// Curated master list of 50 initial popular skills (mirrors onboarding dataset)
export const INITIAL_POPULAR_SKILLS: string[] = [
  "Communication",
  "Leadership",
  "Teamwork",
  "Data Analysis",
  "Strategic Planning",
  "Financial Acumen",
  "Project Management",
  "Problem Solving",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "DevOps",
  "CI/CD",
  "Git",
  "Agile",
  "Scrum",
  "Product Management",
  "UI/UX Design",
  "Figma",
  "Graphic Design",
  "Cybersecurity",
  "Machine Learning",
  "Artificial Intelligence",
  "Data Science",
  "GraphQL",
  "REST APIs",
  "Public Speaking",
  "Negotiation",
  "Marketing",
  "Digital Marketing",
  "SEO",
  "Content Strategy",
  "Sales",
  "Business Development",
  "Customer Success",
  "Critical Thinking",
  "Time Management",
  "Cloud Architecture",
];

interface AddSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSkill: (skillName: string) => void;
  existingSkills: string[];
}

export const AddSkillsModal: React.FC<AddSkillsModalProps> = ({
  isOpen,
  onClose,
  onAddSkill,
  existingSkills,
}) => {
  const [search, setSearch] = useState("");
  const [availableSkills, setAvailableSkills] = useState<string[]>(INITIAL_POPULAR_SKILLS);
  const [apiSearchResults, setApiSearchResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const debouncedSearch = useDebounce(search, 200);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input and reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setNextCursor(null);
      setAvailableSkills(INITIAL_POPULAR_SKILLS);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fetch / search skills from backend cursor API
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const query = debouncedSearch.trim();
        const res = await getOnboardingSkills({
          q: query.length >= 2 ? query : undefined,
          limit: 30,
        });

        if (!isCancelled && res?.data) {
          const items = res.data.items || [];
          const fetchedNames = items.map((s: Skill) => s.name);

          if (query.length < 2) {
            setAvailableSkills(Array.from(new Set([...fetchedNames, ...INITIAL_POPULAR_SKILLS])));
            setApiSearchResults([]);
          } else {
            setApiSearchResults(fetchedNames);
          }

          setNextCursor(res.data.next_cursor || null);
          setHasMore(!!res.data.has_more);
        }
      } catch {
        // Fallback endpoint: /profile/skills
        try {
          const query = debouncedSearch.trim();
          const res2 = await getProfileSkills({
            q: query.length >= 2 ? query : undefined,
            limit: 30,
          });
          if (!isCancelled && res2?.data) {
            const items = res2.data.items || [];
            const fetchedNames = items.map((s: any) => s.name);
            if (query.length < 2) {
              setAvailableSkills(Array.from(new Set([...fetchedNames, ...INITIAL_POPULAR_SKILLS])));
              setApiSearchResults([]);
            } else {
              setApiSearchResults(fetchedNames);
            }
            setNextCursor(res2.data.next_cursor || null);
            setHasMore(!!res2.data.has_more);
          }
        } catch {
          // Keep INITIAL_POPULAR_SKILLS active
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchSkills();
    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, isOpen]);

  // Load more skills on scroll using cursor pagination
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore || loading) return;

    setLoadingMore(true);
    try {
      const query = debouncedSearch.trim();
      const res = await getOnboardingSkills({
        q: query.length >= 2 ? query : undefined,
        cursor: nextCursor,
        limit: 30,
      });

      if (res?.data) {
        const items = res.data.items || [];
        const fetchedNames = items.map((s: Skill) => s.name);
        if (query.length >= 2) {
          setApiSearchResults((prev) => Array.from(new Set([...prev, ...fetchedNames])));
        } else {
          setAvailableSkills((prev) => Array.from(new Set([...prev, ...fetchedNames])));
        }
        setNextCursor(res.data.next_cursor || null);
        setHasMore(!!res.data.has_more);
      }
    } catch {
      // Gracefully handle
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, nextCursor, loadingMore, loading, debouncedSearch]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 20) {
      handleLoadMore();
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filter skills: Exclude already existing, support instant search & custom typed skill
  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const existingLower = new Set(existingSkills.map((s) => s.toLowerCase()));

    const combinedPool = Array.from(new Set([...apiSearchResults, ...availableSkills]));

    let filtered = combinedPool
      .filter((s) => !existingLower.has(s.toLowerCase()))
      .filter((s) => (q ? s.toLowerCase().includes(q) : true));

    if (q.length > 0 && !existingLower.has(q)) {
      const hasExactMatch = filtered.some((s) => s.toLowerCase() === q);
      if (!hasExactMatch) {
        filtered = [toTitleCase(search), ...filtered];
      }
    }

    return filtered;
  }, [search, availableSkills, apiSearchResults, existingSkills]);

  if (!isOpen || typeof document === "undefined") return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
    >
      {/* Main Popup: Bottom sheet on mobile, 400px x 304px centered modal on desktop */}
      <div
        ref={modalRef}
        className="w-full sm:w-[400px] h-[340px] sm:h-[304px] p-[16px] sm:p-[12px] pb-8 sm:pb-[12px] bg-[var(--ds-bg)] border-t sm:border border-[var(--ds-border)] rounded-t-[16px] sm:rounded-[16px] shadow-2xl flex flex-col items-center justify-start box-border animate-in slide-in-from-bottom duration-200 sm:zoom-in-95"
      >
        {/* Mobile Grabber Handle */}
        <div className="w-9 h-1 rounded-full bg-[var(--ds-text-muted)] mx-auto mb-2 sm:hidden shrink-0" />

        {/* Frame 2609536: Top Bar with Cancel / Close button (376px x 20px, justify-end) */}
        <div className="w-full sm:w-[376px] h-[20px] flex flex-row items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-[20px] h-[20px] flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer p-0"
            aria-label="Close"
          >
            <CloseCrossIcon size={20} className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
          </button>
        </div>

        {/* Frame 2608581: Content Box (376px x 260px, gap 12px, items-center) */}
        <div className="w-full sm:w-[376px] flex-1 min-h-0 sm:h-[260px] flex flex-col items-center gap-[12px]">
          {/* Title: Add skills (DM Sans 16px Medium, #FFECE6, text-center) */}
          <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center text-[var(--ds-text-primary)] select-none shrink-0">
            Add skills
          </span>

          {/* Frame 2609494: Search Bar (376px width, 20px input height, padding 8px 0, border-b) */}
          <div className="w-full sm:w-[376px] py-[8px] border-b border-[var(--ds-border)] flex flex-row items-center justify-between gap-[10px] focus-within:border-[var(--ds-text-secondary)] transition-colors box-border shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && displayList.length > 0) {
                  e.preventDefault();
                  onAddSkill(displayList[0]);
                  setSearch("");
                }
              }}
              placeholder="Search"
              className="w-full bg-transparent border-none outline-none font-['DM_Sans'] text-[14px] leading-[20px] text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] p-0 m-0"
            />
            <div className="w-[16px] h-[16px] flex items-center justify-center shrink-0 text-[var(--ds-text-muted)]">
              {loading ? (
                <LoadingIcon className="w-[16px] h-[16px] animate-spin-smooth text-[var(--ds-text-secondary)]" />
              ) : (
                <SearchIcon size={16} className="w-[16px] h-[16px] text-[var(--ds-text-muted)]" />
              )}
            </div>
          </div>

          {/* Frame 2609753: Options List (376px x 176px, gap 16px, items-start, overflow-y-auto) */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="w-full sm:w-[376px] flex-1 min-h-0 sm:h-[176px] flex flex-col items-start gap-[16px] overflow-y-auto scrollbar-hide py-1 box-border"
          >
            {displayList.length > 0 ? (
              displayList.map((skill, index) => (
                <button
                  key={`${skill}-${index}`}
                  type="button"
                  onClick={() => {
                    onAddSkill(skill);
                    setSearch("");
                  }}
                  className="w-full shrink-0 min-h-[16px] h-[16px] flex items-center font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors cursor-pointer text-left select-none p-0 m-0 truncate"
                >
                  {skill}
                </button>
              ))
            ) : (
              <div className="w-full py-4 text-center font-['DM_Sans'] text-[12px] leading-[16px] text-[var(--ds-text-muted)] shrink-0">
                {loading ? "Loading skills..." : "No skills found"}
              </div>
            )}

            {loadingMore && (
              <div className="w-full py-1 flex items-center justify-center gap-1.5 font-['DM_Sans'] text-[12px] text-[var(--ds-text-muted)] shrink-0">
                <LoadingIcon className="w-[14px] h-[14px] animate-spin-smooth" />
                <span>Loading more...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddSkillsModal;
