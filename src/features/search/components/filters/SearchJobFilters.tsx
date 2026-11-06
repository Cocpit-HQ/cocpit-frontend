'use client';

import React, { useCallback } from 'react';
import { SearchFilterState } from '../../types/search.types';
import {
  StandardFilterChip,
  SalaryFilterChip,
} from '@/features/jobs/pages/JobSearchPage';
import { SearchableCursorFilterChip } from './SearchableCursorFilterChip';
import { SearchableLocationFilterChip } from './SearchableLocationFilterChip';
import {
  getPaginatedIndustries,
  getPaginatedCompanies,
} from '@/features/jobs/services/jobs.service';
import { Check } from 'lucide-react';

interface SearchJobFiltersProps {
  filters: SearchFilterState;
  onToggleFilter: (key: keyof SearchFilterState, value: string) => void;
  onSetFilter: (key: keyof SearchFilterState, value: string | null | undefined) => void;
  onToggleVerified: () => void;
  dropdownPill?: React.ReactNode;
}

const JOB_TYPE_OPTIONS = ['Full time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const EXPERIENCE_OPTIONS = ['Fresher', 'Junior (1-3 yrs)', 'Mid-level (3-5 yrs)', 'Senior (5+ yrs)'];
const WORK_MODE_OPTIONS = ['Remote', 'Hybrid', 'Onsite'];
const DATE_POSTED_OPTIONS = ['Today', 'Last 7 days', 'last 30 days'];

export const SearchJobFilters: React.FC<SearchJobFiltersProps> = ({
  filters,
  onToggleFilter,
  onSetFilter,
  onToggleVerified,
  dropdownPill,
}) => {
  const fetchIndustries = useCallback((q?: string, cursor?: string) => {
    return getPaginatedIndustries(q, cursor, 50);
  }, []);

  const fetchCompanies = useCallback((q?: string, cursor?: string) => {
    return getPaginatedCompanies(q, cursor, 8);
  }, []);

  const locationSelections = Array.isArray(filters.location)
    ? filters.location
    : filters.location
    ? [filters.location]
    : [];

  const jobTypeSelections = filters.job_type || [];
  const experienceSelections = filters.experience_level || [];
  const workModeSelections = filters.work_mode || [];
  const salarySelections = filters.salary_range || [];
  const industrySelections = filters.industry || [];
  const companySelections = filters.company || [];
  const datePostedSelections = filters.date_posted ? [filters.date_posted] : [];

  const handleCustomSalaryApply = useCallback(
    (min: string, max: string) => {
      if (!min && !max) {
        onSetFilter('salary_range', null);
        return;
      }
      const customVal = `Custom:${min || '0'}-${max || '0'}`;
      onSetFilter('salary_range', customVal);
    },
    [onSetFilter]
  );

  return (
    <div className="w-full flex flex-col items-start gap-3">
      {/* Row 1: Dropdown pill ('Jobs') + Job type + Experience + Work mode + Salary + Industry */}
      <div className="flex flex-row items-center gap-3 overflow-x-auto scrollbar-hide select-none flex-nowrap w-full">
        {dropdownPill}

        <StandardFilterChip
          title="Job type"
          paramKey="job_type"
          options={JOB_TYPE_OPTIONS}
          selectedValues={jobTypeSelections}
          onToggle={(key, val) => onToggleFilter(key as keyof SearchFilterState, val)}
        />

        <StandardFilterChip
          title="Experience"
          paramKey="experience_level"
          options={EXPERIENCE_OPTIONS}
          selectedValues={experienceSelections}
          onToggle={(key, val) => onToggleFilter(key as keyof SearchFilterState, val)}
        />

        <StandardFilterChip
          title="Work mode"
          paramKey="work_mode"
          options={WORK_MODE_OPTIONS}
          selectedValues={workModeSelections}
          onToggle={(key, val) => onToggleFilter(key as keyof SearchFilterState, val)}
        />

        <SalaryFilterChip
          selectedValues={salarySelections}
          onToggle={(_, opt) => onToggleFilter('salary_range', opt)}
          onCustomApply={handleCustomSalaryApply}
        />

        <SearchableCursorFilterChip
          title="Industry"
          paramKey="industry"
          selectedValues={industrySelections}
          fetchData={fetchIndustries}
          onToggle={(key, val) => onToggleFilter(key as keyof SearchFilterState, val)}
        />
      </div>

      {/* Row 2: Indented under Job type on desktop (pl-0 md:pl-[96px]) */}
      <div className="flex flex-row items-center gap-3 overflow-x-auto scrollbar-hide select-none flex-nowrap w-full pl-0 md:pl-[96px]">
        <StandardFilterChip
          title="Date posted"
          paramKey="date_posted"
          options={DATE_POSTED_OPTIONS}
          selectedValues={datePostedSelections}
          onToggle={(_, opt) => onSetFilter('date_posted', filters.date_posted === opt ? null : opt)}
        />

        <SearchableCursorFilterChip
          title="Company"
          paramKey="company"
          selectedValues={companySelections}
          fetchData={fetchCompanies}
          onToggle={(key, val) => onToggleFilter(key as keyof SearchFilterState, val)}
        />

        <SearchableLocationFilterChip
          selectedValues={locationSelections}
          onToggle={(opt) => onToggleFilter('location', opt)}
        />

        <button
          type="button"
          onClick={onToggleVerified}
          className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-2 transition-all cursor-pointer font-dm-sans font-medium text-base leading-6 text-ds-text-primary select-none shrink-0 ${
            filters.is_verified
              ? 'bg-ds-bg border border-ds-accent text-ds-text-primary'
              : 'bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted'
          }`}
        >
          <span>Verified</span>
          {filters.is_verified && <Check className="size-4 text-ds-accent" />}
        </button>
      </div>
    </div>
  );
};
