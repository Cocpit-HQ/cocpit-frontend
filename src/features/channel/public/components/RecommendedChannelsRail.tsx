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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full flex flex-col bg-white dark:bg-[#121B2B] rounded-[24px] border border-gray-100 dark:border-[#2A2D35] overflow-hidden">
              <Skeleton className="w-full h-[140px] rounded-none" />
              <div className="flex flex-col p-5 gap-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-24 rounded-full mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (channels.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col mb-2">
        <h3 className="text-black dark:text-[#FFFFFF] text-[22px] font-semibold font-['Poppins'] leading-tight">
          Top Recommended
        </h3>
        <p className="text-gray-500 dark:text-[#A1A8B3] text-[13px] font-['Poppins'] mt-1">
          Curated hubs matching your professional interest graph
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

