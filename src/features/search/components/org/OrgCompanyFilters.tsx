'use client';

import React, { useCallback, useMemo } from 'react';
import { SearchFilterState } from '../../types/search.types';
import { SearchableLocationFilterChip } from '../filters/SearchableLocationFilterChip';
import { SearchableCursorFilterChip } from '../filters/SearchableCursorFilterChip';
import { PeopleFilterPopover } from '../filters/PeopleFilterPopover';
import { SpecificSearchFilterChip } from './SpecificSearchFilterChip';
import { getPaginatedIndustries } from '@/features/jobs/services/jobs.service';
import { useSectorOptions } from '../../hooks/useOrgSearchMeta';
import { COMPANY_SIZE_OPTIONS } from '@/constants/organizationOptions';
import { Check } from 'lucide-react';

interface OrgCompanyFiltersProps {
  filters: SearchFilterState;
  onSetFilter: (key: keyof SearchFilterState, value: string | null | undefined) => void;
  onToggleFilter?: (key: keyof SearchFilterState, value: string) => void;
  onToggleVerified?: () => void;
  onToggleActivelyHiring?: () => void;
  dropdownPill?: React.ReactNode;
}

export const OrgCompanyFilters: React.FC<OrgCompanyFiltersProps> = ({
  filters,
  onSetFilter,
  onToggleFilter,
  onToggleVerified,
  onToggleActivelyHiring,
  dropdownPill,
}) => {
  // Dynamic API-backed industry search
  const fetchIndustries = useCallback((q?: string, cursor?: string) => {
    return getPaginatedIndustries(q, cursor, 50);
  }, []);

  // Dynamically fetched sector list from backend API
  const { data: sectorOptions = [] } = useSectorOptions();

  // Selections
  const industrySelections = useMemo(() => {
    const raw = filters.industry || filters.industry_type;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw) return [raw];
    return [];
  }, [filters.industry, filters.industry_type]);

  const sectorSelections = useMemo(() => {
    if (Array.isArray(filters.sector)) return filters.sector;
    if (typeof filters.sector === 'string' && filters.sector) return [filters.sector];
    return [];
  }, [filters.sector]);

  const locationSelections = useMemo(() => {
    if (Array.isArray(filters.location)) return filters.location;
    if (typeof filters.location === 'string' && filters.location) return [filters.location];
    return [];
  }, [filters.location]);

  const orgSizeSelections = useMemo(() => {
    if (Array.isArray(filters.org_size)) return filters.org_size;
    if (typeof filters.org_size === 'string' && filters.org_size) return [filters.org_size];
    return [];
  }, [filters.org_size]);

  const isVerified = Boolean(filters.is_verified);

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

  const handleToggleVerified = () => {
    if (onToggleVerified) {
      onToggleVerified();
    } else {
      onSetFilter('is_verified', isVerified ? null : 'true');
    }
  };

  const row1Chips = (
    <>
      {/* 1. Industry */}
      <SearchableCursorFilterChip
        title="Industry"
        paramKey="industry"
        selectedValues={industrySelections}
        fetchData={fetchIndustries}
        onToggle={(_, val) => handleToggle('industry', val)}
        buttonWidthClass="w-auto"
        widthClass="w-auto min-w-[200px] max-w-[320px]"
      />

      {/* 2. Sector (API-driven dynamic options) */}
      <PeopleFilterPopover
        title="Sector"
        options={sectorOptions}
        selectedValues={sectorSelections}
        onToggle={(val) => handleToggle('sector', val)}
        hasSearch={false}
        widthClass="w-[220px]"
      />

      {/* 4. Location */}
      <SearchableLocationFilterChip
        selectedValues={locationSelections}
        onToggle={(val) => handleToggle('location', val)}
      />

      {/* 5. Verified Toggle */}
      <button
        type="button"
        onClick={handleToggleVerified}
        className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-2 transition-all cursor-pointer font-dm-sans font-medium text-base leading-6 select-none shrink-0 ${
          isVerified
            ? 'bg-ds-bg border border-ds-accent text-ds-text-primary'
            : 'bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted'
        }`}
      >
        <span>Verified</span>
        {isVerified && <Check className="size-4 text-ds-accent" />}
      </button>
    </>
  );

  const row2Chips = (
    <>
      {/* 6. Organization Size */}
      <PeopleFilterPopover
        title="Org. Size"
        options={COMPANY_SIZE_OPTIONS}
        selectedValues={orgSizeSelections}
        onToggle={(val) => handleToggle('org_size', val)}
        hasSearch={false}
        widthClass="w-[180px]"
      />

      {/* 7. Specific Search (Keyword popover chip) */}
      <SpecificSearchFilterChip
        value={filters.specific_search}
        onChange={(val) => onSetFilter('specific_search', val)}
      />

      {/* 8. Actively Hiring */}
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

      {/* Desktop: 2-row layout matching SearchJobFilters design */}
      <div className="hidden md:flex flex-col items-start gap-3 w-full">
        {/* Row 1: Dropdown pill + Industry + Sub-type + Sector + Location + Verified */}
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
