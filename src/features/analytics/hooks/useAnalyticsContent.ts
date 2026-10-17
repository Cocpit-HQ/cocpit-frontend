import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { getAnalyticsContent } from '@/services/api/analytics';
import { serializeDateRange } from './useAnalyticsFilter';

export function useAnalyticsContent(filter: string, sortOption: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'content', filter, sortOption, serializeDateRange(dateRange)],
    queryFn: () => getAnalyticsContent(filter, sortOption, dateRange ? { from: dateRange.from, to: dateRange.to } : undefined),
    enabled: filter !== 'Custom' || (!!dateRange?.from && !!dateRange?.to),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
