'use client';

import React, { useCallback } from 'react';
import { SearchFilterState } from '../../types/search.types';
import { SearchableLocationFilterChip } from './SearchableLocationFilterChip';
import { SearchableCursorFilterChip } from './SearchableCursorFilterChip';
import {
  getPaginatedCompanies,
  getPaginatedRoles,
  getPaginatedIndustries,
  getPaginatedInstitutes,
} from '@/features/jobs/services/jobs.service';

interface SearchPeopleFiltersProps {
  filters: SearchFilterState;
  onSetFilter: (key: keyof SearchFilterState, value: string | null | undefined) => void;
  onToggleFilter?: (key: keyof SearchFilterState, value: string) => void;
}

export const SearchPeopleFilters: React.FC<SearchPeopleFiltersProps> = ({
  filters,
  onSetFilter,
  onToggleFilter,
}) => {
  // Dynamic API-backed role search with cursor pagination across job_roles_master
  const fetchRoles = useCallback((q?: string, cursor?: string) => {
    return getPaginatedRoles(q, cursor, 50);
  }, []);

  // Dynamic API-backed company search with cursor pagination across organizations
  const fetchCompanies = useCallback((q?: string, cursor?: string) => {
    return getPaginatedCompanies(q, cursor, 50);
  }, []);

  // Dynamic API-backed industry search with cursor pagination across industries_master
  const fetchIndustries = useCallback((q?: string, cursor?: string) => {
    return getPaginatedIndustries(q, cursor, 50);
  }, []);

  // Dynamic API-backed institute search with cursor pagination across institutions & educations
  const fetchInstitutes = useCallback((q?: string, cursor?: string) => {
    return getPaginatedInstitutes(q, cursor, 50);
  }, []);

  const locationSelections = Array.isArray(filters.location)
    ? filters.location
    : filters.location
    ? [filters.location]
    : [];

  const roleSelections = Array.isArray(filters.role)
    ? filters.role
    : filters.role
    ? [filters.role]
    : [];

  const companySelections = Array.isArray(filters.company)
    ? filters.company
    : filters.company
    ? [filters.company]
    : [];

  const rawIndustry = filters.industry || filters.industry_type;
  const industrySelections = Array.isArray(rawIndustry)
    ? rawIndustry
    : rawIndustry
    ? [rawIndustry]
    : [];

  const rawInstitute = filters.institute || filters.school;
  const instituteSelections = Array.isArray(rawInstitute)
    ? rawInstitute
    : rawInstitute
    ? [rawInstitute]
    : [];

  return (
    <div className="flex flex-row items-center gap-3 shrink-0">
      {/* 1. Location Filter */}
      <SearchableLocationFilterChip
        selectedValues={locationSelections}
        onToggle={(val) =>
          onToggleFilter ? onToggleFilter('location', val) : onSetFilter('location', val)
        }
      />

      {/* 2. Role Filter (Infinite Scroll with Cursor Pagination) */}
      <SearchableCursorFilterChip
        title="Role"
        paramKey="role"
        selectedValues={roleSelections}
        fetchData={fetchRoles}
        onToggle={(_, val) =>
          onToggleFilter ? onToggleFilter('role', val) : onSetFilter('role', val)
        }
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
      />

      {/* 3. Company Filter (Infinite Scroll with Cursor Pagination) */}
      <SearchableCursorFilterChip
        title="Company"
        paramKey="company"
        selectedValues={companySelections}
        fetchData={fetchCompanies}
        onToggle={(_, val) =>
          onToggleFilter ? onToggleFilter('company', val) : onSetFilter('company', val)
        }
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
      />

      {/* 4. Industry Type Filter (Infinite Scroll with Cursor Pagination) */}
      <SearchableCursorFilterChip
        title="Industry Type"
        paramKey="industry"
        selectedValues={industrySelections}
        fetchData={fetchIndustries}
        onToggle={(_, val) =>
          onToggleFilter ? onToggleFilter('industry', val) : onSetFilter('industry', val)
        }
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
      />

      {/* 5. Institute Filter (Infinite Scroll with Cursor Pagination) */}
      <SearchableCursorFilterChip
        title="Institute"
        paramKey="institute"
        selectedValues={instituteSelections}
        fetchData={fetchInstitutes}
        onToggle={(_, val) =>
          onToggleFilter ? onToggleFilter('institute', val) : onSetFilter('institute', val)
        }
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
      />
    </div>
  );
};
