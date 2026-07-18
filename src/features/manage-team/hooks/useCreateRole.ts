import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as teamService from '../services/team.service';
import { CreateRoleInput } from '../types/team.types';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { activeProfile } = useActiveProfile();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => {
      const orgId = activeProfile?.id;
      if (!orgId) throw new Error('No active organization');
      return teamService.createRole(orgId, input);
    },
    onSuccess: () => {
      toast.success('Role created successfully!');
      queryClient.invalidateQueries({ queryKey: ['team', 'roles'] });
    },
    onError: () => {
      toast.error('Failed to create role.');
    },
  });
};
