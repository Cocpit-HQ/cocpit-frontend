import React from 'react';
import { Icon } from '@iconify/react';
import { PublicChannelSummary } from '../data/dummy-public-channel-data';
import { ChannelArticle } from '../../types/channel.types';

interface PublicChannelCardProps {
  channel: PublicChannelSummary;
  variant?: 'grid' | 'row' | 'search-result';
  latestArticle?: ChannelArticle;
  onClick?: () => void;
  onToggleSubscribe?: () => void;
}

export default function PublicChannelCard({
  channel,
  variant = 'grid',
  latestArticle,
  onClick,
  onToggleSubscribe,
}: PublicChannelCardProps) {
  const subscribeButton = !channel.isOwner ? (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleSubscribe?.();
      }}
      className={`px-6 py-2 rounded-full text-[13px] font-semibold font-['Poppins'] transition-all active:scale-95 flex-shrink-0 ${
        channel.isSubscribed
          ? 'bg-transparent border border-[#5A52FF] text-[#5A52FF] hover:opacity-80'
          : 'bg-[#5A52FF] text-white hover:opacity-90 shadow-sm'
      }`}
    >
      {channel.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
    </button>
  ) : null;

  if (variant === 'search-result') {
    return (
      <div 
        onClick={onClick}
        className={`w-full flex flex-col gap-4 py-4 ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h4 className="text-black dark:text-[#FFFFFF] text-[15px] font-semibold font-['Poppins']">
                {channel.name}
              </h4>
              <p className="text-gray-500 dark:text-[#A1A8B3] text-[11px] font-semibold font-['Poppins']">
                {channel.subscriberCount.toLocaleString()} subscribers
              </p>
            </div>
          </div>
          {subscribeButton}
        </div>

        {latestArticle && (
          <div className="flex gap-4 ml-[52px]">
            {latestArticle.coverImage && (
              <div className="w-[140px] h-[80px] rounded-xl overflow-hidden flex-shrink-0">
                <img src={latestArticle.coverImage} alt={latestArticle.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col">
              <h5 className="text-black dark:text-[#FFFFFF] text-[14px] font-semibold font-['Poppins'] mb-1 line-clamp-1">
                {latestArticle.title}
              </h5>
              <p className="text-gray-500 dark:text-[#A1A8B3] text-[12px] font-['Poppins'] line-clamp-2 leading-relaxed">
                {latestArticle.excerpt}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 rounded-[40px] border border-gray-100 dark:border-[#2A2D35] bg-white dark:bg-[#121B2B] hover:shadow-sm transition-all ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[14px] overflow-hidden bg-gray-100 dark:bg-[#1C2333] flex-shrink-0 border border-gray-100 dark:border-[#2A2D35]">
            <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="text-black dark:text-[#FFFFFF] text-[14px] font-semibold font-['Poppins'] truncate">
              {channel.name}
            </h4>
            <p className="text-gray-500 dark:text-[#A1A8B3] text-[12px] font-['Poppins'] mt-0.5">
              New post: "The React 19 Upgrade Guide" • 2h ago
            </p>
          </div>
        </div>
        {subscribeButton}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`w-full flex flex-col bg-white dark:bg-[#121B2B] rounded-[24px] border border-gray-100 dark:border-[#2A2D35] hover:shadow-md transition-shadow overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="relative w-full h-[140px] bg-gray-100 dark:bg-[#1C2333]">
        {channel.bannerUrl ? (
          <img src={channel.bannerUrl} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon icon="lucide:image" className="w-8 h-8 text-[#5A52FF] opacity-20" />
          </div>
        )}
      </div>
      <div className="flex flex-col p-5">
        <h4 className="text-black dark:text-[#FFFFFF] text-[16px] font-semibold font-['Poppins'] truncate mb-1.5">
          {channel.name}
        </h4>
        <p className="text-gray-500 dark:text-[#A1A8B3] text-[12px] font-['Poppins'] line-clamp-2 leading-relaxed mb-4">
          {channel.description}
        </p>
        <div className="flex items-center">
          {subscribeButton}
        </div>
      </div>
    </div>
  );
}
