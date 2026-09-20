"use client";

import React from 'react';
import { Icon } from '@/components/icons';
import Link from 'next/link';
import { NotificationPopover } from '@/features/notification/components/NotificationPopover';
import { FeatureGuard } from '@/components/feature-flags/FeatureGuard';
import { GlobalSearch } from './GlobalSearch';

import { ProfileDropdown } from '@/components/layout/ProfileDropdown';

interface TopHeaderProps {
  className?: string;
}

export function TopHeader({ className }: TopHeaderProps) {
  return (
    <header className={`w-full flex items-center justify-between pointer-events-none ${className || ''}`}>
      {/* Full-width top background bar to seamlessly occlude scrolling feed across the entire screen */}
      <div className="fixed top-0 left-0 md:left-[220px] right-0 h-[100px] bg-ds-bg z-40 pointer-events-none" />

      {/* Cocpit Logo (Bottom Right) */}
      <div className="fixed bottom-[40px] right-[40px] flex items-center h-[40px] pointer-events-auto z-50">
        <Link href="/feed">
          <Icon name="cocpit-logo" className="text-ds-text-primary hover:opacity-80 transition-opacity" width={110} height={32} />
        </Link>
      </div>

      {/* Center Search Column (View Port Perspective Center) */}
      <FeatureGuard featureKey="enableGlobalSearch" mode="silent">
        <GlobalSearch />
      </FeatureGuard>

      {/* Right Actions Section */}
      <div className="fixed top-[40px] right-[40px] flex items-center gap-[12px] h-[40px] pointer-events-auto z-50">
        {/* Notification Bell */}
        <FeatureGuard featureKey="enableNotificationsModule" mode="silent">
          <NotificationPopover 
            className="group relative w-[40px] h-[40px] p-[8px] flex flex-row items-center justify-center bg-transparent hover:bg-ds-surface-1 data-[state=open]:bg-ds-surface-1 rounded-[24px] transition-colors"
            icon={<Icon name="notification" className="w-[24px] h-[24px] flex-none order-0 grow-0 text-ds-text-primary group-hover:text-ds-accent group-data-[state=open]:text-ds-accent transition-colors" />}
          />
        </FeatureGuard>

        {/* User Avatar & Dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}

export default TopHeader;
