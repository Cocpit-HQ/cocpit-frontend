'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useChannelSearch } from '../hooks/useChannelSearch';
import PublicChannelCard from '../components/PublicChannelCard';
import { DUMMY_CHANNEL_ARTICLES } from '../data/dummy-public-channel-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChannelSearchPage() {
  const router = useRouter();
  const { query, results, isLoading, toggleSubscribe } = useChannelSearch();

  if (isLoading) {
    return (
      <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-8 px-4 xl:px-0">
        <div className="w-full max-w-[998px] mx-auto flex flex-col gap-6">
          <div className="w-full flex flex-col gap-6 divide-y divide-gray-100 dark:divide-[#2A2D35]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full flex flex-col gap-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 w-full">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex flex-col gap-2 w-1/4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                </div>
                <div className="flex gap-4 ml-[52px]">
                  <Skeleton className="w-[140px] h-[80px] rounded-xl shrink-0" />
                  <div className="flex flex-col gap-2 w-1/2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

