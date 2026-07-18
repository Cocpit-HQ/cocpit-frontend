'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface TeamHeaderProps {
  onCreateRole: () => void;
}

export default function TeamHeader({ onCreateRole }: TeamHeaderProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-[#EFF4FF] to-[#E5EDFF] dark:from-[#121B2B] dark:to-[#1A2435] p-6 flex items-center justify-between">
        <div className="flex flex-col gap-2 max-w-[60%]">
          <h1 className="text-black dark:text-white text-xl font-semibold font-['Poppins']">
            Manage team
          </h1>
          <p className="text-gray-500 dark:text-[#A1A8B3] text-xs font-['Poppins']">
            Add manage and manage your organization&apos;s team members.
          </p>
          <button
            onClick={onCreateRole}
            className="mt-1 w-fit px-5 py-2 rounded-full bg-[#1A73E8] dark:bg-[#4D9CFF] text-white text-xs font-semibold font-['Poppins'] transition-all active:scale-95 hover:opacity-90 shadow-sm"
          >
            Create role
          </button>
        </div>
        <div className="flex-shrink-0">
          <img
            src="/images/CHANNEL/ChannelArticle-.png"
            alt="Team illustration"
            className="w-[120px] h-[90px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}
