import React from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useSubscribedChannels } from '../hooks/useSubscribedChannels';
import PublicChannelCard from './PublicChannelCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function MySubscriptionsList() {
  const router = useRouter();
  const { channels, isLoading, unsubscribe } = useSubscribedChannels();

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col mb-2">
          <div className="h-6 w-36 bg-gray-200 dark:bg-[#2A2D35] rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-100 dark:bg-[#1C2333] rounded animate-pulse mt-2" />
        </div>
        <div className="w-full flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="w-full flex items-center justify-between p-4 rounded-[12px] border border-[#EEF2FF] dark:border-[#1C2340] bg-white dark:bg-[#121B2B]">
              <div className="flex items-center gap-[10px] w-full">
                <Skeleton className="w-[48px] h-[48px] rounded-[12px] shrink-0" />
                <div className="flex flex-col gap-2 w-1/3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-[40px] w-[142px] rounded-[24px] shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-[4px] mb-1">
        <h3 className="text-black dark:text-[#FFFFFF] text-[18px] font-medium font-['Poppins'] leading-[26px]">
          My subscriptions
        </h3>
        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[12px] font-normal font-['Poppins'] leading-[16px]">
          Total - {channels.length}
        </p>
      </div>
      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-[8px] text-center max-w-[320px] mx-auto mt-[36px] mb-[358px]">
          <p className="text-[#000000] dark:text-white text-[16px] leading-[24px] font-medium font-['Poppins'] max-w-[243px] mx-auto text-center">
            You haven't subscribed to any channels yet
          </p>
          <p className="text-[#6B7280] text-[12px] leading-[16px] font-normal font-['Poppins'] max-w-[277px] mx-auto text-center">
            Discover expert-led communities, career trajectories, and industry hubs tailored to your professional growth.
          </p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4">
          {channels.map((channel) => (
            <PublicChannelCard
              key={channel.id}
              channel={channel}
              variant="row"
              onClick={() => router.push(`/channels/${channel.id}`)}
              onToggleSubscribe={() => unsubscribe(channel.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

