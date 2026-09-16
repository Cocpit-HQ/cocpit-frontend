"use client";

import React from 'react';
import { Icon } from '@/components/icons';
import Link from 'next/link';
import { NotificationPopover } from '@/features/notification/components/NotificationPopover';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { GlobalSearch } from './GlobalSearch';

interface TopHeaderProps {
  className?: string;
}

export function TopHeader({ className }: TopHeaderProps) {
  const { activeProfile } = useActiveProfile();

  const profileHref = activeProfile?.type === 'COMPANY' && activeProfile.slug
    ? `/organization/${activeProfile.slug}`
    : '/profile';

  const avatarUrl = activeProfile?.avatar_url;
  const initial = activeProfile?.name ? activeProfile.name.charAt(0).toUpperCase() : 'U';

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
      <GlobalSearch />

      {/* Right Actions Section */}
      <div className="fixed top-[40px] right-[40px] flex items-center gap-[12px] h-[40px] pointer-events-auto z-50">
        {/* Notification Bell */}
        <NotificationPopover 
          className="group relative w-[40px] h-[40px] p-[8px] flex flex-row items-center justify-center bg-transparent hover:bg-ds-surface-1 data-[state=open]:bg-ds-surface-1 rounded-[24px] transition-colors"
          icon={<Icon name="notification" className="w-[20px] h-[20px] text-ds-text-primary group-hover:text-ds-accent group-data-[state=open]:text-ds-accent transition-colors" />}
        />

        {/* User Avatar */}
        <Link href={profileHref} className="cursor-pointer block">
          <div className="w-[24px] h-[24px] rounded-full overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center bg-ds-surface-1 border border-ds-border text-ds-text-primary cursor-pointer">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Icon name="user" className="w-full h-full p-1 text-ds-text-primary" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}

export default TopHeader;
