import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as channelService from '../services/channel.service';
import { ChannelInput } from '../services/channel.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  const { activeProfile } = useActiveProfile();

  return useMutation({
    mutationFn: (input: ChannelInput) => {
      const orgId = activeProfile?.id;
      if (!orgId) throw new Error("No active organization");
      return channelService.createChannel(orgId, input);
    },
    onSuccess: () => {
      toast.success('Channel created successfully!');
      queryClient.invalidateQueries({ queryKey: ['channel', 'me'] });
    },
    onError: () => {
      toast.error('Failed to create channel.');
    },
  });
};
