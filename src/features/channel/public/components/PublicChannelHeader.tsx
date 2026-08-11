import React from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { PublicChannelSummary } from '../data/dummy-public-channel-data';

interface PublicChannelHeaderProps {
  channel: PublicChannelSummary;
  onToggleSubscribe: () => void;
}

export default function PublicChannelHeader({ channel, onToggleSubscribe }: PublicChannelHeaderProps) {
  const router = useRouter();

  const handleOrgClick = () => {
    const targetSlugOrId = channel.companySlug || channel.orgId;
    if (targetSlugOrId) {
      router.push(`/organization/${targetSlugOrId}`);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full aspect-[6/1] rounded-3xl overflow-hidden bg-gradient-to-r from-[#EFF4FF] to-[#E5EDFF] dark:from-[#121B2B] dark:to-[#1A2435] flex items-center justify-center">
        {channel.bannerUrl ? (
          <img src={channel.bannerUrl} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <Icon icon="lucide:image" className="w-12 h-12 text-[#1A73E8] opacity-20" />
        )}
      </div>

      <div className="w-full max-w-[960px] flex flex-row items-start gap-[16px] mt-4 px-1">
        <div 
          onClick={handleOrgClick}
          title={channel.companyName ? `View ${channel.companyName} profile` : 'View organization profile'}
          className="w-[114px] h-[114px] min-w-[114px] rounded-[12px] overflow-hidden bg-gray-100 dark:bg-[#1C2333] flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),_0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
        >
          <img
            src={channel.logoUrl || "/images/companyonboarding/companyprofileDefault.jpg"}
            alt={channel.companyName || channel.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col items-start gap-[8px] flex-1 min-w-0">
          <div className="flex flex-col items-start min-w-0 w-full">
            <div className="flex flex-row items-center gap-[8px] h-[24px]">
              <h2 className="text-black dark:text-[#FFFFFF] text-[16px] font-medium font-['Poppins'] leading-[24px] truncate">
                {channel.name}
              </h2>
              <div className="w-[6px] h-[6px] bg-[#6B7280] rounded-full flex-shrink-0"></div>
              <span className="text-[#6B7280] text-[12px] font-semibold font-['Poppins'] leading-[24px] whitespace-nowrap">
                {channel.subscriberCount >= 1000 ? Math.floor(channel.subscriberCount / 1000) + 'k' : channel.subscriberCount} Subscriber
              </span>
            </div>
            {channel.companyName && (
              <span 
                onClick={handleOrgClick}
                className="text-[#000000] dark:text-[#D1D5DB] font-['Poppins'] font-medium text-[12px] leading-[18px] h-[18px] cursor-pointer hover:underline self-start truncate max-w-full"
              >
                {channel.companyName}
              </span>
            )}
            <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[12px] font-normal font-['Poppins'] leading-[24px] h-[24px] truncate w-full">
              {channel.description}
            </p>
          </div>
          {!channel.isOwner && (
            <button
              onClick={onToggleSubscribe}
              className={`flex flex-row justify-center items-center px-4 py-2 h-[40px] rounded-[24px] font-['Poppins'] font-normal text-[16px] leading-[24px] transition-all active:scale-95 ${
                channel.isSubscribed
                  ? 'w-[142px] bg-transparent border border-[#6366F1] dark:border-[#818CF8] text-[#6366F1] dark:text-[#818CF8] hover:bg-[#6366F1]/10'
                  : 'w-[113px] bg-[#6366F1] dark:bg-[#818CF8] text-white hover:opacity-90'
              }`}
            >
              {channel.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
