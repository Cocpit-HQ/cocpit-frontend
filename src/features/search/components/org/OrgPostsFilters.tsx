'use client';

import React, { useCallback, useMemo } from 'react';
import { SearchFilterState } from '../../types/search.types';
import { PeopleFilterPopover } from '../filters/PeopleFilterPopover';
import { SearchableCursorFilterChip } from '../filters/SearchableCursorFilterChip';
import { POSTED_BY_OPTIONS_ORG } from '../../constants/orgSearchConstants';
import { getPaginatedHashtags } from '../../services/search.service';
import { Check, AtSign } from 'lucide-react';

interface OrgPostsFiltersProps {
  filters: SearchFilterState;
  onSetFilter: (key: keyof SearchFilterState, value: string | null | undefined) => void;
  onToggleFilter?: (key: keyof SearchFilterState, value: string) => void;
  dropdownPill?: React.ReactNode;
}

interface PostFilterOption {
  label: string;
  value?: string;
}

const CONTENT_TYPE_OPTIONS = [
  { label: 'All posts', value: 'all' },
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
  { label: 'Video', value: 'video' },
  { label: 'Poll', value: 'poll' },
  { label: 'Article', value: 'article' },
];

const DATE_POSTED_OPTIONS: PostFilterOption[] = [
  { label: 'Any time', value: undefined },
  { label: 'Past 24 hours', value: 'past_24h' },
  { label: 'Past week', value: 'past_week' },
  { label: 'Past month', value: 'past_month' },
];

export const OrgPostsFilters: React.FC<OrgPostsFiltersProps> = ({
  filters,
  onSetFilter,
  onToggleFilter,
  dropdownPill,
}) => {
  const fetchHashtags = useCallback((q?: string, cursor?: string) => {
    return getPaginatedHashtags(q, cursor, 25);
  }, []);

  const handleToggle = (key: keyof SearchFilterState, val: string) => {
    if (onToggleFilter) {
      onToggleFilter(key, val);
    } else {
      const current = (filters[key] as string[]) || [];
      const exists = current.includes(val);
      const next = exists ? current.filter((x) => x !== val) : [...current, val];
      onSetFilter(key, next.length > 0 ? next.join(',') : null);
    }
  };

  const isMentionsOrg = Boolean(filters.mentions_org || filters.mentions_company);

  const handleToggleMentionsOrg = () => {
    onSetFilter('mentions_org', isMentionsOrg ? null : 'true');
  };

  // Selections
  const postedBySelections = useMemo(() => {
    if (Array.isArray(filters.posted_by)) return filters.posted_by;
    if (typeof filters.posted_by === 'string' && filters.posted_by) return [filters.posted_by];
    return [];
  }, [filters.posted_by]);

  const contentTypeSelections = useMemo(() => {
    if (Array.isArray(filters.content_type)) return filters.content_type;
    if (typeof filters.content_type === 'string' && filters.content_type) return [filters.content_type];
    return [];
  }, [filters.content_type]);

  const hashtagSelections = useMemo(() => {
    if (Array.isArray(filters.hashtag)) return filters.hashtag;
    if (typeof filters.hashtag === 'string' && filters.hashtag) return [filters.hashtag];
    return [];
  }, [filters.hashtag]);

  const row1Chips = (
    <>
      {/* 1. Posted by (Includes Employees for org actor) */}
      <PeopleFilterPopover
        title="Posted by"
        options={POSTED_BY_OPTIONS_ORG}
        selectedValues={postedBySelections}
        onToggle={(val) => handleToggle('posted_by', val)}
        hasSearch={false}
        widthClass="w-[180px]"
      />

      {/* 2. Mentions our company toggle */}
      <button
        type="button"
        onClick={handleToggleMentionsOrg}
        className={`h-9 px-3 py-1.5 rounded-[100px] flex items-center justify-center gap-2 transition-all cursor-pointer font-dm-sans font-medium text-base leading-6 select-none shrink-0 ${
          isMentionsOrg
            ? 'bg-ds-bg border border-ds-accent text-ds-text-primary'
            : 'bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted'
        }`}
      >
        <AtSign className="size-4" />
        <span>Mentions our company</span>
        {isMentionsOrg && <Check className="size-4 text-ds-accent" />}
      </button>

      {/* 3. Date posted */}
      <PeopleFilterPopover
        title="Date posted"
        options={DATE_POSTED_OPTIONS.filter((o) => o.value !== undefined).map((o) => ({
          label: o.label,
          value: o.value!,
        }))}
        selectedValue={filters.date_posted}
        onSelect={(val) => onSetFilter('date_posted', val || null)}
        hasSearch={false}
        widthClass="w-[180px]"
      />
    </>
  );

  const row2Chips = (
    <>
      {/* 4. Content type */}
      <PeopleFilterPopover
        title="Content type"
        options={CONTENT_TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        selectedValues={contentTypeSelections}
        onToggle={(val) => handleToggle('content_type', val)}
        hasSearch={false}
        widthClass="w-[180px]"
      />

      {/* 5. Hashtags (Cursor-paginated infinite scroll popover) */}
      <SearchableCursorFilterChip
        title="Hashtags"
        paramKey="hashtag"
        selectedValues={hashtagSelections}
        fetchData={fetchHashtags}
        onToggle={(_, val) => handleToggle('hashtag', val.replace(/^#/, ''))}
        allowCustomValue={true}
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

      {/* Desktop: 2-row layout matching SearchJobFilters design */}
      <div className="hidden md:flex flex-col items-start gap-3 w-full">
        {/* Row 1: Dropdown pill + Posted by + Mentions our company + Date posted */}
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
