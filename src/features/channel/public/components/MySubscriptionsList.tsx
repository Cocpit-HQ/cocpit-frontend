import React from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useSubscribedChannels } from '../hooks/useSubscribedChannels';
import PublicChannelCard from './PublicChannelCard';

export default function MySubscriptionsList() {
  const router = useRouter();
  const { channels, unsubscribe } = useSubscribedChannels();

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
