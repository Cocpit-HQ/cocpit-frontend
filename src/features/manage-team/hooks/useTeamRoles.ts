import { useQuery } from '@tanstack/react-query';
import * as teamService from '../services/team.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useTeamRoles = () => {
  const { activeProfile } = useActiveProfile();
  const orgId = activeProfile?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['team', 'roles', orgId],
    queryFn: () => teamService.getTeamRoles(orgId!),
    staleTime: 1000 * 60 * 3,
    enabled: !!orgId,
  });

  return {
    roles: data ?? [],
    isLoading,
    refetch,
  };
};
