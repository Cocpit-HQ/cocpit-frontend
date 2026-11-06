'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchCategory, SearchFilterState } from '../types/search.types';
import { CategoryDropdownPill } from './CategoryDropdownPill';
import { SearchJobFilters } from './filters/SearchJobFilters';
import { SearchPeopleFilters } from './filters/SearchPeopleFilters';
import { SearchOrgFilters } from './filters/SearchOrgFilters';
import { SearchPostFilters } from './filters/SearchPostFilters';
import { SearchHashtagFilters } from './filters/SearchHashtagFilters';

interface SearchCategoryNavProps {
  currentCategory: SearchCategory;
  onSelectCategory: (cat: SearchCategory) => void;
  filters?: SearchFilterState;
  onToggleFilter?: (key: keyof SearchFilterState, value: string) => void;
  onSetFilter?: (key: keyof SearchFilterState, value: string | null | undefined) => void;
  onToggleVerified?: () => void;
  onToggleActivelyHiring?: () => void;
  query?: string;
}

const NAV_TABS: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'people', label: 'People' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'companies', label: 'Company' },
  { id: 'institutes', label: 'Institution' },
  { id: 'posts', label: 'Posts' },
  { id: 'hashtags', label: 'Hashtags' },
];

export const SearchCategoryNav: React.FC<SearchCategoryNavProps> = ({
  currentCategory,
  onSelectCategory,
  filters,
  onToggleFilter,
  onSetFilter,
  onToggleVerified,
  onToggleActivelyHiring,
  query = '',
}) => {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Wheel listener: converts vertical mouse wheel scroll into horizontal scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [currentCategory]);

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const x = e.pageX - el.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasMovedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      hasMovedRef.current = false;
    }
  };

  const handleTabClick = (tabId: SearchCategory) => {
    onSelectCategory(tabId);
  };

  // Stage A: Horizontal category pills when viewing 'All'
  if (currentCategory === 'all') {
    return (
      <div className="w-full flex justify-center pb-4 px-4 sm:px-6">
        <nav
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleClickCapture}
          className="w-fit max-w-full sm:max-w-[680px] md:max-w-[720px] flex items-center gap-2 sm:gap-2.5 md:gap-3 mt-4 overflow-x-auto scrollbar-hide select-none touch-pan-x overscroll-x-contain"
          aria-label="Search categories"
        >
          {NAV_TABS.map((tab) => {
            const isActive = tab.id === currentCategory;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`h-9 px-2.5 sm:px-3 py-[6px] rounded-full flex items-center justify-center border font-dm-sans text-sm sm:text-base font-medium transition-all cursor-pointer select-none shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-ds-bg border-ds-accent text-ds-text-primary'
                    : 'bg-transparent border-ds-border text-ds-text-primary hover:border-ds-text-muted'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Stage B for Jobs: 2-row layout matching JobSearchPage design
  if (currentCategory === 'jobs' && filters && onToggleFilter && onSetFilter && onToggleVerified) {
    return (
      <div className="w-full flex justify-center pb-4 px-4 sm:px-6">
        <div className="w-full max-w-[720px] sm:max-w-[760px] md:max-w-[800px] flex flex-col items-start mt-4">
          <SearchJobFilters
            filters={filters}
            onToggleFilter={onToggleFilter}
            onSetFilter={onSetFilter}
            onToggleVerified={onToggleVerified}
            dropdownPill={
              <CategoryDropdownPill
                currentCategory={currentCategory}
                onSelectCategory={onSelectCategory}
                query={query}
              />
            }
          />
        </div>
      </div>
    );
  }

  const contentMaxWidth =
    currentCategory === 'posts'
      ? 'max-w-[442px]'
      : currentCategory === 'companies'
      ? 'max-w-[620px]'
      : currentCategory === 'institutes' || currentCategory === 'people'
      ? 'max-w-[540px]'
      : 'max-w-[488px]';

  // Stage B for all other categories: Render CategoryDropdownPill + category filters in single row (left-aligned)
  return (
    <div className="w-full flex justify-center pb-4 px-4 sm:px-6">
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onClickCapture={handleClickCapture}
        className={`w-full ${contentMaxWidth} flex flex-row items-center justify-start gap-3 overflow-x-auto scrollbar-hide select-none touch-pan-x overscroll-x-contain mt-4`}
      >
        <CategoryDropdownPill
          currentCategory={currentCategory}
          onSelectCategory={onSelectCategory}
          query={query}
        />

        {currentCategory === 'people' && filters && onSetFilter && (
          <SearchPeopleFilters
            filters={filters}
            onSetFilter={onSetFilter}
            onToggleFilter={onToggleFilter}
          />
        )}

        {(currentCategory === 'companies' || currentCategory === 'institutes') && filters && onSetFilter && (
          <SearchOrgFilters
            category={currentCategory}
            filters={filters}
            onSetFilter={onSetFilter}
            onToggleFilter={onToggleFilter}
            onToggleActivelyHiring={onToggleActivelyHiring}
          />
        )}

        {currentCategory === 'posts' && filters && onSetFilter && (
          <SearchPostFilters
            filters={filters}
            onSetFilter={onSetFilter}
            onToggleFilter={onToggleFilter}
          />
        )}

        {currentCategory === 'hashtags' && filters && onSetFilter && (
          <SearchHashtagFilters
            filters={filters}
            onSetFilter={onSetFilter}
          />
        )}
      </div>
    </div>
  );
};
