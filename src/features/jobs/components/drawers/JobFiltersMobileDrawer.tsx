import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import { useBodyScrollLock } from "@/hooks";
import { JobsFilter } from "../../types/jobs.types";

export interface JobFiltersMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  localFilters: JobsFilter;
  activeMobileTab: keyof JobsFilter;
  setActiveMobileTab: (tab: keyof JobsFilter) => void;
  toggleFilter: (key: keyof JobsFilter, value: string) => void;
  getSelectedValues: (key: keyof JobsFilter) => string[];
  handleClear: () => void;
  handleApply: () => void;
  backendIndustries: string[];
  industrySearch: string;
  setIndustrySearch: (val: string) => void;
  customMinSalary: string;
  setCustomMinSalary: (val: string) => void;
  customMaxSalary: string;
  setCustomMaxSalary: (val: string) => void;
  mobileCategoryOptions: Record<string, string[]>;
}

export const JobFiltersMobileDrawer: React.FC<JobFiltersMobileDrawerProps> = ({
  isOpen,
  onClose,
  localFilters,
  activeMobileTab,
  setActiveMobileTab,
  toggleFilter,
  getSelectedValues,
  handleClear,
  handleApply,
  backendIndustries,
  industrySearch,
  setIndustrySearch,
  customMinSalary,
  setCustomMinSalary,
  customMaxSalary,
  setCustomMaxSalary,
  mobileCategoryOptions,
}) => {
  useBodyScrollLock(isOpen);

  const selectedFilterCount = useMemo(() => {
    let count = 0;
    Object.values(localFilters).forEach((val) => {
      if (!val) return;
      if (Array.isArray(val)) {
        count += val.filter(Boolean).length;
      } else if (typeof val === "string") {
        const items = val.split(",").map((p) => p.trim()).filter(Boolean);
        count += items.length;
      }
    });

    if (customMinSalary || customMaxSalary) {
      count += 1;
    }

    return count;
  }, [localFilters, customMinSalary, customMaxSalary]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 md:hidden touch-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[375px] mx-auto h-[488px] bg-ds-bg border-t border-x border-ds-border rounded-t-[24px] p-[8px_12px_24px] gap-4 flex flex-col items-center shadow-2xl animate-in slide-in-from-bottom duration-200 select-none"
      >
        {/* Frame 2608582: Drag Handle */}
        <div className="w-full h-5 flex flex-col items-center justify-center shrink-0">
          <div className="w-[50px] h-[3px] bg-ds-text-muted rounded-full" />
        </div>

        {/* Frame 2609111: Main Content Container */}
        <div className="w-full h-[420px] flex flex-col items-start shrink-0">
          {/* Header (width: 351px, height: 40px) */}
          <div className="w-full h-10 px-4 border-b border-ds-border flex justify-between items-center shrink-0">
            {/* Left: Filters + Count Badge */}
            <div className="flex items-center gap-4">
              <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary">
                Filters
              </span>
              {selectedFilterCount > 0 && (
                <div className="min-w-[33px] h-6 px-2.5 py-0.5 bg-ds-accent rounded-full flex items-center justify-center">
                  <span className="font-dm-sans font-normal text-sm leading-5 text-ds-text-primary">
                    {selectedFilterCount}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              className="h-8 px-3 py-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
            >
              <span className="font-dm-sans font-normal text-sm leading-5 text-ds-error">
                Clear
              </span>
            </button>
          </div>

          {/* Frame 2609098: Body with 2 columns + Apply button (height: 380px) */}
          <div className="w-full h-[380px] flex flex-col items-start justify-between pt-2">
            {/* Frame 2609112: The Two Columns (height: 330px) */}
            <div className="w-full h-[330px] flex flex-row justify-between items-start">
              {/* Left Column (Frame 2609096): 140px width */}
              <div className="w-[140px] h-full border-r border-ds-border flex flex-col items-start py-2 pr-1 gap-1 shrink-0 overflow-y-auto no-scrollbar">
                {[
                  { id: "job_type" as const, label: "Job Type" },
                  { id: "experience" as const, label: "Experience level" },
                  { id: "work_mode" as const, label: "Work mode" },
                  { id: "salary_range" as const, label: "Salary range" },
                  { id: "industry" as const, label: "Industry" },
                  { id: "date_posted" as const, label: "Date posted" },
                ].map((cat) => {
                  const isActive = activeMobileTab === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setActiveMobileTab(cat.id)}
                      className={`w-full h-12 px-2 flex items-center text-left text-sm font-dm-sans font-normal transition-colors cursor-pointer ${
                        isActive
                          ? "border-l-2 border-ds-accent text-ds-accent font-medium bg-transparent"
                          : "border-l-2 border-transparent text-ds-text-primary hover:text-ds-text-primary"
                      }`}
                    >
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Column (Job type dropdown / Options list): flex-1 / 203px */}
              <div className="flex-1 h-full overflow-y-auto no-scrollbar px-3 py-1 flex flex-col gap-1">
                {activeMobileTab === "industry" ? (
                  <div className="flex flex-col gap-2 pt-1">
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
                      .filter(
                        (i) =>
                          !industrySearch ||
                          i.toLowerCase().includes(industrySearch.toLowerCase()),
                      )
                      .map((opt) => {
                        const isSel = getSelectedValues("industry").includes(opt);
                        return (
                          <button
                            type="button"
                            key={opt}
                            onClick={() => toggleFilter("industry", opt)}
                            className="w-full h-12 px-2 rounded-[24px] flex justify-between items-center text-left text-sm font-dm-sans transition-colors cursor-pointer hover:bg-ds-surface-1"
                          >
                            <span
                              className={`truncate ${
                                isSel
                                  ? "text-ds-accent font-medium"
                                  : "text-ds-text-secondary"
                              }`}
                            >
                              {opt}
                            </span>
                            {isSel && (
                              <Icon
                                icon="lucide:check"
                                className="w-4 h-4 text-ds-accent shrink-0 ml-2"
                              />
                            )}
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  (mobileCategoryOptions[activeMobileTab] || []).map((opt) => {
                    const currentVals = getSelectedValues(activeMobileTab);
                    const isSel =
                      opt === "" ? currentVals.length === 0 : currentVals.includes(opt);
                    return (
                      <div key={opt} className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => toggleFilter(activeMobileTab, opt)}
                          className="w-full h-12 px-2 rounded-[24px] flex justify-between items-center text-left text-sm font-dm-sans transition-colors cursor-pointer hover:bg-ds-surface-1"
                        >
                          <span
                            className={`truncate ${
                              isSel
                                ? "text-ds-accent font-medium"
                                : "text-ds-text-secondary"
                            }`}
                          >
                            {opt === "" ? "All" : opt}
                          </span>
                          {isSel && (
                            <Icon
                              icon="lucide:check"
                              className="w-4 h-4 text-ds-accent shrink-0 ml-2"
                            />
                          )}
                        </button>
                        {activeMobileTab === "salary_range" && opt === "Other" && isSel && (
                          <div className="flex flex-col gap-2 pb-3 px-1 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-ds-text-secondary font-dm-sans">
                                Min
                              </span>
                              <input
                                type="number"
                                placeholder="0"
                                value={customMinSalary}
                                onChange={(e) => setCustomMinSalary(e.target.value)}
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
                                onChange={(e) => setCustomMaxSalary(e.target.value)}
                                className="w-24 h-8 px-2 text-xs text-right bg-ds-surface-1 border border-ds-border rounded text-ds-text-primary outline-none focus:border-ds-accent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Frame 2608618: Bottom Apply Row */}
            <div className="w-full h-9 flex flex-row justify-end items-center shrink-0 pr-2">
              <button
                type="button"
                onClick={handleApply}
                className="w-[69px] h-9 px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-full flex justify-center items-center cursor-pointer transition-all border-none outline-none shadow-sm"
              >
                <span className="font-dm-sans font-medium text-base leading-6 text-ds-text-primary">
                  Apply
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobFiltersMobileDrawer;

