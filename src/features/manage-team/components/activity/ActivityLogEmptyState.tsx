'use client';

import React from 'react';
import { Icon } from '@iconify/react';

export default function ActivityLogEmptyState() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-14 gap-3">
      <div className="w-14 h-14 rounded-full bg-[#EFF4FF] dark:bg-[#1A2435] flex items-center justify-center">
        <Icon
          icon="lucide:file-text"
          className="w-7 h-7 text-[#1A73E8] dark:text-[#4D9CFF] opacity-40"
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-['Poppins']">
          No activity logs to show
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-['Poppins'] mt-0.5">
          Activity logs will appear here once team actions are performed.
        </p>
      </div>
    </div>
  );
}
