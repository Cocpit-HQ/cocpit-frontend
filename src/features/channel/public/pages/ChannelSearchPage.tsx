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
      <div className="w-full min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-12 px-4 xl:px-0">
        <div className="w-full max-w-[960px] mx-auto flex flex-col gap-[24px]">
          <div className="w-full flex flex-col gap-[24px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-full flex flex-col gap-[16px]">
                <div className="w-full h-[40px] flex items-center justify-between">
                  <div className="flex items-center gap-[8px] w-full">
                    <Skeleton className="w-[40px] h-[40px] rounded-full shrink-0" />
                    <div className="flex flex-col gap-1 w-1/4">
                      <Skeleton className="h-[16px] w-full" />
                      <Skeleton className="h-[12px] w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-[40px] w-[113px] rounded-[24px] shrink-0" />
                </div>
                <div className="w-full flex flex-col sm:flex-row items-start gap-[16px]">
                  <Skeleton className="w-full sm:w-[177px] h-[88.5px] rounded-[24px] shrink-0" />
                  <div className="flex flex-col gap-[8px] flex-1 min-w-0">
                    <Skeleton className="h-[20px] w-3/4" />
                    <Skeleton className="h-[16px] w-full" />
                    <Skeleton className="h-[16px] w-5/6" />
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
    <div className="w-full min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-12 px-4 xl:px-0">
      <div className="w-full max-w-[960px] mx-auto flex flex-col gap-[24px]">
        <div className="w-full flex flex-col gap-[24px]">
          {results.length === 0 ? (
            <p className="py-12 text-center text-gray-400 text-[14px] font-['Poppins']">
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

