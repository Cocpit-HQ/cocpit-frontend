// src/features/connection/hooks/useConnectionSuggestions.ts
import { useQuery } from '@tanstack/react-query';
import { getConnectionSuggestions } from '@/services/api/connections';

/**
 * @param enabled  Pass false when on Sent tab — suggestions are only shown on Received tab.
 */
export const useConnectionSuggestions = (enabled: boolean) =>
  useQuery({
    queryKey: ['connection-suggestions'],
    queryFn:  () => getConnectionSuggestions(8),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
