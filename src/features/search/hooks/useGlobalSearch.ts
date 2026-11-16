import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { searchService } from '../services/search.service';
import {
  SearchCategory,
  SearchFilterState,
  StageAResponse,
  StageBCategoryResponse,
} from '../types/search.types';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';

interface UseGlobalSearchParams {
  query: string;
  type: SearchCategory;
  filters?: SearchFilterState;
}

export function useGlobalSearch({ query, type, filters }: UseGlobalSearchParams) {
  const { activeProfile } = useActiveProfile();
  const actorScope = activeProfile ? `${activeProfile.type}:${activeProfile.id}` : 'guest';
  const cleanQuery = query.trim();
  const isAll = type === 'all';

  const hasActiveFilters = Boolean(
    filters &&
      Object.entries(filters).some(([key, val]) => {
        if (key === 'sort_by' || val === undefined || val === null || val === '') return false;
        if (Array.isArray(val)) return val.length > 0;
        return true;
      })
  );

  // Stage A: Multi-category overview
  const allQuery = useQuery<StageAResponse>({
    queryKey: ['global-search', actorScope, 'all', cleanQuery],
    queryFn: async () => {
      const data = await searchService.searchAll(cleanQuery);
      if (data?.results?.posts?.items && Array.isArray(data.results.posts.items)) {
        data.results.posts.items = data.results.posts.items.map(mapBackendPostToFrontend);
      }
      if (data?.sections?.posts?.items && Array.isArray(data.sections.posts.items)) {
        data.sections.posts.items = data.sections.posts.items.map(mapBackendPostToFrontend);
      }
      return data;
    },
    enabled: isAll && cleanQuery.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
  });

  // Stage B: Dedicated category deep-dive with infinite scroll keyset pagination
  const categoryQuery = useInfiniteQuery<StageBCategoryResponse<any>>({
    queryKey: ['global-search', actorScope, type, cleanQuery, filters],
    queryFn: async ({ pageParam }) => {
      const res = await searchService.searchCategory({
        q: cleanQuery,
        type,
        cursor: pageParam as string | null,
        filters,
      });

      // If posts, map posts through the application feed mapper
      if (type === 'posts' && Array.isArray(res.items)) {
        return {
          ...res,
          items: res.items.map(mapBackendPostToFrontend),
        };
      }

      return res;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      const nextCursor = lastPage?.next_cursor || lastPage?.pagination?.next_cursor;
      const hasMore = lastPage?.has_more ?? lastPage?.pagination?.has_more;
      return hasMore && nextCursor ? nextCursor : undefined;
    },
    enabled: !isAll && (cleanQuery.length > 0 || hasActiveFilters || type !== 'posts'),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
  });

  return {
    isAll,
    allData: allQuery.data,
    allLoading: allQuery.isLoading,
    allError: allQuery.isError,
    allRefetch: allQuery.refetch,

    categoryData: categoryQuery.data,
    categoryLoading: categoryQuery.isLoading,
    categoryError: categoryQuery.isError,
    isFetchingNextPage: categoryQuery.isFetchingNextPage,
    hasNextPage: categoryQuery.hasNextPage,
    fetchNextPage: categoryQuery.fetchNextPage,
    categoryRefetch: categoryQuery.refetch,
  };
}

