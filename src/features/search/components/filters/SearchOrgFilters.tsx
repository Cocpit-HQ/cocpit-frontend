'use client';

import React, { useCallback, useMemo } from 'react';
import { SearchFilterState } from '../../types/search.types';
import { PeopleFilterPopover } from './PeopleFilterPopover';
import { SearchableCursorFilterChip } from './SearchableCursorFilterChip';
import { SearchableLocationFilterChip } from './SearchableLocationFilterChip';
import { getPaginatedIndustries } from '@/features/jobs/services/jobs.service';
import { Check } from 'lucide-react';
import {
  INDUSTRY_OPTIONS,
  INSTITUTION_INDUSTRY_OPTIONS,
  COMPANY_SIZE_OPTIONS,
} from '@/constants/organizationOptions';

interface SearchOrgFiltersProps {
  category: 'companies' | 'institutes';
  filters: SearchFilterState;
  onSetFilter: (key: keyof SearchFilterState, value: string | null | undefined) => void;
  onToggleFilter?: (key: keyof SearchFilterState, value: string) => void;
  onToggleActivelyHiring?: () => void;
}

export const SearchOrgFilters: React.FC<SearchOrgFiltersProps> = ({
  category,
  filters,
  onSetFilter,
  onToggleFilter,
  onToggleActivelyHiring,
}) => {
  // Dynamic API-backed industry search with cursor pagination across industries_master
  const fetchIndustries = useCallback((q?: string, cursor?: string) => {
    return getPaginatedIndustries(q, cursor, 50);
  }, []);

  // Filter chip title: Industry for Company, Type for Institute
  const filterTitle = category === 'companies' ? 'Industry' : 'Type';

  // Options for Institute type
  const instituteTypeOptions = useMemo(() => {
    return INSTITUTION_INDUSTRY_OPTIONS.map((opt) => ({
      label: opt.label,
      value: opt.value,
    }));
  }, []);

  const locationSelections = Array.isArray(filters.location)
    ? filters.location
    : filters.location
    ? [filters.location]
    : [];

  const typeFilterKey: keyof SearchFilterState =
    category === 'institutes' ? 'institute_type' : 'industry';

  const typeSelections: string[] = useMemo(() => {
    let rawList: string[] = [];
    if (category === 'institutes') {
      if (Array.isArray(filters.institute_type)) rawList = filters.institute_type;
      else if (typeof filters.institute_type === 'string' && filters.institute_type) rawList = [filters.institute_type];
      else {
        const rawType = filters.org_type || filters.type;
        if (Array.isArray(rawType)) rawList = rawType as string[];
        else if (typeof rawType === 'string' && rawType) rawList = [rawType];
      }
    } else {
      if (Array.isArray(filters.industry)) rawList = filters.industry;
      else if (typeof filters.industry === 'string' && filters.industry) rawList = [filters.industry];
      else {
        const rawType = filters.org_type || filters.type;
        if (Array.isArray(rawType)) rawList = rawType as string[];
        else if (typeof rawType === 'string' && rawType) rawList = [rawType];
      }
    }

    const selections = new Set<string>();
    rawList.forEach((item) => {
      const trimmed = item.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      const lowerNoUnderscore = lower.replace(/_/g, ' ');

      if (category === 'companies') {
        // Also check INDUSTRY_OPTIONS for snake_case value -> Title Case label
        const matchedIndustry = INDUSTRY_OPTIONS.find(
          (o) =>
            o.value.toLowerCase() === lower ||
            o.label.toLowerCase() === lower ||
            o.value.toLowerCase().replace(/_/g, ' ') === lowerNoUnderscore
        );
        if (matchedIndustry) {
          selections.add(matchedIndustry.label);
          return;
        }

        // Custom loaded industry from search or API
        selections.add(trimmed);
      } else {
        // Institutes: match against INSTITUTION_INDUSTRY_OPTIONS
        const matchedInst = INSTITUTION_INDUSTRY_OPTIONS.find(
          (o) =>
            o.value.toLowerCase() === lower ||
            o.label.toLowerCase() === lower
        );
        if (matchedInst) {
          selections.add(matchedInst.value);
        } else {
          selections.add(trimmed);
        }
      }
    });

    return Array.from(selections);
  }, [category, filters.institute_type, filters.industry, filters.org_type, filters.type]);

  const orgSizeSelections = Array.isArray(filters.org_size)
    ? (filters.org_size as string[])
    : filters.org_size
    ? [filters.org_size]
    : [];

  return (
    <div className="flex items-center gap-3 shrink-0">
      {/* 1. Location Filter */}
      <SearchableLocationFilterChip
        selectedValues={locationSelections}
        onToggle={(val) =>
          onToggleFilter ? onToggleFilter('location', val) : onSetFilter('location', val)
        }
      />

      {/* 2. Industry Filter for Company (infinite scrolling) vs Type Filter for Institute */}
      {category === 'companies' ? (
        <SearchableCursorFilterChip
          title="Industry"
          paramKey="industry"
          selectedValues={typeSelections}
          fetchData={fetchIndustries}
          onToggle={(_, val) => {
            if (onToggleFilter) {
              onToggleFilter('industry', val);
            } else {
              onSetFilter('industry', val);
            }
          }}
          buttonWidthClass="w-auto"
          widthClass="w-auto min-w-[220px] max-w-[320px]"
        />
      ) : (
        <PeopleFilterPopover
          title="Type"
          options={instituteTypeOptions}
          selectedValues={typeSelections}
          onToggle={(val) =>
            onToggleFilter ? onToggleFilter('institute_type', val) : onSetFilter('institute_type', val)
          }
          hasSearch={false}
          buttonWidthClass="w-auto"
          widthClass="w-auto min-w-[180px]"
        />
      )}

      {/* 3. Org. Size Filter (Shared for both Company and Institute) */}
      <PeopleFilterPopover
        title="Org. Size"
        options={COMPANY_SIZE_OPTIONS}
        selectedValues={orgSizeSelections}
        onToggle={(val) =>
          onToggleFilter ? onToggleFilter('org_size', val) : onSetFilter('org_size', val)
        }
        hasSearch={false}
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[160px]"
      />

      {/* 4. Actively Hiring (Companies only) */}
      {category === 'companies' && (
        <button
          type="button"
          onClick={() => {
            if (onToggleActivelyHiring) {
              onToggleActivelyHiring();
            } else {
              onSetFilter('actively_hiring', filters.actively_hiring ? null : 'true');
            }
          }}
          className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-2 transition-all cursor-pointer font-dm-sans font-medium text-base leading-6 select-none shrink-0 ${
            filters.actively_hiring
              ? 'bg-ds-bg border border-ds-accent text-ds-text-primary'
              : 'bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted'
          }`}
        >
          <span>Actively hiring</span>
          {filters.actively_hiring && <Check className="size-4 text-ds-accent" />}
        </button>
      )}
    </div>
  );
};
