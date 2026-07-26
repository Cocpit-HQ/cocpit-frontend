import React from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { Channel } from '../types/channel.types';

interface ChannelHeaderProps {
  channel: Channel;
  onEdit: () => void;
  onInvite: () => void;
}

export default function ChannelHeader({ channel, onEdit, onInvite }: ChannelHeaderProps) {
  const router = useRouter();

  const handleOrgClick = () => {
    const targetSlugOrId = channel.companySlug || channel.orgId;
    if (targetSlugOrId) {
      router.push(`/organization/${targetSlugOrId}`);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => router.push('/channel/write')}
          className="px-6 py-2.5 rounded-full bg-[#1A73E8] dark:bg-[#4D9CFF] text-white text-sm font-semibold font-['Poppins'] transition-all active:scale-95 hover:opacity-90 shadow-sm"
        >
          Write article
        </button>
        <button
          onClick={onInvite}
          className="flex items-center gap-1.5 text-[#1A73E8] dark:text-[#4D9CFF] text-sm font-semibold font-['Poppins'] hover:underline"
        >
          <Icon icon="lucide:plus" className="w-4 h-4" />
          Invite people
        </button>
      </div>

      <div className="relative w-full aspect-[6/1] rounded-3xl overflow-hidden bg-gradient-to-r from-[#EFF4FF] to-[#E5EDFF] dark:from-[#121B2B] dark:to-[#1A2435] flex items-center justify-center">
        {channel.bannerUrl ? (
          <img src={channel.bannerUrl} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <Icon icon="lucide:image" className="w-12 h-12 text-[#1A73E8] opacity-20" />
        )}
      </div>

      <div className="w-full flex items-start justify-between gap-4">
        <div className="flex items-start gap-[8px] min-w-0">
          <div 
            onClick={handleOrgClick}
            title={channel.companyName ? `View ${channel.companyName} profile` : 'View organization profile'}
            className="w-[66px] h-[66px] min-w-[66px] rounded-[12px] overflow-hidden bg-gray-100 dark:bg-[#1C2333] border border-gray-200 dark:border-[#2A2D35] flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <img
              src={channel.logoUrl || "/images/companyonboarding/companyprofileDefault.jpg"}
              alt={channel.companyName || channel.name}
              className="w-full h-full object-cover rounded-[12px]"
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex flex-col">
              <h2 className="text-black dark:text-[#FFFFFF] text-lg font-semibold font-['Poppins'] break-words">
                {channel.name}
              </h2>
              {channel.companyName && (
                <span 
                  onClick={handleOrgClick}
                  className="text-[#000000] dark:text-[#D1D5DB] font-['Poppins'] font-medium text-[12px] leading-[100%] tracking-[0px] align-middle mt-[4px] cursor-pointer hover:underline self-start"
                >
                  {channel.companyName}
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-[#A1A8B3] text-xs font-['Poppins'] break-words mt-1">
              {channel.description}
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex-shrink-0 text-black dark:text-[#FFFFFF] hover:text-[#1A73E8] dark:hover:text-[#4D9CFF] transition-colors"
          title="Edit channel"
        >
          <Icon icon="fluent:edit-24-regular" className="w-[24px] h-[24px]" />
        </button>
      </div>
    </div>
  );
}
