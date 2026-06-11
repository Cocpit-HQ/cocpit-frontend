// src/features/connection/hooks/useConnectionRequests.ts
import { useQuery } from '@tanstack/react-query';
import { getConnectionRequests } from '@/services/api/connections';
import type { ConnectionTab } from '../types';

export const useConnectionRequests = (tab: ConnectionTab, page = 1) =>
  useQuery({
    queryKey: ['connection-requests', tab, page],
    queryFn:  () => getConnectionRequests(tab, page, 10),
    staleTime: 30_000,
    retry: 1,
  });
