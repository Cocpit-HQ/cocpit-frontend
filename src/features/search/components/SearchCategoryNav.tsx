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
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { OrgPeopleFilters } from './org/OrgPeopleFilters';
import { OrgCompanyFilters } from './org/OrgCompanyFilters';
import { OrgPostsFilters } from './org/OrgPostsFilters';

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
  { id: 'institutes', label: 'Institutions' },
  { id: 'posts', label: 'Posts' },
  { id: 'hashtags', label: 'Hashtags' },
];

const ORG_NAV_TABS: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'people', label: 'People' },
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

  const { isCompany, activeProfile } = useActiveProfile();
  const isOrgActor = Boolean(
    isCompany ||
    activeProfile?.type === 'COMPANY' ||
    (activeProfile as any)?.type === 'ORGANIZATION' ||
    (activeProfile as any)?.type === 'ORG' ||
    activeProfile?.entityType === 'COMPANY' ||
    activeProfile?.entityType === 'INSTITUTION' ||
    (typeof window !== 'undefined' && (() => {
      try {
        const stored = sessionStorage.getItem('cocpit_active_profile');
        if (!stored) return false;
        const p = JSON.parse(stored);
        return p?.type === 'COMPANY' || p?.type === 'ORGANIZATION' || p?.entityType === 'COMPANY' || p?.entityType === 'INSTITUTION';
      } catch {
        return false;
      }
    })())
  );

  const visibleTabs = isOrgActor ? ORG_NAV_TABS : NAV_TABS;

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
      <div className="w-full flex flex-col items-center">
        <div className="w-full flex items-center justify-start md:justify-center px-4 pt-1 pb-3 md:py-0 md:pb-4 md:px-6 overflow-x-auto scrollbar-hide">
          <nav
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onClickCapture={handleClickCapture}
            className="w-full md:w-fit max-w-full sm:max-w-[680px] md:max-w-[720px] flex items-center justify-start md:justify-center gap-3 md:gap-3 mt-0 md:mt-4 overflow-x-auto scrollbar-hide select-none touch-pan-x overscroll-x-contain"
            aria-label="Search categories"
          >
            {visibleTabs.map((tab) => {
              const isActive = tab.id === currentCategory;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex-shrink-0 h-9 px-3.5 md:px-3 min-w-[48px] rounded-full inline-flex items-center justify-center border font-dm-sans text-base leading-6 font-medium tracking-normal transition-all cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? 'border-ds-accent bg-ds-bg text-ds-text-primary'
                      : 'border-ds-border bg-transparent text-ds-text-primary hover:border-ds-text-muted'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    );
  }

  // Stage B for Jobs: 2-row layout matching JobSearchPage design (user actor only)
  if (currentCategory === 'jobs' && filters && onToggleFilter && onSetFilter && onToggleVerified) {
    return (
      <div className="w-full flex justify-center pb-3 md:pb-4 px-4 sm:px-6">
        <div className="w-full md:w-fit max-w-[720px] sm:max-w-[760px] md:max-w-[800px] flex flex-col items-start mt-2 md:mt-4">
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

  // Stage B for Organization Search (People): 2-row layout matching JobSearchPage design
  if (isOrgActor && currentCategory === 'people' && filters && onSetFilter) {
    return (
      <div className="w-full flex justify-center pb-3 md:pb-4 px-4 sm:px-6">
        <div className="w-full md:w-fit max-w-[720px] sm:max-w-[760px] md:max-w-[800px] flex flex-col items-start mt-2 md:mt-4">
          <OrgPeopleFilters
            filters={filters}
            onSetFilter={onSetFilter}
            onToggleFilter={onToggleFilter}
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

  // Stage B for Organization Search (Company): 2-row layout matching JobSearchPage design
  if (isOrgActor && currentCategory === 'companies' && filters && onSetFilter) {
    return (
      <div className="w-full flex justify-center pb-3 md:pb-4 px-4 sm:px-6">
        <div className="w-full md:w-fit max-w-[720px] sm:max-w-[760px] md:max-w-[800px] flex flex-col items-start mt-2 md:mt-4">
          <OrgCompanyFilters
            filters={filters}
            onSetFilter={onSetFilter}
            onToggleFilter={onToggleFilter}
            onToggleVerified={onToggleVerified}
            onToggleActivelyHiring={onToggleActivelyHiring}
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

  // Stage B for Organization Search (Posts): 2-row layout matching JobSearchPage design
  if (isOrgActor && currentCategory === 'posts' && filters && onSetFilter) {
    return (
      <div className="w-full flex justify-center pb-3 md:pb-4 px-4 sm:px-6">
        <div className="w-full md:w-fit max-w-[720px] sm:max-w-[760px] md:max-w-[800px] flex flex-col items-start mt-2 md:mt-4">
          <OrgPostsFilters
            filters={filters}
            onSetFilter={onSetFilter}
            onToggleFilter={onToggleFilter}
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

  // Stage B for User Search (People): 2-row layout matching JobSearchPage design
  if (currentCategory === 'people' && filters && onSetFilter) {
    return (
      <div className="w-full flex justify-center pb-3 md:pb-4 px-4 sm:px-6">
        <div className="w-full md:w-fit max-w-[720px] sm:max-w-[760px] md:max-w-[800px] flex flex-col items-start mt-2 md:mt-4">
          <SearchPeopleFilters
            filters={filters}
            onSetFilter={onSetFilter}
            onToggleFilter={onToggleFilter}
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

  // Stage B for all other categories (User Companies/Posts/Institutes/Hashtags, and Org Institutes/Hashtags): Single row
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-center pb-3 md:pb-4 px-4 sm:px-6">
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onClickCapture={handleClickCapture}
          className="w-full md:w-fit max-w-full md:max-w-[800px] flex flex-row flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-3 overflow-x-auto md:overflow-visible scrollbar-hide select-none touch-pan-x overscroll-x-contain mt-2 md:mt-4"
        >
          <CategoryDropdownPill
            currentCategory={currentCategory}
            onSelectCategory={onSelectCategory}
            query={query}
          />

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
    </div>
  );
};
