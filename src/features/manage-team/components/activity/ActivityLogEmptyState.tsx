'use client';

import React from 'react';
import { Icon } from '@iconify/react';

export default function ActivityLogEmptyState() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 gap-2">
      <div className="text-center flex flex-col gap-1">
        <p className="text-[16px] font-semibold text-[#000000] dark:text-white font-['Poppins']">
          No activity logs to show
        </p>
        <p className="text-[13px] text-[#A3AED0] dark:text-gray-400 font-['Poppins']">
          Activity logs will appear after you create a role and add members to it
        </p>
      </div>
    </div>
  );
}
