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

      <div className="relative w-full h-[140px] md:h-[160px] rounded-3xl overflow-hidden bg-gradient-to-r from-[#EFF4FF] to-[#E5EDFF] dark:from-[#121B2B] dark:to-[#1A2435] flex items-center justify-center">
        {channel.bannerUrl ? (
          <img src={channel.bannerUrl} alt={channel.name} className="w-full h-full object-cover" />
        ) : (
          <Icon icon="lucide:image" className="w-12 h-12 text-[#1A73E8] opacity-20" />
        )}
      </div>

      <div className="w-full flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="text-black dark:text-[#FFFFFF] text-lg font-semibold font-['Poppins'] break-words">
            {channel.name}
          </h2>
          <p className="text-gray-500 dark:text-[#A1A8B3] text-xs font-['Poppins'] break-words">
            {channel.description}
          </p>
        </div>
        <button
          onClick={onEdit}
          className="flex-shrink-0 p-2 rounded-full text-gray-400 hover:text-[#1A73E8] hover:bg-[#EFF4FF] dark:hover:bg-[#1A2435] transition-colors"
          title="Edit channel"
        >
          <Icon icon="proicons:pencil" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
