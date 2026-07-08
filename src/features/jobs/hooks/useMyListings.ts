import { useState, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { JobListing, ListingsCounts } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';

export const useMyListings = () => {
  const [statusFilter, setStatusFilterState] = useState<string>('All');
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['myListings', statusFilter],
    queryFn: async ({ pageParam }) => {
      try {
        const res = await jobsService.getMyListings(statusFilter, pageParam as string | undefined);
        return res;
      } catch (error) {
        console.error('Failed to load job listings:', error);
        toast.error('Failed to load job listings.');
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  // Extract merged listings
  const allPagesListings = data?.pages.flatMap(page => page.data) ?? [];
  
  // Deduplicate listings based on ID just in case
  const listings = Array.from(new Map(allPagesListings.map(item => [item.id, item])).values());

  // Extract latest counts from the first page (or default fallback)
  const counts: ListingsCounts = data?.pages[0]?.counts ?? { all: 0, active: 0, closed: 0, draft: 0, inReview: 0 };

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
