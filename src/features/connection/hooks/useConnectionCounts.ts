// src/features/connection/hooks/useConnectionCounts.ts
import { useQuery } from '@tanstack/react-query';
import { getConnectionCounts } from '@/services/api/connections';

export const useConnectionCounts = () =>
  useQuery({
    queryKey: ['connection-counts'],
    queryFn:  getConnectionCounts,
    staleTime: 30_000,
    retry: 1,
  });
