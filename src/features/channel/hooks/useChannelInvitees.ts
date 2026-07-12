import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as channelService from '../services/channel.service';

export const useChannelInvitees = (search: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['channel', 'invitees', search],
    queryFn: () => channelService.getInvitees(search),
  });

  return {
    invitees: data ?? [],
    isLoading,
  };
};

export const useInviteSubscribers = () => {
  return useMutation({
    mutationFn: (userIds: string[]) => channelService.inviteUsers(userIds),
    onSuccess: (_data, userIds) => {
      toast.success(`Invited ${userIds.length} ${userIds.length === 1 ? 'person' : 'people'}.`);
    },
    onError: () => {
      toast.error('Failed to send invites.');
    },
  });
};
