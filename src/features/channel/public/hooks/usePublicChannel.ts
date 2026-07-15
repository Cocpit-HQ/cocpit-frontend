import { useMemo, useState } from 'react';
import { DUMMY_ALL_CHANNELS, DUMMY_CHANNEL_ARTICLES, PublicChannelSummary } from '../data/dummy-public-channel-data';
import { ChannelArticle } from '../../types/channel.types';

export function usePublicChannel(communityId: string | undefined) {
  const baseChannel = useMemo(
    () => DUMMY_ALL_CHANNELS.find((c) => c.id === communityId) ?? null,
    [communityId]
  );

  const [isSubscribed, setIsSubscribed] = useState(baseChannel?.isSubscribed ?? false);

  const channel: PublicChannelSummary | null = baseChannel
    ? { ...baseChannel, isSubscribed }
    : null;

  const articles: ChannelArticle[] = communityId ? DUMMY_CHANNEL_ARTICLES[communityId] ?? [] : [];

  const toggleSubscribe = () => setIsSubscribed((prev) => !prev);

  return {
    channel,
    articles,
    isLoading: false,
    toggleSubscribe,
  };
}
