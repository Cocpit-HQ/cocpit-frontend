// src/features/connection/hooks/useConnectionCounts.ts
import { useQuery } from '@tanstack/react-query';
import { getConnectionCounts } from '@/services/api/connections';

export const useConnectionCounts = () =>
  useQuery({
    queryKey: ['connection-counts'],
    queryFn:  getConnectionCounts,
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
