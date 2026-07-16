import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as channelService from '../../services/channel.service';

export function useSubscribedChannels() {
  const queryClient = useQueryClient();

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['subscribed-channels'],
    queryFn: () => channelService.getSubscribedChannels(),
  });

  const unsubscribeMutation = useMutation({
    mutationFn: (channelId: string) => channelService.unsubscribeFromCommunity(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribed-channels'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-channels'] });
      queryClient.invalidateQueries({ queryKey: ['channel-search'] });
    },
  });

  const unsubscribe = (channelId: string) => {
    unsubscribeMutation.mutate(channelId);
  };

  return {
    channels,
    isLoading,
    unsubscribe,
  };
}

