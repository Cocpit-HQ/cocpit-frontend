'use client';

import React from 'react';

interface TeamTabsProps {
  activeTab: 'team' | 'activity';
  onTabChange: (tab: 'team' | 'activity') => void;
}

export default function TeamTabs({ activeTab, onTabChange }: TeamTabsProps) {
  const tabs = [
    { key: 'team' as const, label: 'Team' },
    { key: 'activity' as const, label: 'Activity log' },
  ];

  return (
    <div className="w-full flex gap-0 border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium font-['Poppins'] transition-colors relative ${
            activeTab === tab.key
              ? 'text-[#1A73E8] dark:text-[#4D9CFF]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {tab.label}
          {activeTab === tab.key && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A73E8] dark:bg-[#4D9CFF] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
