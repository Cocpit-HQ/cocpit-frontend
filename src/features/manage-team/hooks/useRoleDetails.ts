import { useQuery } from '@tanstack/react-query';
import * as teamService from '../services/team.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useRoleDetails = (roleId: string | null) => {
  const { activeProfile } = useActiveProfile();
  const orgId = activeProfile?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['team', 'role', orgId, roleId],
    queryFn: () => teamService.getRoleById(orgId!, roleId!),
    staleTime: 1000 * 60 * 3,
    enabled: !!orgId && !!roleId,
  });

  return {
    role: data ?? null,
    isLoading,
    refetch,
  };
};
