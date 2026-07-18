'use client';

import React from 'react';

interface TeamTabsProps {
  activeTab: 'team' | 'activity';
  onTabChange: (tab: 'team' | 'activity') => void;
}

export default function TeamTabs({ activeTab, onTabChange }: TeamTabsProps) {
  const tabs = [
    { key: 'team' as const, label: 'Roles' },
    { key: 'activity' as const, label: 'Activity logs' },
  ];

  return (
    <div className="inline-flex justify-start items-start gap-4 mb-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`h-10 rounded-[24px] flex justify-center items-center overflow-hidden transition-all ${
              isActive 
                ? "bg-[#E8F1FF] dark:bg-[#1A2435] border border-transparent" 
                : "bg-[#FFFFFF] dark:bg-transparent border border-[#1A73E8] hover:bg-[#E8F1FF]/50 dark:hover:bg-[#1A2435]/50"
            }`}
          >
            <div className="h-8 px-4 py-[6px] flex justify-center items-center gap-2">
              <span className={`text-center text-xs font-['Poppins'] leading-5 ${isActive ? "text-[#1A73E8] font-medium" : "text-[#1A73E8] font-normal"}`}>
                {tab.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
