import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as teamService from '../services/team.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  const { activeProfile } = useActiveProfile();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => {
      const orgId = activeProfile?.id;
      if (!orgId) throw new Error('No active organization');
      return teamService.updateMemberRole(orgId, userId, roleId);
    },
    onSuccess: () => {
      toast.success('Member role updated!');
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: () => {
      toast.error('Failed to update member role.');
    },
  });
};
