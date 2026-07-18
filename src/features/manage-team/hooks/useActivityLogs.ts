import { useQuery } from '@tanstack/react-query';
import * as teamService from '../services/team.service';
import { ActivityLogFilters } from '../types/team.types';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useActivityLogs = (filters?: ActivityLogFilters) => {
  const { activeProfile } = useActiveProfile();
  const orgId = activeProfile?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['team', 'activity-logs', orgId, filters],
    queryFn: () => teamService.getActivityLogs(orgId!, filters),
    staleTime: 1000 * 60 * 1,
    enabled: !!orgId,
  });

  return {
    logs: data ?? [],
    isLoading,
    refetch,
  };
};
