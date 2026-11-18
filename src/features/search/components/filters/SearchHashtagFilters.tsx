'use client';

import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchPillChevron } from '../SearchPillChevron';
import { SearchFilterState } from '../../types/search.types';

interface SearchHashtagFiltersProps {
  filters: SearchFilterState;
  onSetFilter: (key: keyof SearchFilterState, value: string | null | undefined) => void;
}

interface HashtagSortOption {
  label: string;
  value: string;
}

const HASHTAG_SORT_OPTIONS: HashtagSortOption[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'Most Popular', value: 'most_popular' },
  { label: 'Recently Added', value: 'recently_added' },
  { label: 'Most Used', value: 'most_used' },
];

export const SearchHashtagFilters: React.FC<SearchHashtagFiltersProps> = ({
  filters,
  onSetFilter,
}) => {
  const [open, setOpen] = useState(false);

  // If sort_by is set in URL, use it; otherwise default to 'most_popular'
  const activeSort = filters.sort_by || 'most_popular';
  const isActive = Boolean(filters.sort_by);

  // Float active selection to the top of the list
  const displayOptions = useMemo(() => {
    const selectedOpt = HASHTAG_SORT_OPTIONS.find((opt) => opt.value === activeSort);
    const otherOpts = HASHTAG_SORT_OPTIONS.filter((opt) => opt.value !== activeSort);
    return selectedOpt ? [selectedOpt, ...otherOpts] : HASHTAG_SORT_OPTIONS;
  }, [activeSort]);

  const handleSelect = (val: string) => {
    // If clicking the already selected sort, toggle it off (reset to default)
    if (filters.sort_by === val) {
      onSetFilter('sort_by', undefined);
    } else {
      onSetFilter('sort_by', val);
    }
    setOpen(false);
  };

  return (
    <>
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
              Sort by
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="p-4 w-auto min-w-[140px] bg-ds-bg border border-ds-border rounded-[10px] flex flex-col items-start gap-3.5 shadow-2xl z-[120] focus:outline-none focus:ring-0"
        >
          {displayOptions.map((opt) => {
            const isSelected = activeSort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`font-dm-sans text-sm leading-normal transition-colors cursor-pointer text-left whitespace-nowrap outline-none bg-transparent hover:bg-transparent border-none p-0 ${
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
    </>
  );
};

