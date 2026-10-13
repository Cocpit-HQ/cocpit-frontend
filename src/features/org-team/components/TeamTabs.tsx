'use client';

import React from 'react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/features/businessProfile';
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
    <div className="flex justify-start items-center gap-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        const buttonContent = (
          <button
            key={tab.key}
            onClick={() => {
              if (!tab.disabled) onTabChange(tab.key);
            }}
            disabled={tab.disabled}
            className={`relative flex justify-center px-3 pb-[8px] transition-colors ${tab.disabled
                ? 'opacity-50 cursor-not-allowed text-ds-text-muted'
                : isActive
                  ? 'text-ds-text-primary'
                  : 'text-ds-text-secondary hover:text-ds-text-primary'
              }`}
          >
            <span className="ds-text-body-1 block">
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute bottom-0 left-0 w-full h-0 border-t-[1.5px] border-ds-accent" />
            )}
          </button>
        );

        if (tab.disabled) {
          return (
            <TooltipProvider key={tab.key} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-not-allowed">{buttonContent}</div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-ds-surface-2 text-ds-text-primary border-ds-border ds-text-small">
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
