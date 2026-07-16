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
            <div key={i} className="w-full flex items-center justify-between p-4 rounded-[40px] border border-gray-100 dark:border-[#2A2D35] bg-white dark:bg-[#121B2B]">
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="w-12 h-12 rounded-[14px] shrink-0" />
                <div className="flex flex-col gap-2 w-1/3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col mb-2">
        <h3 className="text-black dark:text-[#FFFFFF] text-[18px] font-semibold font-['Poppins'] leading-tight">
          My subscriptions
        </h3>
        <p className="text-gray-500 dark:text-[#A1A8B3] text-[12px] font-['Poppins'] mt-1">
          Total - {channels.length}
        </p>
      </div>
      {channels.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-[#121B2B] flex items-center justify-center">
            <Icon icon="solar:bell-linear" className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-gray-400 text-xs font-['Poppins']">You haven't subscribed to any channels yet.</p>
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

