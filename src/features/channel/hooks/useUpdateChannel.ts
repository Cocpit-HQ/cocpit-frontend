import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as channelService from '../services/channel.service';
import { ChannelInput } from '../services/channel.service';

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ChannelInput> }) =>
      channelService.updateChannel(id, input),
    onSuccess: () => {
      toast.success('Channel updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['channel', 'me'] });
    },
    onError: () => {
      toast.error('Failed to update channel.');
    },
  });
};
