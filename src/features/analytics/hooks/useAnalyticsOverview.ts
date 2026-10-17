import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { getAnalyticsOverview } from '@/services/api/analytics';
import { serializeDateRange } from './useAnalyticsFilter';

export function useAnalyticsOverview(filter: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'overview', filter, serializeDateRange(dateRange)],
    queryFn: () => getAnalyticsOverview(filter, dateRange ? { from: dateRange.from, to: dateRange.to } : undefined),
    enabled: filter !== 'Custom' || (!!dateRange?.from && !!dateRange?.to),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
