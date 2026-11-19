'use client';

import React, { useCallback, useMemo } from 'react';
import { SearchFilterState } from '../../types/search.types';
import { SearchableLocationFilterChip } from './SearchableLocationFilterChip';
import { SearchableCursorFilterChip } from './SearchableCursorFilterChip';
import { PeopleFilterPopover } from './PeopleFilterPopover';
import {
  getPaginatedCompanies,
  getPaginatedRoles,
  getPaginatedIndustries,
  getPaginatedInstitutes,
} from '@/features/jobs/services/jobs.service';
import { getPaginatedSkills } from '../../services/search.service';
import {
  ORG_EXPERIENCE_OPTIONS,
  ORG_OPEN_TO_OPTIONS,
} from '../../constants/orgSearchConstants';

interface SearchPeopleFiltersProps {
  filters: SearchFilterState;
  onSetFilter: (key: keyof SearchFilterState, value: string | null | undefined) => void;
  onToggleFilter?: (key: keyof SearchFilterState, value: string) => void;
  dropdownPill?: React.ReactNode;
}

export const SearchPeopleFilters: React.FC<SearchPeopleFiltersProps> = ({
  filters,
  onSetFilter,
  onToggleFilter,
  dropdownPill,
}) => {
  // Dynamic API-backed loaders with cursor pagination
  const fetchSkills = useCallback((q?: string, cursor?: string) => {
    return getPaginatedSkills(q, cursor, 50);
  }, []);

  const fetchRoles = useCallback((q?: string, cursor?: string) => {
    return getPaginatedRoles(q, cursor, 50);
  }, []);

  const fetchCompanies = useCallback((q?: string, cursor?: string) => {
    return getPaginatedCompanies(q, cursor, 50);
  }, []);

  const fetchIndustries = useCallback((q?: string, cursor?: string) => {
    return getPaginatedIndustries(q, cursor, 50);
  }, []);

  const fetchInstitutes = useCallback((q?: string, cursor?: string) => {
    return getPaginatedInstitutes(q, cursor, 50);
  }, []);

  // Safe normalized selection arrays
  const locationSelections = useMemo(() => {
    if (Array.isArray(filters.location)) return filters.location;
    if (typeof filters.location === 'string' && filters.location) return [filters.location];
    return [];
  }, [filters.location]);

  const skillsSelections = useMemo(() => {
    if (Array.isArray(filters.skills)) return filters.skills;
    if (typeof filters.skills === 'string' && filters.skills) return [filters.skills];
    return [];
  }, [filters.skills]);

  const experienceSelections = useMemo(() => {
    if (Array.isArray(filters.experience)) return filters.experience;
    if (typeof filters.experience === 'string' && filters.experience) return [filters.experience];
    return [];
  }, [filters.experience]);

  const openToSelections = useMemo(() => {
    if (Array.isArray(filters.open_to)) return filters.open_to;
    if (typeof filters.open_to === 'string' && filters.open_to) return [filters.open_to];
    return [];
  }, [filters.open_to]);

  const roleSelections = useMemo(() => {
    if (Array.isArray(filters.role)) return filters.role;
    if (typeof filters.role === 'string' && filters.role) return [filters.role];
    return [];
  }, [filters.role]);

  const companySelections = useMemo(() => {
    if (Array.isArray(filters.company)) return filters.company;
    if (typeof filters.company === 'string' && filters.company) return [filters.company];
    return [];
  }, [filters.company]);

  const industrySelections = useMemo(() => {
    const raw = filters.industry || filters.industry_type;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw) return [raw];
    return [];
  }, [filters.industry, filters.industry_type]);

  const instituteSelections = useMemo(() => {
    const raw = filters.institute || filters.school;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw) return [raw];
    return [];
  }, [filters.institute, filters.school]);

  const handleToggle = (key: keyof SearchFilterState, val: string) => {
    if (onToggleFilter) {
      onToggleFilter(key, val);
    } else {
      const current = (filters[key] as string[]) || [];
      const valNorm = val.toLowerCase().trim();
      const existsIndex = current.findIndex((x) => x.toLowerCase().trim() === valNorm);
      const next = existsIndex >= 0
        ? current.filter((_, idx) => idx !== existsIndex)
        : [...current, val];
      onSetFilter(key, next.length > 0 ? next.join('|') : null);
    }
  };

  const row1Chips = (
    <>
      {/* 1. Location */}
      <SearchableLocationFilterChip
        selectedValues={locationSelections}
        onToggle={(val) => handleToggle('location', val)}
      />

      {/* 2. Skills */}
      <SearchableCursorFilterChip
        title="Skills"
        paramKey="skills"
        selectedValues={skillsSelections}
        fetchData={fetchSkills}
        onToggle={(_, val) => handleToggle('skills', val)}
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
      />

      {/* 3. Experience */}
      <PeopleFilterPopover
        title="Experience"
        options={ORG_EXPERIENCE_OPTIONS}
        selectedValues={experienceSelections}
        onToggle={(val) => handleToggle('experience', val)}
        hasSearch={false}
        widthClass="w-[200px]"
      />

      {/* 4. Open to Work */}
      <PeopleFilterPopover
        title="Open to Work"
        options={ORG_OPEN_TO_OPTIONS}
        selectedValues={openToSelections}
        onToggle={(val) => handleToggle('open_to', val)}
        hasSearch={false}
        widthClass="w-[200px]"
      />
    </>
  );

  const row2Chips = (
    <>
      {/* 5. Designation / Role */}
      <SearchableCursorFilterChip
        title="Role"
        paramKey="role"
        selectedValues={roleSelections}
        fetchData={fetchRoles}
        onToggle={(_, val) => handleToggle('role', val)}
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
        allowCustomValue={true}
      />

      {/* 6. Company */}
      <SearchableCursorFilterChip
        title="Company"
        paramKey="company"
        selectedValues={companySelections}
        fetchData={fetchCompanies}
        onToggle={(_, val) => handleToggle('company', val)}
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
      />

      {/* 7. Industry */}
      <SearchableCursorFilterChip
        title="Industry"
        paramKey="industry"
        selectedValues={industrySelections}
        fetchData={fetchIndustries}
        onToggle={(_, val) => handleToggle('industry', val)}
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
      />

      {/* 8. Education */}
      <SearchableCursorFilterChip
        title="Education"
        paramKey="institute"
        selectedValues={instituteSelections}
        fetchData={fetchInstitutes}
        onToggle={(_, val) => handleToggle('institute', val)}
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
      />
    </>
  );

  return (
    <>
      {/* Mobile: 1 single horizontal scroll row */}
      <div className="flex md:hidden flex-row items-center gap-3 overflow-x-auto scrollbar-hide select-none flex-nowrap w-full touch-pan-x overscroll-x-contain">
        {dropdownPill}
        {row1Chips}
        {row2Chips}
      </div>

      {/* Desktop: 2-row layout matching SearchJobFilters & OrgPeopleFilters design */}
      <div className="hidden md:flex flex-col items-start gap-3 w-full">
        {/* Row 1: Dropdown pill + Location + Skills + Experience + Open to Work */}
        <div className="flex flex-row items-center gap-3 overflow-x-auto scrollbar-hide select-none flex-nowrap w-full">
          {dropdownPill}
          {row1Chips}
        </div>

        {/* Row 2: Indented under Row 1 chips on desktop (pl-[96px]) */}
        <div className="flex flex-row items-center gap-3 overflow-x-auto scrollbar-hide select-none flex-nowrap w-full pl-[96px]">
          {row2Chips}
        </div>
      </div>
    </>
  );
};
