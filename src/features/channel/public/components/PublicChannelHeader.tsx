import React from 'react';
import { Icon } from '@iconify/react';
import { PublicChannelSummary } from '../data/dummy-public-channel-data';

interface PublicChannelHeaderProps {
  channel: PublicChannelSummary;
  onToggleSubscribe: () => void;
}

export default function PublicChannelHeader({ channel, onToggleSubscribe }: PublicChannelHeaderProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full h-[140px] md:h-[160px] rounded-3xl overflow-hidden bg-gradient-to-r from-[#EFF4FF] to-[#E5EDFF] dark:from-[#121B2B] dark:to-[#1A2435] flex items-center justify-center">
        {channel.bannerUrl ? (
          <img src={channel.bannerUrl} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <Icon icon="lucide:image" className="w-12 h-12 text-[#1A73E8] opacity-20" />
        )}
      </div>

      <div className="w-full flex flex-col gap-3 px-1">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-black dark:text-[#FFFFFF] text-[15px] font-bold font-['Poppins']">
              {channel.name}
            </h2>
            <span className="text-gray-400 dark:text-gray-500 text-[12px] font-['Poppins']">•</span>
            <span className="text-gray-500 dark:text-gray-400 text-[12px] font-semibold font-['Poppins']">
              {channel.subscriberCount.toLocaleString()} Subscriber{channel.subscriberCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-gray-500 dark:text-[#A1A8B3] text-[12px] font-['Poppins'] leading-relaxed max-w-[800px]">
            {channel.description}
          </p>
        </div>
        <button
          onClick={onToggleSubscribe}
          className={`self-start px-6 py-2 rounded-full text-[13px] font-semibold font-['Poppins'] transition-all active:scale-95 mt-1 ${
            channel.isSubscribed
              ? 'bg-transparent border border-[#5A52FF] text-[#5A52FF] hover:opacity-80'
              : 'bg-[#5A52FF] text-white hover:opacity-90 shadow-sm'
          }`}
        >
          {channel.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
}
