import { useState } from 'react';
import { DUMMY_RECOMMENDED_CHANNELS, PublicChannelSummary } from '../data/dummy-public-channel-data';

export function useRecommendedChannels() {
  const [channels, setChannels] = useState<PublicChannelSummary[]>(DUMMY_RECOMMENDED_CHANNELS);

  const toggleSubscribe = (channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, isSubscribed: !c.isSubscribed } : c))
    );
  };

  return {
    channels,
    isLoading: false,
    toggleSubscribe,
  };
}
