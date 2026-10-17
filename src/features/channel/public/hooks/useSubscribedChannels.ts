import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/context/SocketContext';
import * as channelService from '../../services/channel.service';

export function useSubscribedChannels() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['subscribed-channels'],
    queryFn: () => channelService.getSubscribedChannels(),
  });

  useEffect(() => {
    if (!socket) return;

    const handleArticlePublished = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['subscribed-channels'] });
    };

    socket.on('channel_article_published', handleArticlePublished);

    return () => {
      socket.off('channel_article_published', handleArticlePublished);
    };
  }, [socket, queryClient]);

  const unsubscribeMutation = useMutation({
    mutationFn: (channelId: string) => channelService.unsubscribeFromCommunity(channelId),
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: ['subscribed-channels'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-channels'] });
      queryClient.invalidateQueries({ queryKey: ['channel-search'] });
      queryClient.invalidateQueries({ queryKey: ['public-channel', channelId] });
      queryClient.invalidateQueries({ queryKey: ['public-channel'] });
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

