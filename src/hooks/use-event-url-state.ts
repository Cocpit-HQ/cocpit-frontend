'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterState, initialFilterState } from '@/components/events/EventFilters';

export function useEventUrlState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL exactly once on mount (or when remounted from back navigation)
  const initialSearch = searchParams.get('q') || '';
  const initialFiltersStr = searchParams.get('filters');
  const initialFilters = initialFiltersStr ? JSON.parse(decodeURIComponent(initialFiltersStr)) as FilterState : initialFilterState;
  const initialTab = searchParams.get('tab') || 'upcoming';

  const [searchQuery, setSearchQueryState] = useState(initialSearch);
  const [filters, setFiltersState] = useState<FilterState>(initialFilters);
  const [activeTab, setActiveTabState] = useState(initialTab);

  // Sync back from URL if user hits back/forward button (searchParams change)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'upcoming';
    if (tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
    const searchFromUrl = searchParams.get('q') || '';
    if (searchFromUrl !== searchQuery) {
      setSearchQueryState(searchFromUrl);
    }
    const filtersStrFromUrl = searchParams.get('filters');
    const filtersFromUrl = filtersStrFromUrl ? JSON.parse(decodeURIComponent(filtersStrFromUrl)) as FilterState : initialFilterState;
    if (JSON.stringify(filtersFromUrl) !== JSON.stringify(filters)) {
      setFiltersState(filtersFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // purposely omit activeTab, searchQuery, filters to prevent reverse loops

  const updateUrl = (newUpdates: { q?: string, tab?: string, filters?: FilterState }) => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (newUpdates.q !== undefined) {
      if (newUpdates.q) { params.set('q', newUpdates.q); changed = true; }
      else if (params.has('q')) { params.delete('q'); changed = true; }
    }

    if (newUpdates.tab !== undefined) {
      if (newUpdates.tab && newUpdates.tab !== 'upcoming') { params.set('tab', newUpdates.tab); changed = true; }
      else if (params.has('tab')) { params.delete('tab'); changed = true; }
    }

    if (newUpdates.filters !== undefined) {
      const newFiltersStr = encodeURIComponent(JSON.stringify(newUpdates.filters));
      const isInitial = JSON.stringify(newUpdates.filters) === JSON.stringify(initialFilterState);
      const currentFiltersStr = params.get('filters');

      if (!isInitial && currentFiltersStr !== newFiltersStr) {
        params.set('filters', newFiltersStr);
        changed = true;
      } else if (isInitial && currentFiltersStr) {
        params.delete('filters');
        changed = true;
      }
    }

    if (changed) {
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  const setSearchQuery = (q: string) => {
    setSearchQueryState(q);
    updateUrl({ q });
  };

  const setFilters = (f: FilterState | ((prev: FilterState) => FilterState)) => {
    setFiltersState((prev) => {
      const newFilters = typeof f === 'function' ? f(prev) : f;
      updateUrl({ filters: newFilters });
      return newFilters;
    });
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    updateUrl({ tab });
  };

  return {
    searchQuery, setSearchQuery,
    filters, setFilters,
    activeTab, setActiveTab
  };
}
