import { useQuery } from '@tanstack/react-query';
import * as channelService from '../services/channel.service';

export const useChannelArticles = (communityId: string | undefined, status?: 'published' | 'draft') => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['channel', 'articles', communityId, status],
    queryFn: () => channelService.getArticles(communityId!, status),
    staleTime: 1000 * 60 * 2,
    enabled: !!communityId,
  });

  return {
    articles: data ?? [],
    isLoading,
    refetch,
  };
};

export const useChannelArticle = (id: string | undefined) => {
  const { data, isLoading } = useQuery({
    queryKey: ['channel', 'article', id],
    queryFn: () => channelService.getArticleById(id as string),
    enabled: !!id,
  });

  return {
    article: data ?? null,
    isLoading,
  };
};
