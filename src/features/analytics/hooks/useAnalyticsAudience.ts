import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { getAnalyticsAudience } from '@/services/api/analytics';
import { serializeDateRange } from './useAnalyticsFilter';

export function useAnalyticsAudience(filter: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'audience', filter, serializeDateRange(dateRange)],
    queryFn: () => getAnalyticsAudience(filter, dateRange ? { from: dateRange.from, to: dateRange.to } : undefined),
    enabled: filter !== 'Custom' || (!!dateRange?.from && !!dateRange?.to),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
