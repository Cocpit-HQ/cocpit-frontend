import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConnectionSuggestions } from '@/services/api/connections';
import { useConnectionStore } from '@/store/connection.store';
import type { SuggestedUser } from '../types';

const BATCH_SIZE = 16;
const PREFETCH_THRESHOLD = 4;

/**
 * @param enabled  Pass false when on Sent tab — suggestions are only shown on Received tab.
 */
export const useConnectionSuggestions = (enabled: boolean) => {
  const { dismissedSuggestionIds, followedUserIds } = useConnectionStore();
  const [offset, setOffset] = useState(0);
  const [pool, setPool] = useState<SuggestedUser[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Exclude IDs already dismissed or requested
  const excludedIds = Array.from(
    new Set([...Array.from(dismissedSuggestionIds), ...Array.from(followedUserIds)])
  );

  const query = useQuery({
    queryKey: ['connection-suggestions', offset, excludedIds.join(',')],
    queryFn: async () => {
      const response = await getConnectionSuggestions(BATCH_SIZE, offset, excludedIds);
      return response;
    },
    enabled,
    staleTime: 60_000,
    retry: 1,
  });

  // Synchronize returned data into candidate pool
  useEffect(() => {
    if (query.data?.data) {
      const newItems = query.data.data;
      setHasMore(query.data.pagination?.hasMore ?? newItems.length >= BATCH_SIZE);

      setPool((prevPool) => {
        const existingIds = new Set(prevPool.map((u) => u.id));
        const filteredNew = newItems.filter(
          (user) =>
            !existingIds.has(user.id) &&
            !dismissedSuggestionIds.has(user.id) &&
            !followedUserIds.has(user.id)
        );
        return [...prevPool, ...filteredNew];
      });
    }
  }, [query.data, dismissedSuggestionIds, followedUserIds]);

  // Compute active visible cards (all unacted candidates in pool)
  const activeSuggestions = pool.filter(
    (user) =>
      !dismissedSuggestionIds.has(user.id) && !followedUserIds.has(user.id)
  );

  const fetchNextBatch = useCallback(() => {
    if (hasMore && !query.isFetching) {
      setOffset((prev) => prev + BATCH_SIZE);
    }
  }, [hasMore, query.isFetching]);

  // Auto pre-fetch next batch when unacted remaining pool drops below threshold
  useEffect(() => {
    if (enabled && activeSuggestions.length < PREFETCH_THRESHOLD && hasMore && !query.isFetching) {
      fetchNextBatch();
    }
  }, [enabled, activeSuggestions.length, hasMore, query.isFetching, fetchNextBatch]);

  return {
    data: { data: activeSuggestions },
    suggestions: activeSuggestions,
    isLoading: query.isLoading && pool.length === 0,
    isFetching: query.isFetching,
    isError: query.isError,
    hasMore,
    fetchNextBatch,
  };
};

