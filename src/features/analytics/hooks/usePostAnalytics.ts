import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { getPostAnalytics } from '@/services/api/analytics';
import { serializeDateRange } from './useAnalyticsFilter';

export function usePostAnalytics(postId: string, filter: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'post', postId, filter, serializeDateRange(dateRange)],
    queryFn: () => getPostAnalytics(postId, filter, dateRange ? { from: dateRange.from, to: dateRange.to } : undefined),
    enabled: !!postId && (filter !== 'Custom' || (!!dateRange?.from && !!dateRange?.to)),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
