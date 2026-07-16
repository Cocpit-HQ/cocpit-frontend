import { useQuery } from '@tanstack/react-query';
import * as channelService from '../../services/channel.service';

export function usePublicChannelArticle(communityId: string | undefined, articleId: string | undefined) {
  const { data: article = null, isLoading } = useQuery({
    queryKey: ['public-channel-article', articleId],
    queryFn: () => (articleId ? channelService.getArticleById(articleId) : Promise.resolve(null)),
    enabled: !!articleId,
  });

  return {
    article,
    isLoading,
  };
}

