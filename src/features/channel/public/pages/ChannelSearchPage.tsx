'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useChannelSearch } from '../hooks/useChannelSearch';
import PublicChannelCard from '../components/PublicChannelCard';
import { DUMMY_CHANNEL_ARTICLES } from '../data/dummy-public-channel-data';

export default function ChannelSearchPage() {
  const router = useRouter();
  const { query, results, toggleSubscribe } = useChannelSearch();

  return (
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-8 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto flex flex-col gap-6">
        <div className="w-full flex flex-col divide-y divide-gray-100 dark:divide-[#2A2D35]">
          {results.length === 0 ? (
            <p className="py-12 text-center text-gray-400 text-xs font-['Poppins']">
              No channels found for "{query}".
            </p>
          ) : (
            results.map((channel) => {
              const latestArticle = DUMMY_CHANNEL_ARTICLES[channel.id]?.[0];
              return (
                <PublicChannelCard
                  key={channel.id}
                  channel={channel}
                  variant="search-result"
                  latestArticle={latestArticle}
                  onClick={() => router.push(`/channels/${channel.id}`)}
                  onToggleSubscribe={() => toggleSubscribe(channel.id)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
