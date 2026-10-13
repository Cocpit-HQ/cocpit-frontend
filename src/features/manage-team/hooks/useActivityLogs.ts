// import { useCallback } from 'react';
// import { useInfiniteQuery } from '@tanstack/react-query';
// import * as teamService from '../services/team.service';
// import { ActivityLogFilters } from '../types/team.types';
// import { useActiveProfile } from '@/context/ActiveProfileContext';
// 
// type Cursor = teamService.ActivityLogCursor | null;
// 
// export const useActivityLogs = (filters?: ActivityLogFilters, limit: number = 20) => {
//   const { activeProfile } = useActiveProfile();
//   const orgId = activeProfile?.id;
// 
//   const {
//     data,
//     isLoading,
//     isFetchingNextPage,
//     hasNextPage,
//     fetchNextPage,
//     refetch,
//   } = useInfiniteQuery({
//     queryKey: ['team', 'activity-logs', orgId, filters, limit],
//     queryFn: ({ pageParam }) => teamService.getActivityLogs(orgId!, filters, pageParam as Cursor, limit),
//     staleTime: 1000 * 60 * 1,
//     enabled: !!orgId,
//     getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
//     initialPageParam: null as Cursor,
//   });
// 
//   const allPagesLogs = data?.pages.flatMap((page) => page.data) ?? [];
//   const logs = Array.from(new Map(allPagesLogs.map((item) => [item.id, item])).values());
// 
//   const loadMore = useCallback(() => {
//     if (hasNextPage && !isFetchingNextPage) {
//       fetchNextPage();
//     }
//   }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
// 
//   return {
//     logs,
//     isLoading,
//     isFetchingMore: isFetchingNextPage,
//     hasMore: !!hasNextPage,
//     loadMore,
//     refetch,
//   };
// };
