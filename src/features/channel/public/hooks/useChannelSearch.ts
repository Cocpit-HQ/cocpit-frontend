import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as channelService from '../../services/channel.service';

export function useChannelSearch() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams ? searchParams.get('q') || '' : '';
  const [query, setQuery] = useState(initialQuery);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (searchParams) {
        const q = searchParams.get('q');
        if (q !== null) {
            setQuery(q);
        }
    }
  }, [searchParams]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['channel-search', query],
    queryFn: () => channelService.searchChannels(query),
    enabled: true,
  });

  const subscribeMutation = useMutation({
    mutationFn: ({ channelId, isSubscribed }: { channelId: string; isSubscribed: boolean }) => {
      return isSubscribed 
        ? channelService.unsubscribeFromCommunity(channelId)
        : channelService.subscribeToCommunity(channelId);
    },
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: ['channel-search'] });
      queryClient.invalidateQueries({ queryKey: ['subscribed-channels'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-channels'] });
      queryClient.invalidateQueries({ queryKey: ['public-channel', channelId] });
      queryClient.invalidateQueries({ queryKey: ['public-channel'] });
    },
  });

  const toggleSubscribe = (channelId: string) => {
    const current = results.find((c) => c.id === channelId);
    if (current) {
      subscribeMutation.mutate({ channelId, isSubscribed: !!current.isSubscribed });
    }
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    toggleSubscribe,
  };
}

