import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import * as teamService from '../services/team.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useRoleDetails = (roleId: string | null) => {
  const searchParams = useSearchParams();
  const { activeProfile } = useActiveProfile();
  const urlOrgId = searchParams?.get('orgId');
  const orgId = urlOrgId || activeProfile?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['team', 'role', orgId, roleId],
    queryFn: () => teamService.getRoleById(orgId!, roleId!),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: !!orgId && !!roleId,
  });

  return {
    role: data ?? null,
    isLoading,
    refetch,
  };
};
