import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { getAnalyticsOpportunities } from '@/services/api/analytics';
import { serializeDateRange } from './useAnalyticsFilter';

export function useAnalyticsOpportunities(filter: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['analytics', 'opportunities', filter, serializeDateRange(dateRange)],
    queryFn: () => getAnalyticsOpportunities(filter, dateRange ? { from: dateRange.from, to: dateRange.to } : undefined),
    enabled: filter !== 'Custom' || (!!dateRange?.from && !!dateRange?.to),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
