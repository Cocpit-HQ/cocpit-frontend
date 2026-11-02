import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { getOnboardingOptions } from "@/services/api/onboarding";
import { useDebounce } from "@/hooks/use-debounce";
import { Icon } from "@iconify/react";
import { Icon as CustomIcon } from "@/components/icons";
import { JobsFilter } from "../../types/jobs.types";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface JobFiltersProps {
  filters: JobsFilter;
  onFilterChange: (key: keyof JobsFilter, value: string) => void;
  onMultipleFilterChange?: (filters: Partial<JobsFilter>) => void;
  onClearFilters: () => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onFilterChange,
  onMultipleFilterChange,
  onClearFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] =
    useState<keyof JobsFilter>("job_type");
  const containerRef = useRef<HTMLDivElement>(null);

  // Independent quick tab filter state (applies to the list below only, completely decoupled from popup)
  const [activeQuickTab, setActiveQuickTab] = useState<{
    key: "job_type" | "work_mode" | "experience";
    val: string;
  } | null>(() => {
    if (filters.job_type === "Full time") return { key: "job_type", val: "Full time" };
    if (filters.work_mode === "Remote") return { key: "work_mode", val: "Remote" };
    if (filters.experience === "Fresher") return { key: "experience", val: "Fresher" };
    return null;
  });

  // Popup-specific filters (has no relation to quick tabs)
  const [localFilters, setLocalFilters] = useState<JobsFilter>({
    job_type: "",
    experience: "",
    work_mode: "",
    salary_range: "",
    date_posted: "",
    industry: "",
  });

  const [backendIndustries, setBackendIndustries] = useState<string[]>([]);
  const [industryCursor, setIndustryCursor] = useState<string | null>(null);
  const [hasMoreIndustries, setHasMoreIndustries] = useState(false);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(false);
  const [isLoadingMoreIndustries, setIsLoadingMoreIndustries] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const debouncedIndustrySearch = useDebounce(industrySearch, 250);
  const [customMinSalary, setCustomMinSalary] = useState("");
  const [customMaxSalary, setCustomMaxSalary] = useState("");

  // Close dropdowns when clicking outside (Desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth < 768) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Do not sync quick tabs into popup localFilters; keep them decoupled

  // Reset expanded section when popover closes so all sections remain closed by default
  useEffect(() => {
    if (!isOpen) {
      setExpandedSection(null);
    }
  }, [isOpen]);

  // Fetch industries from onboarding API matching Create Job (StepJobDetails)
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingIndustries(true);
    getOnboardingOptions("industries", undefined, undefined, 50)
      .then((res: any) => {
        if (!isCancelled && Array.isArray(res)) {
          setBackendIndustries(res.map((item: any) => item.label));
          const meta = res as unknown as { nextCursor?: string | null; hasMore?: boolean };
          setIndustryCursor(meta.nextCursor || null);
          setHasMoreIndustries(Boolean(meta.hasMore));
        }
      })
      .catch((err) => console.error("Failed to load industries", err))
      .finally(() => {
        if (!isCancelled) setIsLoadingIndustries(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  // Live debounced search effect for industry matching Create Job
  useEffect(() => {
    let isCurrent = true;
    setIsLoadingIndustries(true);

    getOnboardingOptions("industries", debouncedIndustrySearch.trim() || undefined, undefined, 50)
      .then((res: any) => {
        if (isCurrent && Array.isArray(res)) {
          setBackendIndustries(res.map((item: any) => item.label));
          const meta = res as unknown as { nextCursor?: string | null; hasMore?: boolean };
          setIndustryCursor(meta.nextCursor || null);
          setHasMoreIndustries(Boolean(meta.hasMore));
        }
      })
      .catch((err) => {
        console.error("Failed to search industries:", err);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingIndustries(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedIndustrySearch]);

  // Load more via cursor when scrolling to bottom of list
  const handleIndustryScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (isLoadingMoreIndustries || !hasMoreIndustries || !industryCursor) return;

      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
        setIsLoadingMoreIndustries(true);
        try {
          const res = await getOnboardingOptions(
            "industries",
            debouncedIndustrySearch.trim() || undefined,
            industryCursor,
            50
          );
          setBackendIndustries((prev) => {
            const existing = new Set(prev);
            const newItems = res
              .map((item: any) => item.label)
              .filter((label: string) => !existing.has(label));
            return [...prev, ...newItems];
          });
          setIndustryCursor((res as any).nextCursor || null);
          setHasMoreIndustries(Boolean((res as any).hasMore));
        } catch (err) {
          console.error("Failed to load more industries:", err);
        } finally {
          setIsLoadingMoreIndustries(false);
        }
      }
    },
    [isLoadingMoreIndustries, hasMoreIndustries, industryCursor, debouncedIndustrySearch]
  );

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
  const salaryOptions = ["Under 3L", "3L-5L", "6L-10L", "10L+", "Other"];
  const datePostedOptions = ["Today", "Last 7 days", "last 30 days"];

  // Helper to extract values array from filter
  const getSelectedValues = (key: keyof JobsFilter): string[] => {
    const raw = localFilters[key];
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    return raw
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  };

  // Single toggle helper for staging filter category selections
  const toggleFilter = (
    key: keyof JobsFilter,
    value: string,
    isMultiSelect = true,
  ) => {
    const selected = getSelectedValues(key);
    let nextVal = "";

    if (!isMultiSelect) {
      nextVal = selected.includes(value) ? "" : value;
    } else {
      if (value === "") {
        nextVal = "";
      } else if (selected.includes(value)) {
        nextVal = selected.filter((v) => v !== value).join(",");
      } else {
        nextVal = [...selected, value].join(",");
      }
    }

    setLocalFilters((prev) => ({ ...prev, [key]: nextVal }));
  };

  // Compute if Apply should be active/orange (only based on selections inside the popup)
  const isApplyActive = useMemo(() => {
    return Object.values(localFilters).some(Boolean);
  }, [localFilters]);

  // Compute if any filter options are selected (controls visibility of Clear button per SCRUM-1560)
  const hasSelectedFilters = useMemo(() => {
    return (
      Object.values(localFilters).some((val) => Boolean(val && (typeof val === 'string' ? val.trim() : val))) ||
      Boolean(customMinSalary) ||
      Boolean(customMaxSalary)
    );
  }, [localFilters, customMinSalary, customMaxSalary]);

  // Handle exclusive selection for the 3 quick tabs (applies to below list only, no relation to popup)
  const handleQuickTabClick = (
    key: "job_type" | "work_mode" | "experience",
    value: string,
  ) => {
    if (activeQuickTab?.val === value) {
      // Toggle off
      setActiveQuickTab(null);
      onFilterChange(key, "");
      return;
    }

    // Clear previous quick tab if key was different
    if (activeQuickTab && activeQuickTab.key !== key) {
      onFilterChange(activeQuickTab.key, "");
    }

    setActiveQuickTab({ key, val: value });
    onFilterChange(key, value);
  };

  const handleApply = () => {
    if (!hasSelectedFilters) {
      return;
    }

    const finalFilters = { ...localFilters };
    if (
      finalFilters.salary_range?.includes("Other") &&
      (customMinSalary || customMaxSalary)
    ) {
      finalFilters.salary_range = `Custom:${customMinSalary || "0"}-${customMaxSalary || "0"}`;
    }

    if (onMultipleFilterChange) {
      onMultipleFilterChange(finalFilters);
    } else {
      Object.entries(finalFilters).forEach(([key, val]) => {
        onFilterChange(key as keyof JobsFilter, val as string);
      });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    const cleared: JobsFilter = {
      job_type: "",
      experience: "",
      work_mode: "",
      salary_range: "",
      date_posted: "",
      industry: "",
    };
    setLocalFilters(cleared);
    setCustomMinSalary("");
    setCustomMaxSalary("");
    onClearFilters?.();
  };

  const renderAccordionSection = (
    label: string,
    key: keyof JobsFilter,
    options: string[],
    isMultiSelect = true,
  ) => {
    const isExpanded = expandedSection === key;
    const selected = getSelectedValues(key);

    return (
      <div className="w-[176px] flex flex-col shrink-0">
        <button
          type="button"
          onClick={() =>
            setExpandedSection((prev) => (prev === key ? null : key))
          }
          aria-expanded={isExpanded}
          className="w-[176px] h-9 px-3 py-1.5 rounded-full flex items-center justify-between gap-2 hover:bg-ds-surface-1 transition-colors cursor-pointer shrink-0 select-none"
        >
          <span className="flex-1 text-left font-dm-sans font-normal text-base leading-6 text-ds-text-primary flex items-center gap-1.5 truncate">
            {label}
            {selected.length > 0 && (
              <span className="size-1.5 rounded-full bg-ds-accent shrink-0" />
            )}
          </span>
          <Icon
            icon={
              isExpanded
                ? "solar:alt-arrow-up-linear"
                : "solar:alt-arrow-down-linear"
            }
            className="w-5 h-5 text-ds-text-primary shrink-0 transition-transform duration-150"
          />
        </button>

        {isExpanded && (
          <div className="w-[176px] flex flex-col pl-3 pr-1 py-1 gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {options.map((opt) => {
              const isSelected =
                opt === "" ? selected.length === 0 : selected.includes(opt);
              return (
                <div key={opt} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => toggleFilter(key, opt, isMultiSelect)}
                    className={
                      "w-full py-1 text-left text-xs font-dm-sans transition-colors cursor-pointer truncate " +
                      (isSelected
                        ? "text-ds-accent font-medium"
                        : "text-ds-text-secondary hover:text-ds-text-primary")
                    }
                  >
                    {opt === "" ? "All" : opt}
                  </button>
                  {key === "salary_range" && opt === "Other" && isSelected && (
                    <div className="flex flex-col gap-1.5 py-1.5 pl-1 pr-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-ds-text-secondary font-dm-sans">
                          Min
                        </span>
                        <input
                          type="number"
                          placeholder="0"
                          value={customMinSalary}
                          onChange={(e) => setCustomMinSalary(e.target.value)}
                          className="w-16 h-6 px-1.5 text-xs text-right bg-ds-surface-1 border border-ds-border rounded text-ds-text-primary outline-none focus:border-ds-accent"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-ds-text-secondary font-dm-sans">
                          Max
                        </span>
                        <input
                          type="number"
                          placeholder="0"
                          value={customMaxSalary}
                          onChange={(e) => setCustomMaxSalary(e.target.value)}
                          className="w-16 h-6 px-1.5 text-xs text-right bg-ds-surface-1 border border-ds-border rounded text-ds-text-primary outline-none focus:border-ds-accent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Active options map for mobile drawer
  const mobileCategoryOptions: Record<string, string[]> = {
    job_type: jobTypeOptions,
    experience: experienceOptions,
    work_mode: workModeOptions,
    salary_range: salaryOptions,
    date_posted: datePostedOptions,
  };

  return (
    <div
      className="w-full max-w-[800px] h-10 flex justify-between items-center relative select-none"
      ref={containerRef}
    >
      {/* Frame 2609925: Quick Filters (Full time: 89px, Remote: 82px, Fresher: 81px) */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-9">
        {[
          { key: "job_type" as const, val: "Full time", width: "w-[89px]" },
          { key: "work_mode" as const, val: "Remote", width: "w-[82px]" },
          { key: "experience" as const, val: "Fresher", width: "w-[81px]" },
        ].map(({ key, val, width }) => {
          const isActive = activeQuickTab?.val === val;
          return (
            <button
              type="button"
              key={val}
              onClick={() => handleQuickTabClick(key, val)}
              className={`relative h-9 ${width} flex flex-col justify-center items-center text-sm sm:text-base font-medium font-dm-sans transition-colors shrink-0 cursor-pointer ${
                isActive
                  ? "text-ds-text-primary"
                  : "text-ds-text-secondary hover:text-ds-text-primary"
              }`}
            >
              <span>{val}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ds-accent shadow-sm" />
              )}
            </button>
          );
        })}
      </div>

      <div className="relative shrink-0 flex items-center">
        {/* Main Filters Button (nav bar icon 40px by 40px) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="size-10 rounded-full flex items-center justify-center text-ds-text-primary hover:bg-ds-surface-1 transition-colors relative cursor-pointer"
          aria-label="Filter jobs"
          aria-expanded={isOpen}
        >
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <CustomIcon
              name="filter"
              size={24}
              className="w-6 h-6 text-ds-text-primary"
            />
          </div>
        </button>

        {/* Desktop Popover */}
        {isOpen && (
          <div className="hidden md:flex flex-col absolute right-0 top-11 w-[200px] min-h-[268px] max-h-[460px] overflow-y-auto overflow-x-hidden no-scrollbar bg-ds-bg rounded-[8px_0px_8px_8px] border border-ds-border/60 shadow-2xl p-[8px_12px] z-50 animate-in fade-in slide-in-from-top-2 duration-150 select-none">
            {/* Frame 2609314: Header */}
            <div className="w-[176px] h-9 flex flex-row justify-between items-center shrink-0 mb-1">
              <button
                type="button"
                onClick={handleApply}
                className={`h-9 px-3 py-1.5 rounded-lg flex items-center justify-center font-dm-sans font-medium text-base leading-6 transition-colors cursor-pointer shrink-0 ${isApplyActive ? "text-ds-accent hover:opacity-90" : "text-ds-text-primary hover:bg-ds-surface-1"}`}
              >
                Apply
              </button>
              {hasSelectedFilters && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-8 px-3 py-1.5 rounded-lg flex items-center justify-center font-dm-sans font-normal text-sm leading-5 text-ds-error hover:bg-ds-surface-1 transition-colors cursor-pointer shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Categories in exact Figma order */}
            <div className="flex flex-col gap-0 overflow-y-auto no-scrollbar">
              {renderAccordionSection("Job type", "job_type", jobTypeOptions)}
              {renderAccordionSection(
                "Experience level",
                "experience",
                experienceOptions,
              )}
              {renderAccordionSection(
                "Work mode",
                "work_mode",
                workModeOptions,
              )}
              {renderAccordionSection(
                "Salary range",
                "salary_range",
                salaryOptions,
              )}
              {renderAccordionSection(
                "Date posted",
                "date_posted",
                datePostedOptions,
                false,
              )}

              {/* Accordion: Industry */}
              <div className="w-[176px] flex flex-col shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSection((prev) =>
                      prev === "industry" ? null : "industry",
                    )
                  }
                  aria-expanded={expandedSection === "industry"}
                  className="w-[176px] h-9 px-3 py-1.5 rounded-full flex items-center justify-between gap-2 hover:bg-ds-surface-1 transition-colors cursor-pointer shrink-0 select-none"
                >
                  <span className="flex-1 text-left font-dm-sans font-normal text-base leading-6 text-ds-text-primary flex items-center gap-1.5 truncate">
                    Industry
                    {Boolean(localFilters.industry) && (
                      <span className="size-1.5 rounded-full bg-ds-accent shrink-0" />
                    )}
                  </span>
                  <Icon
                    icon={
                      expandedSection === "industry"
                        ? "solar:alt-arrow-up-linear"
                        : "solar:alt-arrow-down-linear"
                    }
                    className="w-5 h-5 text-ds-text-primary shrink-0 transition-transform duration-150"
                  />
                </button>
                {expandedSection === "industry" && (
                  <div className="w-[176px] flex flex-col pl-3 pr-1 pt-1 gap-1.5 animate-in fade-in duration-150">
                    {/* Search box matching Figma: clean underline input with "Search" placeholder */}
                    <div className="w-full border-b border-ds-border focus-within:border-ds-accent transition-colors pb-1">
                      <input
                        type="text"
                        placeholder="Search"
                        value={industrySearch}
                        onChange={(e) => setIndustrySearch(e.target.value)}
                        className="w-full bg-transparent text-sm font-dm-sans text-ds-text-primary placeholder:text-ds-text-muted outline-none py-1 px-0"
                      />
                    </div>

                    {/* Scrollable list with min-w-0 so text is 100% visible with no dots bug */}
                    <div
                      onScroll={handleIndustryScroll}
                      className="w-full flex flex-col gap-1 max-h-44 overflow-y-auto no-scrollbar"
                    >
                      {(() => {
                        const selectedValues = getSelectedValues("industry");

                        return (
                          <>
                            {backendIndustries.length === 0 && !isLoadingIndustries ? (
                              <div className="py-1 text-xs text-ds-text-muted font-dm-sans">
                                No industries found
                              </div>
                            ) : (
                              backendIndustries.map((opt) => {
                                const isSelected = selectedValues.includes(opt);
                                return (
                                  <div key={opt} className="w-full min-w-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleFilter("industry", opt)
                                      }
                                      className={
                                        "w-full py-1 text-left text-xs font-dm-sans transition-colors cursor-pointer flex items-center " +
                                        (isSelected
                                          ? "text-ds-accent font-medium"
                                          : "text-ds-text-secondary hover:text-ds-text-primary")
                                      }
                                    >
                                      <span className="flex-1 min-w-0 truncate text-left">
                                        {opt}
                                      </span>
                                    </button>
                                  </div>
                                );
                              })
                            )}
                            {(isLoadingIndustries || isLoadingMoreIndustries) && (
                              <div className="py-1 text-xs text-ds-text-muted font-dm-sans">
                                Loading...
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <div className="md:hidden">
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
              <DrawerContent className="h-[80vh] bg-ds-bg border-t border-ds-border rounded-t-2xl z-[80] flex flex-col overflow-hidden text-ds-text-primary">
                <DrawerTitle className="sr-only">Filters</DrawerTitle>
                <div className="flex justify-between items-center w-full px-5 py-4 border-b border-ds-border shrink-0">
                  <span className="font-dm-sans font-medium text-lg text-ds-text-primary flex items-center gap-2">
                    Filters
                    {Object.values(localFilters).some(Boolean) && (
                      <span className="bg-ds-accent text-ds-text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {
                          Object.values(localFilters).filter((v) => v !== "")
                            .length
                        }
                      </span>
                    )}
                  </span>
                  {hasSelectedFilters && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="font-dm-sans text-xs text-ds-error hover:opacity-80 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Category list on the left (matches desktop sequence) */}
                  <div className="w-32 border-r border-ds-border overflow-y-auto pt-2">
                    {[
                      { id: "job_type" as const, label: "Job Type" },
                      { id: "experience" as const, label: "Experience" },
                      { id: "work_mode" as const, label: "Work Mode" },
                      { id: "salary_range" as const, label: "Salary" },
                      { id: "date_posted" as const, label: "Date Posted" },
                      { id: "industry" as const, label: "Industry" },
                    ].map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setActiveMobileTab(cat.id)}
                        className={`w-full text-left py-3 px-3.5 text-xs font-dm-sans transition-colors cursor-pointer ${
                          activeMobileTab === cat.id
                            ? "border-l-2 border-ds-accent text-ds-accent bg-ds-surface-1 font-medium"
                            : "text-ds-text-secondary border-l-2 border-transparent"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Options list on the right */}
                  <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col">
                    {activeMobileTab === "industry" ? (
                      <div className="flex flex-col gap-2 pt-2">
                        <div className="w-full border-b border-ds-border focus-within:border-ds-accent transition-colors pb-1">
                          <input
                            type="text"
                            placeholder="Search"
                            value={industrySearch}
                            onChange={(e) => setIndustrySearch(e.target.value)}
                            className="w-full bg-transparent text-sm font-dm-sans text-ds-text-primary placeholder:text-ds-text-muted outline-none py-1.5 px-0"
                          />
                        </div>
                        {backendIndustries
                          .map((opt) => {
                            const isSel =
                              getSelectedValues("industry").includes(opt);
                            return (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => toggleFilter("industry", opt)}
                                className="flex justify-between items-center py-2.5 text-sm font-dm-sans transition-colors w-full cursor-pointer"
                              >
                                <span
                                  className={
                                    isSel
                                      ? "text-ds-accent font-medium"
                                      : "text-ds-text-primary"
                                  }
                                >
                                  {opt}
                                </span>
                                {isSel && (
                                  <Icon
                                    icon="lucide:check"
                                    className="w-4 h-4 text-ds-accent"
                                  />
                                )}
                              </button>
                            );
                          })}
                      </div>
                    ) : (
                      (mobileCategoryOptions[activeMobileTab] || []).map(
                        (opt) => {
                          const currentVals =
                            getSelectedValues(activeMobileTab);
                          const isSel =
                            opt === ""
                              ? currentVals.length === 0
                              : currentVals.includes(opt);
                          return (
                            <div key={opt} className="flex flex-col">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleFilter(activeMobileTab, opt)
                                }
                                className="flex justify-between items-center py-3 text-sm font-dm-sans transition-colors w-full cursor-pointer"
                              >
                                <span
                                  className={
                                    isSel
                                      ? "text-ds-accent font-medium"
                                      : "text-ds-text-primary"
                                  }
                                >
                                  {opt === "" ? "All" : opt}
                                </span>
                                {isSel && (
                                  <Icon
                                    icon="lucide:check"
                                    className="w-4 h-4 text-ds-accent"
                                  />
                                )}
                              </button>
                              {activeMobileTab === "salary_range" &&
                                opt === "Other" &&
                                isSel && (
                                  <div className="flex flex-col gap-2 pb-3 px-1 animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-xs text-ds-text-secondary font-dm-sans">
                                        Min
                                      </span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={customMinSalary}
                                        onChange={(e) =>
                                          setCustomMinSalary(e.target.value)
                                        }
                                        className="w-24 h-8 px-2 text-xs text-right bg-ds-surface-1 border border-ds-border rounded text-ds-text-primary outline-none focus:border-ds-accent"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-xs text-ds-text-secondary font-dm-sans">
                                        Max
                                      </span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={customMaxSalary}
                                        onChange={(e) =>
                                          setCustomMaxSalary(e.target.value)
                                        }
                                        className="w-24 h-8 px-2 text-xs text-right bg-ds-surface-1 border border-ds-border rounded text-ds-text-primary outline-none focus:border-ds-accent"
                                      />
                                    </div>
                                  </div>
                                )}
                            </div>
                          );
                        },
                      )
                    )}
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-ds-bg border-t border-ds-border flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="w-full sm:w-auto px-6 py-2 rounded-full bg-ds-accent hover:bg-ds-accent/90 text-ds-text-primary font-medium font-dm-sans text-sm cursor-pointer shadow-md"
                  >
                    Apply Filters
                  </button>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobFilters;
