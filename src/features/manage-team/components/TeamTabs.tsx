'use client';

import React from 'react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/companyprofile/hooks/useCompanyPermissions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamTabsProps {
  activeTab: 'team' | 'activity';
  onTabChange: (tab: 'team' | 'activity') => void;
}

export default function TeamTabs({ activeTab, onTabChange }: TeamTabsProps) {
  const { activeProfile } = useActiveProfile();
  const perms = useCompanyPermissions(activeProfile);
  const hasActivityPermission = perms.checkPermission('ACTIVITY_LOGS');

  const tabs = [
    { key: 'team' as const, label: 'Roles', disabled: false },
    { key: 'activity' as const, label: 'Activity logs', disabled: !hasActivityPermission },
  ];

  return (
    <div className="inline-flex justify-start items-start gap-4 mb-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        const buttonContent = (
          <button
            key={tab.key}
            onClick={() => {
              if (!tab.disabled) {
                onTabChange(tab.key);
              }
            }}
            disabled={tab.disabled}
            className={`h-10 rounded-[24px] flex justify-center items-center overflow-hidden transition-all ${tab.disabled
                ? "opacity-50 !cursor-default bg-company-bg border border-[#9CA3AF]"
                : isActive
                  ? "bg-company-light-primary border border-transparent"
                  : "bg-company-bg border border-company-primary hover:bg-company-light-primary/50"
              }`}
          >
            <div className="h-8 px-4 py-[6px] flex justify-center items-center gap-2">
              <span className={`text-center text-xs font-['Poppins'] leading-5 ${tab.disabled
                  ? "text-[#9CA3AF] font-normal"
                  : isActive
                    ? "text-company-primary font-medium"
                    : "text-company-primary font-normal"
                }`}>
                {tab.label}
              </span>
            </div>
          </button>
        );

        if (tab.disabled) {
          return (
            <TooltipProvider key={tab.key} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="!cursor-default">
                    {buttonContent}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-800 text-white border-gray-700">
                  <p>You don't have permission to access this</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return buttonContent;
      })}
    </div>
  );
}
