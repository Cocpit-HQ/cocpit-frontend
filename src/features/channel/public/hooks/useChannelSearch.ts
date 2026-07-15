import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DUMMY_ALL_CHANNELS, PublicChannelSummary } from '../data/dummy-public-channel-data';

export function useChannelSearch() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams ? searchParams.get('q') || '' : '';
  const [query, setQuery] = useState(initialQuery);
  
  useEffect(() => {
    if (searchParams) {
        const q = searchParams.get('q');
        if (q !== null) {
            setQuery(q);
        }
    }
  }, [searchParams]);

  const [subscribedOverrides, setSubscribedOverrides] = useState<Record<string, boolean>>({});

  const results = useMemo<PublicChannelSummary[]>(() => {
    const q = query.trim().toLowerCase();
    
    let filtered = DUMMY_ALL_CHANNELS;
    if (q) {
        filtered = DUMMY_ALL_CHANNELS.filter(
          (c) => c.name.toLowerCase().includes(q) || c.companyName.toLowerCase().includes(q)
        );
    }
    
    return filtered.map((c) => (c.id in subscribedOverrides ? { ...c, isSubscribed: subscribedOverrides[c.id] } : c));
  }, [query, subscribedOverrides]);

  const toggleSubscribe = (channelId: string) => {
    const current = results.find((c) => c.id === channelId);
    setSubscribedOverrides((prev) => ({ ...prev, [channelId]: !(current?.isSubscribed ?? false) }));
  };

  return {
    query,
    setQuery,
    results,
    isLoading: false,
    toggleSubscribe,
  };
}
