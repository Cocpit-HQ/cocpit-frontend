"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { LeftArrowIcon } from "@/components/icons";
import { useInView } from "react-intersection-observer";
import { useJobs } from "../hooks/useJobs";
import { useJobStore } from "../store/job.store";
import { Job, JobsFilter } from "../types/jobs.types";
import { JobCard } from "../components/cards/JobCard";
import JobCardSkeleton from "../components/skeletons/JobCardSkeleton";
import { ApplyJobModal } from "../components/modals/ApplyJobModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getPaginatedIndustries,
  getPaginatedCompanies,
  CursorPaginatedResult,
} from "../services/jobs.service";

// Standard fixed-options dropdown chip (Job type, Experience, Work mode, Date posted)
interface StandardFilterChipProps {
  title: string;
  paramKey: string;
  options: string[];
  selectedValues: string[];
  onToggle: (paramKey: string, opt: string) => void;
}

const StandardFilterChip: React.FC<StandardFilterChipProps> = ({
  title,
  paramKey,
  options,
  selectedValues,
  onToggle,
}) => {
  const [open, setOpen] = useState(false);
  const isActive = selectedValues.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-[10px] transition-all cursor-pointer ${
            isActive
              ? "bg-ds-surface-1 border border-ds-accent"
              : "bg-transparent border border-ds-border hover:border-ds-text-muted"
          } text-base font-dm-sans font-medium leading-6 text-ds-text-primary select-none shrink-0`}
        >
          <Icon
            icon="solar:alt-arrow-down-linear"
            className={`size-4 text-ds-text-primary shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
          <span>{title}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto min-w-[142px] p-4 bg-ds-bg border border-ds-border rounded-[8px] shadow-2xl flex flex-col gap-3.5 z-[120]"
      >
        {options.map((opt) => {
          const isSelected = selectedValues.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(paramKey, opt)}
              className={`w-full flex items-center min-h-[28px] text-left font-dm-sans text-sm leading-normal font-normal transition-colors cursor-pointer select-none whitespace-nowrap ${
                isSelected
                  ? "text-ds-accent"
                  : "text-ds-text-secondary hover:text-ds-text-primary"
              }`}
            >
              <span>{opt}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

// Salary dropdown chip with presets and "Other" (Min / Max inputs)
interface SalaryFilterChipProps {
  selectedValues: string[];
  onToggle: (paramKey: string, opt: string) => void;
  onCustomApply: (min: string, max: string) => void;
}

const SalaryFilterChip: React.FC<SalaryFilterChipProps> = ({
  selectedValues,
  onToggle,
  onCustomApply,
}) => {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const presets = ["Under 3L", "3L-5L", "6L-10L", "10L+"];
  const isCustomActive = selectedValues.some((v) => v.startsWith("Custom:"));
  const isActive = selectedValues.length > 0;

  useEffect(() => {
    const customItem = selectedValues.find((v) => v.startsWith("Custom:"));
    if (customItem) {
      setShowCustom(true);
      const parts = customItem.replace("Custom:", "").split("-");
      if (parts[0]) setCustomMin(parts[0]);
      if (parts[1]) setCustomMax(parts[1]);
    }
  }, [selectedValues]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-[10px] transition-all cursor-pointer ${
            isActive
              ? "bg-ds-surface-1 border border-ds-accent"
              : "bg-transparent border border-ds-border hover:border-ds-text-muted"
          } text-base font-dm-sans font-medium leading-6 text-ds-text-primary select-none shrink-0`}
        >
          <Icon
            icon="solar:alt-arrow-down-linear"
            className={`size-4 text-ds-text-primary shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
          <span>Salary</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto min-w-[142px] p-4 bg-ds-bg border border-ds-border rounded-[8px] shadow-2xl flex flex-col gap-3.5 z-[120]"
      >
        {presets.map((opt) => {
          const isSelected = selectedValues.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle("salary_range", opt)}
              className={`w-full flex items-center min-h-[28px] text-left font-dm-sans text-sm leading-normal font-normal transition-colors cursor-pointer select-none whitespace-nowrap ${
                isSelected
                  ? "text-ds-accent"
                  : "text-ds-text-secondary hover:text-ds-text-primary"
              }`}
            >
              <span>{opt}</span>
            </button>
          );
        })}

        {/* Other option toggle */}
        <button
          type="button"
          onClick={() => setShowCustom((prev) => !prev)}
          className={`w-full flex items-center min-h-[28px] text-left font-dm-sans text-sm leading-normal font-normal transition-colors cursor-pointer select-none whitespace-nowrap ${
            showCustom || isCustomActive
              ? "text-ds-accent"
              : "text-ds-text-secondary hover:text-ds-text-primary"
          }`}
        >
          <span>Other</span>
        </button>

        {/* Min / Max Inputs when Other is selected */}
        {showCustom && (
          <div className="flex flex-col gap-2.5 pt-1 border-t border-ds-border/60 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-4">
              <span className="font-dm-sans text-sm text-ds-text-primary">Min</span>
              <input
                type="number"
                placeholder="0"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-16 px-1.5 py-0.5 text-right text-xs bg-ds-surface-1 border border-ds-border rounded text-ds-text-primary outline-none focus:border-ds-accent"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-dm-sans text-sm text-ds-text-primary">Max</span>
              <input
                type="number"
                placeholder="0"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                className="w-16 px-1.5 py-0.5 text-right text-xs bg-ds-surface-1 border border-ds-border rounded text-ds-text-primary outline-none focus:border-ds-accent"
              />
            </div>
            <button
              type="button"
              onClick={() => onCustomApply(customMin, customMax)}
              className="py-1 text-xs text-ds-accent hover:underline font-medium text-center cursor-pointer"
            >
              Apply
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

// Searchable and Cursor-paginated filter chip (Industry, Company)
interface SearchableCursorFilterChipProps {
  title: string;
  paramKey: string;
  selectedValues: string[];
  fetchData: (query?: string, cursor?: string) => Promise<CursorPaginatedResult<string>>;
  onToggle: (paramKey: string, opt: string) => void;
}

const SearchableCursorFilterChip: React.FC<SearchableCursorFilterChipProps> = ({
  title,
  paramKey,
  selectedValues,
  fetchData,
  onToggle,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isActive = selectedValues.length > 0;

  // Load initial 8 items on open or when query changes
  useEffect(() => {
    if (!open) return;
    let isCurrent = true;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetchData(query.trim() || undefined, undefined);
        if (isCurrent) {
          setItems(res.items);
          setNextCursor(res.nextCursor);
          setHasMore(res.hasMore);
        }
      } catch (err) {
        console.error(`Failed to load ${title}:`, err);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [open, query, fetchData, title]);

  // Load more via cursor on scroll
  const handleScroll = async () => {
    const el = scrollContainerRef.current;
    if (!el || isLoadingMore || !hasMore || !nextCursor) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setIsLoadingMore(true);
      try {
        const res = await fetchData(query.trim() || undefined, nextCursor);
        setItems((prev) => [...prev, ...res.items.filter((i) => !prev.includes(i))]);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } catch (err) {
        console.error(`Failed to load more ${title}:`, err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-[10px] transition-all cursor-pointer ${
            isActive
              ? "bg-ds-surface-1 border border-ds-accent"
              : "bg-transparent border border-ds-border hover:border-ds-text-muted"
          } text-base font-dm-sans font-medium leading-6 text-ds-text-primary select-none shrink-0`}
        >
          <Icon
            icon="solar:alt-arrow-down-linear"
            className={`size-4 text-ds-text-primary shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
          <span>{title}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-56 p-4 bg-ds-bg border border-ds-border rounded-[8px] shadow-2xl flex flex-col gap-3 z-[120]"
      >
        {/* Search input with bottom line border */}
        <div className="w-full flex items-center gap-2 border-b border-ds-border pb-2 mb-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-ds-text-primary placeholder:text-ds-text-muted outline-none font-dm-sans leading-normal py-0.5"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-ds-text-secondary hover:text-ds-text-primary text-xs p-1"
            >
              <Icon icon="lucide:x" className="size-3.5" />
            </button>
          )}
        </div>

        {/* Scrollable Items List */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex flex-col gap-3 max-h-60 overflow-y-auto no-scrollbar py-1 pr-1"
        >
          {isLoading ? (
            <div className="py-3 text-center text-xs text-ds-text-secondary">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-3 text-center text-xs text-ds-text-secondary">No matches found</div>
          ) : (
            items.map((opt) => {
              const isSelected = selectedValues.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onToggle(paramKey, opt)}
                  className={`w-full flex items-center min-h-[28px] text-left font-dm-sans text-sm leading-normal font-normal transition-colors cursor-pointer select-none overflow-visible ${
                    isSelected
                      ? "text-ds-accent"
                      : "text-ds-text-secondary hover:text-ds-text-primary"
                  }`}
                >
                  <span className="truncate block w-full py-0.5">{opt}</span>
                </button>
              );
            })
          )}
          {isLoadingMore && (
            <div className="py-1.5 text-center text-[10px] text-ds-text-secondary">Loading more...</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const JobSearchPage: React.FC = () => {
  const router = useRouter();
  const urlParams = useSearchParams();

  // Read search parameters from URL
  const urlSearch = urlParams?.get("q") || urlParams?.get("search") || "";
  const urlLocation = urlParams?.get("location") || "";
  const urlJobType = urlParams?.get("job_type") || "";
  const urlExperience = urlParams?.get("experience") || "";
  const urlWorkMode = urlParams?.get("work_mode") || "";
  const urlSalary = urlParams?.get("salary_range") || "";
  const urlDatePosted = urlParams?.get("date_posted") || "";
  const urlIndustry = urlParams?.get("industry") || "";
  const urlCompany = urlParams?.get("company") || "";
  const isVerifiedActive = urlParams?.get("verified") === "true";

  // Search input & scope dropdown state
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);

  const setMultipleFilters = useJobStore((state) => state.setMultipleFilters);

  // Sync URL parameters into Zustand job store
  useEffect(() => {
    setMultipleFilters({
      search: urlSearch,
      location: urlLocation,
      job_type: urlJobType,
      experience: urlExperience,
      work_mode: urlWorkMode,
      salary_range: urlSalary,
      date_posted: urlDatePosted,
      industry: urlIndustry,
      company: urlCompany,
      verified: isVerifiedActive ? "true" : undefined,
    });
    setSearchInput(urlSearch);
  }, [
    urlSearch,
    urlLocation,
    urlJobType,
    urlExperience,
    urlWorkMode,
    urlSalary,
    urlDatePosted,
    urlIndustry,
    urlCompany,
    isVerifiedActive,
    setMultipleFilters,
  ]);

  const {
    jobs,
    isLoading,
    isFetchingMore,
    hasMore,
    loadMore,
    applyToJob,
    withdrawJob,
    toggleSave,
  } = useJobs("Explore", urlSearch, urlLocation);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "120px",
  });

  useEffect(() => {
    if (inView && hasMore && !isFetchingMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isFetchingMore, isLoading, loadMore]);

  // Update URL helper maintaining other query parameters
  const updateUrl = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(urlParams?.toString() || "");
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === "") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      });
      router.push(`/jobs/search?${params.toString()}`);
    },
    [router, urlParams]
  );

  const handleSearchSubmit = (text: string) => {
    updateUrl({ q: text.trim() || null });
  };

  const getParamValues = useCallback(
    (key: string): string[] => {
      const val = urlParams?.get(key);
      if (!val) return [];
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    },
    [urlParams]
  );

  const handleMultiFilterToggle = useCallback(
    (paramKey: string, option: string) => {
      const current = getParamValues(paramKey);
      let next: string[];
      if (current.includes(option)) {
        next = current.filter((v) => v !== option);
      } else {
        next = [...current, option];
      }
      updateUrl({ [paramKey]: next.length > 0 ? next.join(",") : null });
    },
    [getParamValues, updateUrl]
  );

  const handleCustomSalaryApply = useCallback(
    (min: string, max: string) => {
      if (!min && !max) {
        updateUrl({ salary_range: null });
        return;
      }
      const customVal = `Custom:${min || "0"}-${max || "0"}`;
      updateUrl({ salary_range: customVal });
    },
    [updateUrl]
  );

  const handleClearAll = () => {
    router.push("/jobs/search");
  };

  // Static options lists
  const jobTypeOptions = [
    "Full time",
    "Part-time",
    "Contract",
    "Internship",
    "Freelance",
  ];
  const experienceOptions = [
    "Fresher",
    "Junior (1-3 yrs)",
    "Mid-level (3-5 yrs)",
    "Senior (5+ yrs)",
  ];
  const workModeOptions = ["Remote", "Hybrid", "Onsite"];
  const datePostedOptions = ["Today", "Last 7 days", "last 30 days"];

  // Memoized fetchers for cursor-paginated dropdowns
  const fetchIndustries = useCallback((q?: string, cursor?: string) => {
    return getPaginatedIndustries(q, cursor, 50);
  }, []);

  const fetchCompanies = useCallback((q?: string, cursor?: string) => {
    return getPaginatedCompanies(q, cursor, 8);
  }, []);

  const hasAnyFilter = Boolean(
    urlSearch ||
      urlJobType ||
      urlExperience ||
      urlWorkMode ||
      urlSalary ||
      urlDatePosted ||
      urlIndustry ||
      urlCompany ||
      isVerifiedActive
  );

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans flex flex-col items-center pb-20 select-none relative">
      {/* Back Button: 40px top, 40px left */}
      <button
        type="button"
        onClick={() => router.push("/jobs")}
        className="fixed top-6 left-4 sm:top-10 sm:left-10 z-50 inline-flex items-center gap-2 text-ds-text-primary font-medium font-dm-sans text-base leading-6 cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        aria-label="Back to Jobs"
      >
        <LeftArrowIcon size={20} className="size-5 text-ds-text-primary shrink-0" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Close (X) Button: 40px top, 40px right */}
      <button
        type="button"
        onClick={() => router.push("/jobs")}
        className="fixed top-6 right-4 sm:top-10 sm:right-10 z-50 size-6 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        aria-label="Close search"
      >
        <Icon icon="lucide:x" className="size-5 shrink-0" />
      </button>

      {/* Top Header Bar with Centered Search */}
      <header className="w-full px-4 sm:px-10 pt-6 sm:pt-10 flex items-center justify-center relative">
        {/* Center: Underline Search Input */}
        <div className="w-full max-w-[384px] h-10 px-3 py-1.5 border-b border-ds-border focus-within:border-ds-text-primary flex items-center justify-between gap-2 transition-colors">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchSubmit(searchInput);
              }
            }}
            placeholder="Discover jobs that match your skills..."
            className="w-full bg-transparent outline-none font-dm-sans text-base font-normal text-ds-text-primary placeholder:text-ds-text-muted leading-6 truncate"
          />
          <button
            type="button"
            onClick={() => handleSearchSubmit(searchInput)}
            className="size-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer shrink-0"
            aria-label="Search"
          >
            <Icon icon="solar:magnifer-linear" className="size-4 shrink-0" />
          </button>
        </div>
      </header>

      {/* Main Content (800px Width Centered) */}
      <main className="w-full max-w-[800px] flex flex-col items-center gap-10 mt-8 sm:mt-10 px-4 sm:px-0">
        {/* Filter Section */}
        <section className="self-stretch flex flex-col justify-start items-start gap-5">
          <div className="self-stretch flex flex-col justify-center items-start gap-3">
            {/* Filter Row 1 */}
            <div className="w-full flex flex-wrap items-center gap-3">
              {/* Scope Dropdown: Coming from /jobs route -> Only show Jobs option */}
              <Popover open={isScopeOpen} onOpenChange={setIsScopeOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-[10px] bg-ds-surface-1 border border-ds-accent text-base font-dm-sans font-medium leading-6 text-ds-text-primary select-none shrink-0 cursor-pointer"
                  >
                    <Icon
                      icon="solar:alt-arrow-down-linear"
                      className={`size-4 text-ds-text-primary shrink-0 transition-transform duration-200 ${
                        isScopeOpen ? "rotate-180" : "rotate-0"
                      }`}
                    />
                    <span>Jobs</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={8}
                  className="w-auto min-w-[142px] p-4 bg-ds-bg border border-ds-border rounded-[8px] shadow-2xl flex flex-col gap-3.5 z-[120]"
                >
                  <button
                    type="button"
                    onClick={() => setIsScopeOpen(false)}
                    className="w-full flex items-center min-h-[28px] text-left font-dm-sans text-sm leading-normal font-normal text-ds-accent cursor-pointer"
                  >
                    <span>Jobs</span>
                  </button>
                </PopoverContent>
              </Popover>

              {/* Row 1 Filter Chips */}
              <StandardFilterChip
                title="Job type"
                paramKey="job_type"
                options={jobTypeOptions}
                selectedValues={getParamValues("job_type")}
                onToggle={handleMultiFilterToggle}
              />
              <StandardFilterChip
                title="Experience"
                paramKey="experience"
                options={experienceOptions}
                selectedValues={getParamValues("experience")}
                onToggle={handleMultiFilterToggle}
              />
              <StandardFilterChip
                title="Work mode"
                paramKey="work_mode"
                options={workModeOptions}
                selectedValues={getParamValues("work_mode")}
                onToggle={handleMultiFilterToggle}
              />
              <SalaryFilterChip
                selectedValues={getParamValues("salary_range")}
                onToggle={handleMultiFilterToggle}
                onCustomApply={handleCustomSalaryApply}
              />
              <SearchableCursorFilterChip
                title="Industry"
                paramKey="industry"
                selectedValues={getParamValues("industry")}
                fetchData={fetchIndustries}
                onToggle={handleMultiFilterToggle}
              />
            </div>

            {/* Filter Row 2 (Indented to align under Job type on desktop) */}
            <div className="w-full pl-0 sm:pl-[96px] flex flex-wrap items-center gap-3">
              <StandardFilterChip
                title="Date posted"
                paramKey="date_posted"
                options={datePostedOptions}
                selectedValues={getParamValues("date_posted")}
                onToggle={handleMultiFilterToggle}
              />

              {/* Searchable Company Dropdown with Cursor Pagination */}
              <SearchableCursorFilterChip
                title="Company"
                paramKey="company"
                selectedValues={getParamValues("company")}
                fetchData={fetchCompanies}
                onToggle={handleMultiFilterToggle}
              />

              {/* Verified Toggle Chip (Only verified account jobs when active) */}
              <button
                type="button"
                onClick={() =>
                  updateUrl({ verified: isVerifiedActive ? null : "true" })
                }
                className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center transition-all cursor-pointer ${
                  isVerifiedActive
                    ? "bg-ds-surface-1 border border-ds-accent"
                    : "bg-transparent border border-ds-border hover:border-ds-text-muted"
                } text-base font-dm-sans font-medium leading-6 text-ds-text-primary select-none shrink-0`}
              >
                <span>Verified</span>
              </button>
            </div>
          </div>
        </section>

        {/* Results List */}
        <section className="self-stretch flex flex-col justify-start items-start gap-5">
          {isLoading ? (
            <div className="w-full flex flex-col gap-4">
              {[1, 2, 3, 4].map((n) => (
                <JobCardSkeleton key={n} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center text-center gap-3 bg-ds-surface-1 rounded-2xl border border-ds-border">
              <div className="size-12 rounded-full bg-ds-surface-2 border border-ds-border flex items-center justify-center text-ds-accent">
                <Icon icon="lucide:search-slash" className="size-6" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm px-4">
                <h4 className="text-ds-text-primary font-medium text-base font-dm-sans">
                  No jobs found
                </h4>
                <p className="text-ds-text-secondary text-xs font-normal font-dm-sans">
                  We couldn&apos;t find any job listings matching your selection.
                  Try adjusting your search query or filters.
                </p>
                {hasAnyFilter && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="mt-3 inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-ds-surface-2 hover:bg-ds-border text-ds-text-primary text-xs font-medium font-dm-sans transition-colors cursor-pointer self-center"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={(j) => router.push(`/jobs/${j.id}`)}
                  onApply={() => setApplyingJob(job)}
                  onSave={(jobId) => toggleSave(jobId)}
                  onWithdraw={(jobId) => withdrawJob(jobId)}
                />
              ))}

              {/* Infinite scroll loader trigger */}
              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="w-full py-4 flex justify-center items-center"
                >
                  {isFetchingMore ? (
                    <div className="flex items-center gap-2 text-ds-accent font-medium text-xs font-dm-sans">
                      <Icon
                        icon="lucide:loader-2"
                        className="size-4 animate-spin"
                      />
                      <span>Loading more jobs...</span>
                    </div>
                  ) : (
                    <div className="h-4 w-full" />
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Apply Job Modal */}
      <ApplyJobModal
        isOpen={applyingJob !== null}
        onClose={() => setApplyingJob(null)}
        onApply={async (resumeUrl, uploadedFile, resumeId, coverLetter) => {
          if (applyingJob) {
            await applyToJob(
              applyingJob.id,
              resumeUrl,
              uploadedFile,
              resumeId,
              coverLetter
            );
            setApplyingJob(null);
          }
        }}
        jobTitle={applyingJob?.title || ""}
      />
    </div>
  );
};

export default JobSearchPage;
