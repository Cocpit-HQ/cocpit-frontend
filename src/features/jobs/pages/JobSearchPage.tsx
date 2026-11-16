"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Check, Search } from "lucide-react";
import { SearchPillChevron } from "@/features/search/components/SearchPillChevron";
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
import NoMatchingJobsState from "../components/states/NoMatchingJobsState";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getPaginatedIndustries,
  getPaginatedCompanies,
  CursorPaginatedResult,
} from "../services/jobs.service";
import { SearchableLocationFilterChip } from '@/features/search/components/filters/SearchableLocationFilterChip';

export interface LocationFilterChipProps {
  selectedValues: string[];
  onToggle: (paramKey: string, opt: string) => void;
}

export const LocationFilterChip: React.FC<LocationFilterChipProps> = ({
  selectedValues,
  onToggle,
}) => {
  return (
    <SearchableLocationFilterChip
      selectedValues={selectedValues}
      onToggle={(loc) => onToggle('location', loc)}
    />
  );
};

// Standard fixed-options dropdown chip (Job type, Experience, Work mode, Date posted)
export interface StandardFilterChipProps {
  title: string;
  paramKey: string;
  options: string[];
  selectedValues: string[];
  onToggle: (paramKey: string, opt: string) => void;
}

/* [DEPRECATED / PRESERVED]: Previous StandardFilterChip without checkmarks / selection-pinning preserved for auditability.
const StandardFilterChipLegacy: React.FC<StandardFilterChipProps> = ...
*/
export const StandardFilterChip: React.FC<StandardFilterChipProps> = ({
  title,
  paramKey,
  options,
  selectedValues,
  onToggle,
}) => {
  const [open, setOpen] = useState(false);
  const isActive = selectedValues.length > 0;
  const openSnapshotRef = useRef<string[]>([]);

  useEffect(() => {
    if (open) {
      openSnapshotRef.current = [...selectedValues];
    }
  }, [open]);

  const displayOptions = useMemo(() => {
    if (selectedValues.length === 0) return options;
    const snapshot =
      openSnapshotRef.current.length > 0 ? openSnapshotRef.current : selectedValues;
    const topItems: string[] = [];
    const seen = new Set<string>();

    snapshot.forEach((val) => {
      if (!seen.has(val) && options.includes(val)) {
        seen.add(val);
        topItems.push(val);
      }
    });

    const bottomItems = options.filter((opt) => !seen.has(opt));
    return [...topItems, ...bottomItems];
  }, [options, selectedValues]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          openSnapshotRef.current = [...selectedValues];
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-2 transition-all cursor-pointer font-dm-sans font-medium text-base leading-6 select-none shrink-0 ${
            isActive
              ? "bg-ds-bg border border-ds-accent text-ds-text-primary"
              : "bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted"
          }`}
        >
          <SearchPillChevron open={open} className="text-ds-text-primary" />
          <span>{title}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto min-w-fit p-4 bg-ds-bg border border-ds-border rounded-[10px] shadow-2xl flex flex-col items-start gap-3.5 z-[120] focus:outline-none focus:ring-0"
      >
        {displayOptions.map((opt) => {
          const isSelected = selectedValues.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(paramKey, opt)}
              className={`font-dm-sans text-sm leading-normal transition-colors cursor-pointer select-none whitespace-nowrap outline-none bg-transparent hover:bg-transparent border-none p-0 text-left ${
                isSelected
                  ? "text-ds-accent font-normal"
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
export interface SalaryFilterChipProps {
  selectedValues: string[];
  onToggle: (paramKey: string, opt: string) => void;
  onCustomApply: (min: string, max: string) => void;
}

/* [DEPRECATED / PRESERVED]: Previous SalaryFilterChip preserved for auditability.
const SalaryFilterChipLegacy: React.FC<SalaryFilterChipProps> = ...
*/
export const SalaryFilterChip: React.FC<SalaryFilterChipProps> = ({
  selectedValues,
  onToggle,
  onCustomApply,
}) => {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const presets = useMemo(() => ["Under 3L", "3L-5L", "6L-10L", "10L+"], []);
  const isCustomActive = selectedValues.some((v) => v.startsWith("Custom:"));
  const isActive = selectedValues.length > 0;
  const openSnapshotRef = useRef<string[]>([]);

  useEffect(() => {
    if (open) {
      openSnapshotRef.current = [...selectedValues];
    }
  }, [open]);

  useEffect(() => {
    const customItem = selectedValues.find((v) => v.startsWith("Custom:"));
    if (customItem) {
      setShowCustom(true);
      const parts = customItem.replace("Custom:", "").split("-");
      if (parts[0]) setCustomMin(parts[0]);
      if (parts[1]) setCustomMax(parts[1]);
    }
  }, [selectedValues]);

  const displayPresets = useMemo(() => {
    if (selectedValues.length === 0) return presets;
    const snapshot =
      openSnapshotRef.current.length > 0 ? openSnapshotRef.current : selectedValues;
    const topItems: string[] = [];
    const seen = new Set<string>();

    snapshot.forEach((val) => {
      if (!seen.has(val) && presets.includes(val)) {
        seen.add(val);
        topItems.push(val);
      }
    });

    const bottomItems = presets.filter((p) => !seen.has(p));
    return [...topItems, ...bottomItems];
  }, [presets, selectedValues]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          openSnapshotRef.current = [...selectedValues];
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-2 transition-all cursor-pointer font-dm-sans font-medium text-base leading-6 select-none shrink-0 ${
            isActive
              ? "bg-ds-bg border border-ds-accent text-ds-text-primary"
              : "bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted"
          }`}
        >
          <SearchPillChevron open={open} className="text-ds-text-primary" />
          <span>Salary</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto min-w-fit p-4 bg-ds-bg border border-ds-border rounded-[10px] shadow-2xl flex flex-col items-start gap-3.5 z-[120] focus:outline-none focus:ring-0"
      >
        {displayPresets.map((opt) => {
          const isSelected = selectedValues.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle("salary_range", opt)}
              className={`font-dm-sans text-sm leading-normal transition-colors cursor-pointer select-none whitespace-nowrap outline-none bg-transparent hover:bg-transparent border-none p-0 text-left ${
                isSelected
                  ? "text-ds-accent font-normal"
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
          className={`font-dm-sans text-sm leading-normal transition-colors cursor-pointer select-none whitespace-nowrap outline-none bg-transparent hover:bg-transparent border-none p-0 text-left ${
            showCustom || isCustomActive
              ? "text-ds-accent font-normal"
              : "text-ds-text-secondary hover:text-ds-text-primary"
          }`}
        >
          <span>Other</span>
        </button>

        {/* Min / Max Inputs when Other is selected */}
        {showCustom && (
          <div className="flex flex-col gap-2.5 pt-1 w-full animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-6 font-dm-sans text-sm text-ds-text-secondary">
              <span>Min</span>
              <input
                type="number"
                placeholder="0"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-12 bg-transparent text-right text-sm text-ds-text-primary outline-none focus:text-ds-accent"
              />
            </div>
            <div className="flex items-center justify-between gap-6 font-dm-sans text-sm text-ds-text-secondary">
              <span>Max</span>
              <input
                type="number"
                placeholder="0"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                className="w-12 bg-transparent text-right text-sm text-ds-text-primary outline-none focus:text-ds-accent"
              />
            </div>
            <button
              type="button"
              onClick={() => onCustomApply(customMin, customMax)}
              className="pt-1 text-xs text-ds-accent hover:underline font-medium text-left cursor-pointer font-dm-sans"
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
import {
  SearchableCursorFilterChip,
  type SearchableCursorFilterChipProps,
} from '@/features/search/components/filters/SearchableCursorFilterChip';

export {
  SearchableCursorFilterChip,
  type SearchableCursorFilterChipProps,
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
      params.set("type", "jobs");
      router.push(`/search?${params.toString()}`);
    },
    [router, urlParams]
  );

  const handleSearchSubmit = (text: string) => {
    updateUrl({ q: text.trim() || null });
  };

  const handleBack = () => {
    const returnTo = urlParams?.get('returnTo');
    if (returnTo && returnTo.startsWith('/')) {
      router.replace(returnTo);
      return;
    }
    const lastSearch = typeof window !== 'undefined' ? sessionStorage.getItem('cocpit_last_search_url') : null;
    if (lastSearch && lastSearch.startsWith('/search') && !lastSearch.includes('/search?type=jobs')) {
      router.replace(lastSearch);
      return;
    }
    router.push('/jobs');
  };

  const handleClose = () => {
    const returnTo = urlParams?.get('returnTo');
    if (returnTo && returnTo.startsWith('/')) {
      router.replace(returnTo);
      return;
    }
    const lastSearch = typeof window !== 'undefined' ? sessionStorage.getItem('cocpit_last_search_url') : null;
    if (lastSearch && lastSearch.startsWith('/search') && !lastSearch.includes('/search?type=jobs')) {
      router.replace(lastSearch);
      return;
    }
    router.push('/jobs');
  };

  const getParamValues = useCallback(
    (key: string): string[] => {
      const val = urlParams?.get(key);
      if (!val) return [];
      const delimiter = key === "location" ? "|" : ",";
      return val
        .split(delimiter)
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
      const delimiter = paramKey === "location" ? "|" : ",";
      updateUrl({ [paramKey]: next.length > 0 ? next.join(delimiter) : null });
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
    const qVal = urlParams?.get("q") || urlParams?.get("search");
    if (qVal) {
      router.push(`/search?type=jobs&q=${encodeURIComponent(qVal)}`);
    } else {
      router.push("/search?type=jobs");
    }
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
        onClick={handleBack}
        className="hidden md:inline-flex fixed top-[40px] left-[40px] z-50 items-center gap-2 p-0 text-ds-text-primary font-medium font-dm-sans text-base leading-6 cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        aria-label="Back"
      >
        <LeftArrowIcon size={20} className="size-5 text-ds-text-primary shrink-0" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Close (X) Button: 40px top, 40px right */}
      <button
        type="button"
        onClick={handleClose}
        className="hidden md:flex fixed top-[40px] right-[40px] z-50 size-6 items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        aria-label="Close search"
      >
        <Icon icon="lucide:x" className="size-5 shrink-0" />
      </button>

      {/* Mobile Header: back + search + search icon */}
      <header className="md:hidden w-full px-4 pt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center text-ds-text-primary cursor-pointer shrink-0 bg-transparent border-none outline-none"
          aria-label="Back to Jobs"
        >
          <Icon icon="solar:alt-arrow-left-linear" className="size-5 shrink-0" />
        </button>
        <div className="flex-1 h-10 px-3 py-1.5 border-b border-ds-border focus-within:border-ds-text-primary flex items-center gap-2 transition-colors">
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
        </div>
        <button
          type="button"
          onClick={() => handleSearchSubmit(searchInput)}
          className="flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors cursor-pointer shrink-0 bg-transparent border-none outline-none"
          aria-label="Search"
        >
          <Icon icon="solar:magnifer-linear" className="size-5 shrink-0" />
        </button>
      </header>

      {/* Desktop Header: Centered Search */}
      <header className="hidden md:flex w-full px-4 sm:px-10 pt-6 sm:pt-10 items-center justify-center relative">
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
      <main className="w-full max-w-[800px] flex flex-col items-center gap-0 md:gap-10 mt-4 md:mt-8 lg:mt-10 px-4 md:px-0">
        {/* Filter Section */}
        <section className="self-stretch flex flex-col justify-start items-start gap-5">
          <div className="self-stretch flex flex-col justify-center items-start gap-3">
            {/* Filter Row 1 — Desktop only */}
            <div className="hidden md:flex w-full flex-wrap items-center gap-3">
              {/* Scope Dropdown: Coming from /jobs route -> Only show Jobs option */}
              <Popover open={isScopeOpen} onOpenChange={setIsScopeOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-2 bg-ds-bg border border-ds-accent text-base font-dm-sans font-medium leading-6 text-ds-text-primary select-none shrink-0 cursor-pointer shadow-sm"
                  >
                    <SearchPillChevron open={isScopeOpen} className="text-ds-text-primary" />
                    <span>Jobs</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={8}
                  className="p-[12px] w-auto min-w-[90px] bg-ds-bg border border-ds-border rounded-[8px] flex flex-col items-start gap-[16px] shadow-2xl z-[120] focus:outline-none focus:ring-0"
                >
                  {[
                    { id: 'all', label: 'All', type: 'all' },
                    { id: 'people', label: 'People', type: 'people' },
                    { id: 'jobs', label: 'Jobs', type: 'jobs' },
                    { id: 'companies', label: 'Company', type: 'companies' },
                    { id: 'institutes', label: 'Institution', type: 'institutes' },
                    { id: 'posts', label: 'Posts', type: 'posts' },
                    { id: 'hashtags', label: 'Hashtags', type: 'hashtags' },
                  ].map((scope) => {
                    const isJobs = scope.id === 'jobs';
                    return (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => {
                          setIsScopeOpen(false);
                          if (!isJobs) {
                            const currentQuery = (searchInput || urlSearch || '').trim();
                            const qParam = currentQuery ? `&q=${encodeURIComponent(currentQuery)}` : '';
                            router.push(`/search?type=${scope.type}${qParam}`);
                          }
                        }}
                        className={`font-dm-sans text-[14px] leading-[20px] font-normal transition-colors cursor-pointer text-left whitespace-nowrap outline-none bg-transparent border-none p-0 ${
                          isJobs
                            ? 'text-ds-accent'
                            : 'text-ds-text-secondary hover:text-ds-text-primary'
                        }`}
                      >
                        <span>{scope.label}</span>
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>

              {/* Row 1 Filter Chips: Job type, Experience, Work mode, Salary, Industry */}
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

            {/* Filter Row 2 (Indented to align under Job type on desktop) — Desktop only */}
            <div className="hidden md:flex w-full pl-0 sm:pl-[96px] flex flex-wrap items-center gap-3">
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
                className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-2 transition-all cursor-pointer font-dm-sans font-medium text-base leading-6 text-ds-text-primary select-none shrink-0 ${
                  isVerifiedActive
                    ? "bg-ds-bg border border-ds-accent text-ds-text-primary"
                    : "bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted"
                }`}
              >
                <span>Verified</span>
                {isVerifiedActive && <Check className="size-4 text-ds-accent" />}
              </button>
            </div>
          </div>

          {/* Mobile Filter Bar — horizontal scroll, single row */}
          <div className="flex md:hidden w-full items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap py-1 select-none shrink-0">
            {/* Scope chip — always active/accent */}
            <Popover open={isScopeOpen} onOpenChange={setIsScopeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-[10px] bg-ds-surface-1 border border-ds-accent text-base font-dm-sans font-medium leading-6 text-ds-text-primary select-none shrink-0 cursor-pointer"
                >
                  <Icon
                    icon="solar:alt-arrow-down-linear"
                    className={`size-4 text-ds-text-primary shrink-0 transition-transform duration-200 ${isScopeOpen ? "rotate-180" : "rotate-0"}`}
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
            <StandardFilterChip
              title="Date posted"
              paramKey="date_posted"
              options={datePostedOptions}
              selectedValues={getParamValues("date_posted")}
              onToggle={handleMultiFilterToggle}
            />
            <SearchableCursorFilterChip
              title="Company"
              paramKey="company"
              selectedValues={getParamValues("company")}
              fetchData={fetchCompanies}
              onToggle={handleMultiFilterToggle}
            />
            <button
              type="button"
              onClick={() => updateUrl({ verified: isVerifiedActive ? null : "true" })}
              className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center transition-all cursor-pointer ${
                isVerifiedActive
                  ? "bg-ds-surface-1 border border-ds-accent"
                  : "bg-transparent border border-ds-border"
              } text-base font-dm-sans font-medium leading-6 text-ds-text-primary select-none shrink-0`}
            >
              <span>Verified</span>
            </button>
          </div>
        </section>

        {/* Results List */}
        {/* Mobile "Jobs" section title (20px from top filter bar, 20px below to cards) */}
        <h2 className="md:hidden w-full font-dm-sans font-medium text-base leading-6 text-ds-text-primary mt-5 mb-2">Jobs</h2>
        <section className="self-stretch flex flex-col justify-start items-start gap-4 md:gap-5">
          {isLoading ? (
            <div className="w-full flex flex-col gap-4">
              {[1, 2, 3, 4].map((n) => (
                <JobCardSkeleton key={n} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <NoMatchingJobsState onClearFilters={handleClearAll} />
          ) : (
            <>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={(j) => router.push(`/jobs/${j.id}?returnTo=${encodeURIComponent(`/search?${urlParams?.toString() || "type=jobs"}`)}`)}
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
