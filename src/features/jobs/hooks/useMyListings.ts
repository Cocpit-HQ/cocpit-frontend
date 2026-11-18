import { useState, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { JobListing, ListingsCounts } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useMyListings = (initialStatus: string = 'All') => {
  const [statusFilter, setStatusFilterState] = useState<string>(initialStatus);
  const queryClient = useQueryClient();
  const { activeProfile, isLoading: isActiveProfileLoading } = useActiveProfile();

  const storedProfile = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('cocpit_active_profile');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }, []);

  const activeProfileId = activeProfile?.id || storedProfile?.id || 'me';
  const activeProfileType = activeProfile?.type || storedProfile?.type || 'USER';

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['myListings', activeProfileType, activeProfileId, statusFilter],
    queryFn: async ({ pageParam }) => {
      try {
        const actorTypeParam = activeProfileType === 'COMPANY' ? 'ORGANIZATION' : 'USER';
        const res = await jobsService.getMyListings(
          statusFilter, 
          pageParam as string | undefined,
          10,
          actorTypeParam,
          activeProfile?.id
        );
        return res;
      } catch (error) {
        console.error('Failed to load job listings:', error);
        toast.error('Failed to load job listings.');
        throw error;
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 3, // 3-minute cache: switching status tabs reuses cache within this window
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !isActiveProfileLoading && !!activeProfile,
  });

  // Extract merged listings with stable reference
  const listings = useMemo(() => {
    const allPagesListings = data?.pages.flatMap(page => page.data) ?? [];
    return Array.from(new Map(allPagesListings.map(item => [item.id, item])).values());
  }, [data]);

  // Extract latest counts from the first page (or fallback to cached counts from localStorage)
  const counts: ListingsCounts = useMemo(() => {
    const fetchedCounts = data?.pages[0]?.counts;
    if (fetchedCounts) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cocpit_listings_counts_last', JSON.stringify(fetchedCounts));
          const id = activeProfileId !== 'me' ? activeProfileId : storedProfile?.id;
          if (id) {
            localStorage.setItem(`cocpit_listings_counts_${id}`, JSON.stringify(fetchedCounts));
          }
        } catch (e) {}
      }
      return fetchedCounts;
    }
    if (typeof window !== 'undefined') {
      try {
        const idToUse = activeProfileId !== 'me' ? activeProfileId : storedProfile?.id;
        const stored = (idToUse ? localStorage.getItem(`cocpit_listings_counts_${idToUse}`) : null) 
          || localStorage.getItem('cocpit_listings_counts_last');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.all === 'number') {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return { all: 0, active: 0, closed: 0, draft: 0, inReview: 0, rejected: 0 };
  }, [data, activeProfileId, storedProfile?.id]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const setStatusFilter = useCallback((newStatus: string) => {
    setStatusFilterState(newStatus);
  }, []);

  const refresh = useCallback(() => {
    // Invalidate queries to forcefully refetch
    queryClient.invalidateQueries({ queryKey: ['myListings'] });
  }, [queryClient]);

  return {
    listings,
    isLoading,
    isFetchingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    counts,
    statusFilter,
    setStatusFilter,
    loadMore,
    refresh
  };
};
