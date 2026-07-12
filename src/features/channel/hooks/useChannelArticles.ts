import { useQuery } from '@tanstack/react-query';
import * as channelService from '../services/channel.service';

export const useChannelArticles = (status?: 'published' | 'draft') => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['channel', 'articles', status],
    queryFn: () => channelService.getArticles(status),
    staleTime: 1000 * 60 * 2,
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
