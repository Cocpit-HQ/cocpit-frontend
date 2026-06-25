import { useState, useCallback, useEffect } from 'react';
import { JobListing, ListingsCounts } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';

export const useMyListings = () => {
  const [listings, setListings] = useState<JobListing[]>([]);
  const [statusFilter, setStatusFilterState] = useState<string>('All');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [counts, setCounts] = useState<ListingsCounts>({ all: 0, active: 0, closed: 0, draft: 0, inReview: 0 });

  const loadInitial = useCallback(async (status: string) => {
    setIsLoading(true);
    setListings([]);
    setCursor(undefined);
    setHasMore(true);

    try {
      const res = await jobsService.getMyListings(status);
      setListings(res.data);
      setCursor(res.nextCursor || undefined);
      setHasMore(res.hasMore);
      if (res.counts) {
        setCounts(res.counts);
      }
    } catch (error) {
      console.error('Failed to load job listings:', error);
      toast.error('Failed to load job listings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || isLoading) return;
    setIsFetchingMore(true);
    try {
      const res = await jobsService.getMyListings(statusFilter, cursor);
      setListings(prev => {
        const merged = [...prev, ...res.data];
        const seen = new Set<string>();
        return merged.filter(j => {
          if (seen.has(j.id)) return false;
          seen.add(j.id);
          return true;
        });
      });
      setCursor(res.nextCursor || undefined);
      setHasMore(res.hasMore);
      if (res.counts) {
        setCounts(res.counts);
      }
    } catch (error) {
      console.error('Failed to load more listings:', error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, isLoading, statusFilter, cursor]);

  const setStatusFilter = useCallback((newStatus: string) => {
    setStatusFilterState(newStatus);
    loadInitial(newStatus);
  }, [loadInitial]);

  const refresh = useCallback(() => {
    loadInitial(statusFilter);
  }, [loadInitial, statusFilter]);

  useEffect(() => {
    loadInitial('All');
  }, [loadInitial]);

  return {
    listings,
    isLoading,
    isFetchingMore,
    hasMore,
    counts,
    statusFilter,
    setStatusFilter,
    loadMore,
    refresh
  };
};
