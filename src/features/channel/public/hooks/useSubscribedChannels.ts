import { useState } from 'react';
import { DUMMY_SUBSCRIBED_CHANNELS, PublicChannelSummary } from '../data/dummy-public-channel-data';

export function useSubscribedChannels() {
  const [channels, setChannels] = useState<PublicChannelSummary[]>(DUMMY_SUBSCRIBED_CHANNELS);

  const unsubscribe = (channelId: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
  };

  return {
    channels,
    isLoading: false,
    unsubscribe,
  };
}
