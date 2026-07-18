import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as teamService from '../services/team.service';
import { UpdateRoleInput } from '../types/team.types';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { activeProfile } = useActiveProfile();

  return useMutation({
    mutationFn: ({ roleId, input }: { roleId: string; input: UpdateRoleInput }) => {
      const orgId = activeProfile?.id;
      if (!orgId) throw new Error('No active organization');
      return teamService.updateRole(orgId, roleId, input);
    },
    onSuccess: () => {
      toast.success('Role updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['team', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['team', 'role'] });
    },
    onError: () => {
      toast.error('Failed to update role.');
    },
  });
};
