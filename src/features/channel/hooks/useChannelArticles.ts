import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import * as channelService from '../services/channel.service';

export const useChannelArticles = (communityId: string | undefined, status?: 'published' | 'draft') => {
  return useInfiniteQuery({
    queryKey: ['channel', 'articles', communityId, status],
    queryFn: ({ pageParam }) => channelService.getArticles(communityId!, status, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
  });
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
