"use client"

import { Search, MapPin, X } from "lucide-react"
import { useJobStore } from "@/store/job.store"
import { useShallow } from "zustand/react/shallow"

interface JobSearchBarProps {
  isSearchExpanded: boolean
  setIsSearchExpanded: (expanded: boolean) => void
  searchKeywords: string
  setSearchKeywords: (val: string) => void
  searchLocations: string[]
  searchLocationInput: string
  setSearchLocationInput: (val: string) => void
  handleAddSearchLocation: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleRemoveSearchLocation: (loc: string) => void
  handleSearch: () => void
  collapsedSearchText: string
}

export function JobSearchBar({
  isSearchExpanded,
  setIsSearchExpanded,
  searchKeywords: _searchKeywords, 
  setSearchKeywords: _setSearchKeywords,
  searchLocations,
  searchLocationInput,
  setSearchLocationInput,
  handleAddSearchLocation,
  handleRemoveSearchLocation,
  handleSearch,
  collapsedSearchText,
}: JobSearchBarProps) {
  const {
    searchKeywords,
    setSearchKeywords,
    filters,
    setRecruiterFilterValue,
  } = useJobStore(
    useShallow((state) => ({
      searchKeywords: state.filters.search,
      setSearchKeywords: (val: string) => state.setCandidateFilterValue('search', val),
      filters: state.filters.recruiterFilters,
      setRecruiterFilterValue: state.setRecruiterFilterValue,
    }))
  );

  const updateFilters = (updates: Partial<typeof filters>) => {
    Object.keys(updates).forEach((k) => {
      setRecruiterFilterValue(k as keyof typeof filters, updates[k as keyof typeof filters]);
    });
  };

  const activeFiltersCount =
    filters.jobType.length +
    filters.workMode.length +
    filters.companyType.length +
    filters.industry.length +
    filters.locations.length +
    (filters.easyApply ? 1 : 0) +
    (filters.activelyHiring ? 1 : 0);

  const removeFilter = (key: keyof typeof filters, val: string) => {
    const current = filters[key] as string[];
    updateFilters({ [key]: current.filter(item => item !== val) });
  }

  return (
    <div className="hidden md:block mb-6 md:mb-8">
      {/* Desktop Search Bar */}
      <div className="hidden md:flex flex-col gap-4">
        <div className="bg-card border border-border rounded-2xl p-2 shadow-sm flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-2 border-r border-border">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              placeholder="Job title, keywords, or company"
              className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button
            onClick={handleSearch}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-3 rounded-xl transition-colors"
          >
            Search
          </button>
        </div>

        {/* Active Filters Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Active filters:</span>

            {filters.easyApply && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                Easy Apply
                <button onClick={() => updateFilters({ easyApply: false })} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            )}

            {filters.activelyHiring && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                Actively Hiring
                <button onClick={() => updateFilters({ activelyHiring: false })} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            )}

            {filters.jobType.map(f => (
              <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                {f}
                <button onClick={() => removeFilter('jobType', f)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {filters.workMode.map(f => (
              <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                {f}
                <button onClick={() => removeFilter('workMode', f)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            ))}

            {filters.locations.map(f => (
              <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                {f}
                <button onClick={() => removeFilter('locations', f)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            ))}



            <button
              onClick={() => updateFilters({
                jobType: [], workMode: [], companyType: [], industry: [], locations: [], easyApply: false, activelyHiring: false
              })}
              className="text-xs text-muted-foreground hover:text-primary ml-2 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
