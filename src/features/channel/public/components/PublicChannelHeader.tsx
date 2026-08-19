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
    <div className="w-full flex flex-col md:gap-4 bg-white dark:bg-[#0F1115]">
      {/* Banner */}
      <div className="relative w-full h-[94px] md:h-auto md:aspect-[6/1] rounded-none md:rounded-3xl overflow-hidden bg-gradient-to-r from-[#EFF4FF] to-[#E5EDFF] dark:from-[#121B2B] dark:to-[#1A2435] flex items-center justify-center">
        {channel.bannerUrl ? (
          <img src={channel.bannerUrl} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <Icon icon="lucide:image" className="w-12 h-12 text-[#1A73E8] opacity-20" />
        )}
      </div>

      <div className="w-full max-w-[960px] flex flex-col md:flex-row md:items-start md:gap-[16px] px-4 md:px-1 pt-4 md:pt-0 pb-4 md:pb-0 md:mt-4 border-b border-[#EEF2FF] dark:border-[#1C2340] md:border-b-0">
        
        {/* Desktop Logo */}
        <div 
          onClick={handleOrgClick}
          title={channel.companyName ? `View ${channel.companyName} profile` : 'View organization profile'}
          className="hidden md:flex w-[114px] h-[114px] min-w-[114px] rounded-[12px] overflow-hidden bg-gray-100 dark:bg-[#1C2333] items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),_0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
        >
          <img
            src={channel.logoUrl || "/images/companyonboarding/companyprofileDefault.jpg"}
            alt={channel.companyName || channel.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col items-start gap-4 md:gap-[8px] flex-1 min-w-0">
          
          <div className="flex flex-col items-start min-w-0 w-full gap-2 md:gap-0">
            {/* Mobile Header Row: Logo + Title/Company */}
            <div className="flex flex-row items-center gap-[8px] w-full">
              {/* Mobile Logo */}
              <div 
                onClick={handleOrgClick}
                title={channel.companyName ? `View ${channel.companyName} profile` : 'View organization profile'}
                className="md:hidden flex w-[48px] h-[48px] min-w-[48px] rounded-[12px] overflow-hidden bg-gray-100 dark:bg-[#1C2333] items-center justify-center flex-shrink-0 cursor-pointer"
              >
                <img
                  src={channel.logoUrl || "/images/companyonboarding/companyprofileDefault.jpg"}
                  alt={channel.companyName || channel.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col min-w-0 flex-1 justify-center gap-1 md:gap-0">
                <div className="flex flex-row items-center gap-[8px] h-[24px]">
                  <h2 className="text-black dark:text-[#FFFFFF] text-[16px] font-medium font-['Poppins'] leading-[24px] truncate">
                    {channel.name}
                  </h2>
                  <div className="hidden md:block w-[6px] h-[6px] bg-[#6B7280] rounded-full flex-shrink-0"></div>
                  <span className="hidden md:block text-[#6B7280] text-[12px] font-semibold font-['Poppins'] leading-[24px] whitespace-nowrap">
                    {channel.subscriberCount >= 1000 ? Math.floor(channel.subscriberCount / 1000) + 'k' : channel.subscriberCount} Subscriber
                  </span>
                </div>
                {channel.companyName && (
                  <span 
                    onClick={handleOrgClick}
                    className="text-black dark:text-[#D1D5DB] font-['Poppins'] font-medium text-[12px] leading-[18px] h-[18px] cursor-pointer hover:underline self-start truncate max-w-full"
                  >
                    {channel.companyName}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[12px] font-normal font-['Poppins'] leading-[18px] md:leading-[24px] w-full">
              {channel.description}
            </p>
          </div>
          
          <div className="flex flex-row items-center justify-between w-full md:justify-start md:mt-0">
            {/* Mobile Subscriber Count */}
            <span className="md:hidden text-black dark:text-[#FFFFFF] text-[14px] font-normal font-['Poppins'] leading-[21px]">
              Total subscriber - {channel.subscriberCount >= 1000 ? Math.floor(channel.subscriberCount / 1000) + 'k' : channel.subscriberCount}
            </span>

            {!channel.isOwner && (
              <button
                onClick={onToggleSubscribe}
                className={`flex flex-row justify-center items-center px-4 py-2 h-[40px] rounded-[24px] font-['Poppins'] font-normal text-[14px] md:text-[16px] leading-[20px] md:leading-[24px] transition-all active:scale-95 ${
                  channel.isSubscribed
                    ? 'w-[119px] md:w-[142px] bg-transparent border border-[#6366F1] dark:border-[#818CF8] text-[#6366F1] dark:text-[#818CF8] hover:bg-[#6366F1]/10'
                    : 'w-[119px] md:w-[113px] bg-[#6366F1] dark:bg-[#818CF8] text-white hover:opacity-90'
                }`}
              >
                {channel.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
