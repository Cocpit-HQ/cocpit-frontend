import { useMemo } from 'react';
import { DUMMY_CHANNEL_ARTICLES } from '../data/dummy-public-channel-data';
import { ChannelArticle } from '../../types/channel.types';

export function usePublicChannelArticle(communityId: string | undefined, articleId: string | undefined) {
  const article: ChannelArticle | null = useMemo(() => {
    if (!communityId || !articleId) return null;
    const articles = DUMMY_CHANNEL_ARTICLES[communityId] ?? [];
    return articles.find((a) => a.id === articleId) ?? null;
  }, [communityId, articleId]);

  return {
    article,
    isLoading: false,
  };
}
