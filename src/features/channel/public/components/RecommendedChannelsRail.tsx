import React from 'react';
import { useRouter } from 'next/navigation';
import { useRecommendedChannels } from '../hooks/useRecommendedChannels';
import PublicChannelCard from './PublicChannelCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecommendedChannelsRail() {
  const router = useRouter();
  const { channels, isLoading, toggleSubscribe } = useRecommendedChannels();

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col mb-2">
          <div className="h-7 w-48 bg-gray-200 dark:bg-[#2A2D35] rounded animate-pulse" />
          <div className="h-4 w-72 bg-gray-100 dark:bg-[#1C2333] rounded animate-pulse mt-2" />
        </div>
        <div className="flex flex-row overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory pb-2 w-full md:grid md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[300px] shrink-0 md:w-full snap-start flex flex-col items-center p-[16px] gap-[16px] bg-white dark:bg-[#121B2B] rounded-[24px] border border-[#EEF2FF] dark:border-[#1C2340] overflow-hidden" style={{ backdropFilter: 'blur(2px)' }}>
              <div className="flex flex-row items-start gap-[10px] w-full">
                <Skeleton className="w-[64px] h-[64px] rounded-[12px] shrink-0" />
                <div className="flex flex-col justify-center gap-1.5 flex-1 h-[64px]">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="w-full h-[40px] rounded-[24px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (channels.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-[16px]">
      <div className="flex flex-col">
        <h3 className="text-black dark:text-[#FFFFFF] text-[18px] md:text-[32px] font-medium tracking-[-0.64px] font-['Poppins'] leading-[26px] md:leading-[40px]">
          Top Recommended
        </h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[12px] md:text-[16px] font-normal font-['Poppins'] leading-[16px] md:leading-[24px]">
          Curated hubs matching your professional interest graph
        </p>
      </div>
      <div className="flex flex-row overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory pb-2 w-full md:grid md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
        {channels.slice(0, 3).map((channel) => (
          <PublicChannelCard
            key={channel.id}
            channel={channel}
            variant="grid"
            onClick={() => router.push(`/channels/${channel.id}`)}
            onToggleSubscribe={() => toggleSubscribe(channel.id)}
          />
        ))}
      </div>
    </div>
  );
}

