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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full flex flex-col bg-white dark:bg-[#121B2B] rounded-[24px] border border-[#EEF2FF] dark:border-[#1C2340] overflow-hidden">
              <Skeleton className="w-full h-[154px] rounded-none" />
              <div className="flex flex-col p-4 gap-3">
                <div className="flex items-center gap-[10px]">
                  <Skeleton className="w-[48px] h-[48px] rounded-[12px] shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-[40px] w-[113px] rounded-[24px] mt-1" />
              </div>
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
        <h3 className="text-black dark:text-[#FFFFFF] text-[32px] font-medium tracking-[-0.64px] font-['Poppins'] leading-[40px]">
          Top Recommended
        </h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[16px] font-normal font-['Poppins'] leading-[24px]">
          Curated hubs matching your professional interest graph
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
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

