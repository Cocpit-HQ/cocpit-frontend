import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as channelService from '../../services/channel.service';

export function useRecommendedChannels() {
  const queryClient = useQueryClient();

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['recommended-channels'],
    queryFn: () => channelService.getRecommendedChannels(),
  });

  const subscribeMutation = useMutation({
    mutationFn: (channelId: string) => channelService.subscribeToCommunity(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommended-channels'] });
      queryClient.invalidateQueries({ queryKey: ['subscribed-channels'] });
      queryClient.invalidateQueries({ queryKey: ['channel-search'] });
    },
  });

  const toggleSubscribe = (channelId: string) => {
    subscribeMutation.mutate(channelId);
  };

  return {
    channels,
    isLoading,
    toggleSubscribe,
  };
}

