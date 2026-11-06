'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchPillChevron } from '../SearchPillChevron';
import { SearchFilterState } from '../../types/search.types';
import { PeopleFilterPopover } from './PeopleFilterPopover';
import { getTrendingHashtags, searchHashtags } from '@/services/api/hashtags';

interface SearchPostFiltersProps {
  filters: SearchFilterState;
  onSetFilter: (key: keyof SearchFilterState, value: string | null | undefined) => void;
  onToggleFilter?: (key: keyof SearchFilterState, value: string) => void;
}

interface PostFilterOption {
  label: string;
  value?: string;
  displayValue?: string;
}

const POSTED_BY_OPTIONS = [
  { label: 'Connections', value: 'connections' },
  { label: 'Followers', value: 'followers' },
  { label: 'Others', value: 'others' },
];

const CONTENT_TYPE_OPTIONS = [
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
  { label: 'Video', value: 'video' },
  { label: 'Poll', value: 'poll' },
  // { label: 'Article', value: 'article' },
];

const DATE_POSTED_OPTIONS: PostFilterOption[] = [
  { label: 'Any time', value: undefined, displayValue: 'Date posted' },
  { label: 'Past 24 hours', value: 'past_24h', displayValue: 'Past 24 hours' },
  { label: 'Past week', value: 'past_week', displayValue: 'Past week' },
  { label: 'Past month', value: 'past_month', displayValue: 'Past month' },
];

// Single-select dropdown for Date posted
interface PostFilterMenuProps {
  title: string;
  options: PostFilterOption[];
  selectedValue?: string;
  onSelect: (val: string | undefined) => void;
}

const PostFilterMenu: React.FC<PostFilterMenuProps> = ({
  title,
  options,
  selectedValue,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);

  const isActive = Boolean(selectedValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 px-[12px] py-[6px] h-[36px] box-border rounded-full transition-all font-dm-sans cursor-pointer select-none shrink-0 ${
            isActive
              ? 'bg-ds-bg border border-ds-accent text-ds-text-primary'
              : 'bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted'
          }`}
        >
          <SearchPillChevron open={open} className="text-ds-text-primary" />
          <span className="text-[16px] font-medium leading-[24px] text-ds-text-primary whitespace-nowrap">
            {title}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-[12px] w-auto min-w-[80px] bg-ds-bg border border-ds-border rounded-[8px] flex flex-col items-start gap-[16px] shadow-2xl z-[120] focus:outline-none focus:ring-0"
      >
        {options.map((opt) => {
          const isSelected = opt.value
            ? selectedValue?.toLowerCase() === opt.value.toLowerCase()
            : !selectedValue;

          const handleClick = () => {
            if (isSelected && opt.value !== undefined) {
              onSelect(undefined);
            } else {
              onSelect(opt.value);
            }
            setOpen(false);
          };

          return (
            <button
              key={opt.label}
              type="button"
              onClick={handleClick}
              className={`font-dm-sans text-[14px] leading-[20px] font-normal transition-colors cursor-pointer text-left whitespace-nowrap outline-none bg-transparent border-none p-0 ${
                isSelected
                  ? 'text-ds-accent font-medium'
                  : 'text-ds-text-secondary hover:text-ds-text-primary'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

// Multi-select dropdown for Posted by & Content type
interface MultiSelectPostFilterMenuProps {
  title: string;
  options: { label: string; value: string }[];
  selectedValues?: string | string[];
  onToggle: (val: string) => void;
}

const MultiSelectPostFilterMenu: React.FC<MultiSelectPostFilterMenuProps> = ({
  title,
  options,
  selectedValues,
  onToggle,
}) => {
  const [open, setOpen] = useState(false);

  const currentSelections: string[] = useMemo(() => {
    if (Array.isArray(selectedValues)) return selectedValues;
    if (typeof selectedValues === 'string' && selectedValues.trim()) {
      return selectedValues.includes(',')
        ? selectedValues.split(',').map((s) => s.trim().toLowerCase())
        : [selectedValues.trim().toLowerCase()];
    }
    return [];
  }, [selectedValues]);

  const isActive = currentSelections.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 px-[12px] py-[6px] h-[36px] box-border rounded-full transition-all font-dm-sans cursor-pointer select-none shrink-0 ${
            isActive
              ? 'bg-ds-bg border border-ds-accent text-ds-text-primary'
              : 'bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted'
          }`}
        >
          <SearchPillChevron open={open} className="text-ds-text-primary" />
          <span className="text-[16px] font-medium leading-[24px] text-ds-text-primary whitespace-nowrap">
            {title}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-[12px] w-auto min-w-[110px] bg-ds-bg border border-ds-border rounded-[8px] flex flex-col items-start gap-[16px] shadow-2xl z-[120] focus:outline-none focus:ring-0"
      >
        {options.map((opt) => {
          const isSelected = currentSelections.some(
            (val) => val.toLowerCase() === opt.value.toLowerCase()
          );

          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`font-dm-sans text-[14px] leading-[20px] font-normal transition-colors cursor-pointer text-left whitespace-nowrap outline-none bg-transparent border-none p-0 ${
                isSelected
                  ? 'text-ds-accent font-medium'
                  : 'text-ds-text-secondary hover:text-ds-text-primary'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};

export const SearchPostFilters: React.FC<SearchPostFiltersProps> = ({
  filters,
  onSetFilter,
  onToggleFilter,
}) => {
  const [initialHashtags, setInitialHashtags] = useState<string[]>([]);

  // Prefetch initial trending hashtags for the hashtag filter popover
  useEffect(() => {
    let cancelled = false;
    getTrendingHashtags()
      .then((tags) => {
        if (!cancelled && Array.isArray(tags) && tags.length > 0) {
          setInitialHashtags(tags.map((t) => t.tag));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Dynamic live hashtag search query
  const handleLoadHashtags = useCallback(async (term: string): Promise<string[]> => {
    try {
      const cleanTerm = term.trim().replace(/^#/, '');
      const res = await searchHashtags(cleanTerm);
      if (res?.tags && Array.isArray(res.tags)) {
        return res.tags.map((t) => t.tag);
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  return (
    <div className="flex items-center gap-3 shrink-0">
      {/* 1. Posted by Filter (Multi-select: Connections, Followers, Others) */}
      <MultiSelectPostFilterMenu
        title="Posted by"
        options={POSTED_BY_OPTIONS}
        selectedValues={filters.posted_by}
        onToggle={(val) =>
          onToggleFilter ? onToggleFilter('posted_by', val) : onSetFilter('posted_by', val)
        }
      />

      {/* 2. Hashtags Filter (Searchable popover) */}
      <PeopleFilterPopover
        title="Hashtags"
        options={initialHashtags}
        selectedValues={filters.hashtag || []}
        onToggle={(val) => onToggleFilter?.('hashtag', val)}
        loadOptions={handleLoadHashtags}
      />

      {/* 3. Date posted Filter (Single select) */}
      <PostFilterMenu
        title="Date posted"
        options={DATE_POSTED_OPTIONS}
        selectedValue={filters.date_posted}
        onSelect={(val) => onSetFilter('date_posted', val)}
      />

      {/* 4. Content type Filter (Multi-select: Text, Image, Video, Poll) */}
      <MultiSelectPostFilterMenu
        title="Content type"
        options={CONTENT_TYPE_OPTIONS}
        selectedValues={filters.content_type}
        onToggle={(val) =>
          onToggleFilter ? onToggleFilter('content_type', val) : onSetFilter('content_type', val)
        }
      />
    </div>
  );
};
