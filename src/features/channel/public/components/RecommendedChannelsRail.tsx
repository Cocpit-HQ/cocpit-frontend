import React from 'react';
import { useRouter } from 'next/navigation';
import { useRecommendedChannels } from '../hooks/useRecommendedChannels';
import PublicChannelCard from './PublicChannelCard';

export default function RecommendedChannelsRail() {
  const router = useRouter();
  const { channels, toggleSubscribe } = useRecommendedChannels();

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
        {channels.map((channel) => (
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
