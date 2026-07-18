'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface TeamEmptyStateProps {
  onCreateRole: () => void;
}

export default function TeamEmptyState({ onCreateRole }: TeamEmptyStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full bg-[#EFF4FF] dark:bg-[#1A2435] flex items-center justify-center">
        <Icon
          icon="lucide:users"
          className="w-8 h-8 text-[#1A73E8] dark:text-[#4D9CFF] opacity-50"
        />
      </div>
      <div className="text-center">
        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium font-['Poppins']">
          manage team home page empty
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs font-['Poppins'] mt-1">
          Create roles and add team members to get started.
        </p>
      </div>
    </div>
  );
}
