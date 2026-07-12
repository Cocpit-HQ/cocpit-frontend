import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as channelService from '../services/channel.service';
import { ChannelInput } from '../services/channel.service';

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChannelInput) => channelService.createChannel(input),
    onSuccess: () => {
      toast.success('Channel created successfully!');
      queryClient.invalidateQueries({ queryKey: ['channel', 'me'] });
    },
    onError: () => {
      toast.error('Failed to create channel.');
    },
  });
};
