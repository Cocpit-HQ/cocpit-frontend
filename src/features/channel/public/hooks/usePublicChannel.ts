import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as channelService from '../../services/channel.service';

export function usePublicChannel(communityId: string | undefined, includeArticles: boolean = true) {
  const queryClient = useQueryClient();

  const { data: channel = null, isLoading: isChannelLoading } = useQuery({
    queryKey: ['public-channel', communityId],
    queryFn: () => (communityId ? channelService.getPublicChannel(communityId) : Promise.resolve(null)),
    enabled: !!communityId,
  });

  const { data: articles = [], isLoading: isArticlesLoading } = useQuery({
    queryKey: ['public-channel-articles', communityId],
    queryFn: () => (communityId ? channelService.getArticles(communityId, 'published') : Promise.resolve([])),
    enabled: !!communityId && includeArticles,
  });

  const subscribeMutation = useMutation({
    mutationFn: (isSubscribed: boolean) => {
      if (!communityId) return Promise.resolve();
      return isSubscribed
        ? channelService.unsubscribeFromCommunity(communityId)
        : channelService.subscribeToCommunity(communityId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-channel', communityId] });
      queryClient.invalidateQueries({ queryKey: ['subscribed-channels'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-channels'] });
    },
  });

  const toggleSubscribe = () => {
    if (channel) {
      subscribeMutation.mutate(!!channel.isSubscribed);
    }
  };

  const isLoading = isChannelLoading || (includeArticles && isArticlesLoading);

  return {
    channel,
    articles,
    isLoading,
    toggleSubscribe,
  };
}

