import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as channelService from '../services/channel.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useChannelInvitees = (search: string) => {
  const { activeProfile } = useActiveProfile();
  const orgId = activeProfile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['channel', 'invitees', orgId, search],
    queryFn: () => channelService.getInvitees(orgId!, search),
    enabled: !!orgId,
  });

  return {
    invitees: data ?? [],
    isLoading,
  };
};

export const useInviteSubscribers = () => {
  const { activeProfile } = useActiveProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userIds: string[]) => {
      const orgId = activeProfile?.id;
      if (!orgId) throw new Error("No active organization");
      return channelService.inviteUsers(orgId, userIds);
    },
    onSuccess: (_data, userIds) => {
      const orgId = activeProfile?.id;
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: ['channel', 'invitees', orgId] });
      }
      toast.success(`Invited ${userIds.length} ${userIds.length === 1 ? 'person' : 'people'}.`);
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.message || 'Failed to send invites.';
      toast.error(errMsg);
    },
  });
};
