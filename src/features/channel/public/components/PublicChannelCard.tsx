import React from 'react';
import { Icon } from '@iconify/react';
import { PublicChannelSummary } from '../data/dummy-public-channel-data';
import { ChannelArticle } from '../../types/channel.types';
import { formatDistanceToNowStrict } from 'date-fns';

const formatShortTime = (dateString?: string): string => {
  if (!dateString) return 'Just now';
  try {
    const distance = formatDistanceToNowStrict(new Date(dateString));
    return distance
      .replace(/ seconds?/, 's')
      .replace(/ minutes?/, 'm')
      .replace(/ hours?/, 'h')
      .replace(/ days?/, 'd')
      .replace(/ months?/, 'mo')
      .replace(/ years?/, 'y') + ' ago';
  } catch (e) {
    return 'Just now';
  }
};

const formatSubscribers = (count?: number) => {
  if (!count) return '0';
  if (count >= 1000) {
    return Math.floor(count / 1000) + 'k';
  }
  return count.toString();
};

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
  const subscribeButtonClass = channel.isSubscribed
    ? `h-[40px] px-4 py-2 rounded-[24px] bg-transparent border border-[#6366F1] dark:border-[#818CF8] text-[#6366F1] dark:text-[#818CF8] hover:bg-[#6366F1]/10 font-normal text-[16px] leading-[24px] ${
        variant === 'grid' ? 'w-full' : 'w-[142px]'
      }`
    : `h-[40px] px-4 py-2 rounded-[24px] bg-[#6366F1] dark:bg-[#818CF8] text-white hover:opacity-90 font-medium text-[16px] leading-[24px] ${
        variant === 'grid' ? 'w-full' : 'w-[113px]'
      }`;

  const subscribeButton = !channel.isOwner ? (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleSubscribe?.();
      }}
      className={`${subscribeButtonClass} font-['Poppins'] transition-all active:scale-95 flex items-center justify-center shrink-0`}
    >
      {channel.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
    </button>
  ) : null;

  if (variant === 'search-result') {
    const displayTitle = latestArticle?.title || 
      (channel.name?.toLowerCase().includes('matrix') ? "Architecting the Living Office" : "The Synthesis Age: How Generative Design is Redefining Creative Workflows");
    const displayExcerpt = latestArticle?.excerpt || channel.description || 
      (channel.name?.toLowerCase().includes('matrix') 
        ? "Beyond plants: the next generation of office spaces will be living organisms that manage energy through integrated bio-systems." 
        : "We are moving beyond simple automation. The next decade will be defined by 'Collaborative Intelligence' where designers act as curators of AI-generated...");
    const displayImage = latestArticle?.coverImage || channel.bannerUrl || 
      (channel.name?.toLowerCase().includes('matrix') ? '/images/CHANNEL/articleimage1.png' : '/images/CHANNEL/articleimage.png');

    return (
      <div 
        onClick={onClick}
        className={`w-full flex flex-col gap-[16px] ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="w-full h-[40px] flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <div className="w-[40px] h-[40px] rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-[#1C2333]">
              <img src={channel.logoUrl || '/assets/pngegg.png'} alt={channel.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <h4 className="text-black dark:text-white text-[16px] font-medium leading-[24px] font-['Poppins'] truncate max-w-[250px] sm:max-w-[400px]">
                {channel.name}
              </h4>
              <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[10px] font-semibold leading-[16px] font-['Poppins']">
                {channel.subscriberCount ? channel.subscriberCount.toLocaleString() : '0'} subscribers
              </p>
            </div>
          </div>
          {subscribeButton}
        </div>

        <div className="w-full flex flex-col sm:flex-row items-start gap-[16px]">
          <div className="w-full sm:w-[177px] h-[88.5px] rounded-[24px] overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-[#2A2D35]">
            <img src={displayImage} alt={displayTitle} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-[8px] flex-1 min-w-0">
            <h5 className="text-black dark:text-white text-[18px] font-medium leading-[26px] font-['Poppins'] truncate">
              {displayTitle}
            </h5>
            <p className="text-[#6B7280] dark:text-[#A1A8B3] text-[16px] font-normal leading-[24px] font-['Poppins'] line-clamp-2">
              {displayExcerpt}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div
        onClick={onClick}
        className={`w-full flex flex-row items-center p-0 md:p-[16px] gap-[10px] md:gap-[8px] rounded-none md:rounded-[12px] border-none md:border md:border-[#EEF2FF] md:dark:border-[#1C2340] bg-transparent md:bg-white md:dark:bg-[#121B2B] hover:shadow-none md:hover:shadow-sm transition-all ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="w-[64px] md:w-[48px] h-[64px] md:h-[48px] rounded-[12px] overflow-hidden bg-gray-100 dark:bg-[#1C2333] flex-shrink-0 border border-gray-100 dark:border-[#2A2D35]">
          <img src={channel.logoUrl || '/assets/pngegg.png'} alt={channel.companyName || channel.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col items-start justify-center md:justify-start flex-1 min-w-0 h-[64px] md:h-[40px]">
          <div className="flex flex-row items-center gap-[8px] h-[24px] w-full">
            <h4 className="text-black dark:text-[#FFFFFF] text-[16px] font-semibold leading-[24px] font-['Poppins'] truncate">
              {channel.name}
            </h4>
            <div className="hidden md:block w-[6px] h-[6px] bg-black dark:bg-white rounded-full flex-shrink-0"></div>
            <p className="hidden md:block text-black dark:text-[#FFFFFF] text-[12px] font-semibold leading-[24px] font-['Poppins'] whitespace-nowrap">
              {formatSubscribers(channel.subscriberCount)} Subscriber
            </p>
          </div>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[12px] font-normal leading-[16px] font-['Poppins'] truncate w-full h-[16px]">
            {channel.companyName || 'Technews'}
          </p>
          <p className="md:hidden text-black dark:text-[#FFFFFF] text-[12px] font-semibold leading-[24px] font-['Poppins'] whitespace-nowrap w-full h-[24px]">
            {formatSubscribers(channel.subscriberCount)} Subscriber
          </p>
        </div>
        <div className="hidden md:flex">
          {subscribeButton}
        </div>
      </div>
    );
  }


  return (
    <div
      onClick={onClick}
      className={`w-[300px] shrink-0 md:w-full h-[152px] md:h-[130px] flex flex-col items-center p-[16px] gap-[16px] bg-white dark:bg-[#121B2B] rounded-[24px] border border-[#EEF2FF] dark:border-[#1C2340] hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div className="flex flex-row items-start gap-[10px] w-full shrink-0">
        <div className="w-[64px] h-[64px] rounded-[12px] overflow-hidden shrink-0 bg-gray-100 dark:bg-[#1C2333] border border-gray-100 dark:border-[#2A2D35]">
          <img src={channel.logoUrl || '/assets/pngegg.png'} alt={channel.companyName || channel.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col items-start flex-1 min-w-0 h-[64px]">
          <h4 className="text-black dark:text-[#FFFFFF] text-[16px] font-semibold leading-[24px] font-['Poppins'] truncate w-full h-[24px]">
            {channel.name}
          </h4>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[12px] font-normal leading-[16px] font-['Poppins'] truncate w-full h-[16px]">
            {channel.companyName || 'Technews'}
          </p>
          <p className="text-black dark:text-[#FFFFFF] text-[12px] font-semibold leading-[24px] font-['Poppins'] truncate w-full h-[24px]">
            {formatSubscribers(channel.subscriberCount)} Subscriber
          </p>
        </div>
      </div>
      <div className="flex w-full shrink-0 z-10">
        {subscribeButton}
      </div>
    </div>
  );
}
