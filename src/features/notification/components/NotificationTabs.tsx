import React from 'react';
import { NotificationTab } from '../types';
import { cn } from '@/lib/utils';

interface NotificationTabsProps {
  activeTab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
  onMarkAllAsRead: () => void;
  onClearAllClick: () => void;
  hasNotifications: boolean;
  hasUnread: boolean;
}

export const NotificationTabs: React.FC<NotificationTabsProps> = ({
  activeTab,
  onTabChange,
  onMarkAllAsRead,
  onClearAllClick,
  hasNotifications,
  hasUnread,
}) => {
  return (
    // TabsRow — 800px wide, 36px height, space-between
    <div className="flex flex-row items-center justify-between h-[36px] w-full">

      {/* Left: tabs — gap-3 (12px) */}
      <div className="flex flex-row items-center gap-3">

        {/* Tab: All */}
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={cn(
            "relative flex items-center px-3 py-[6px] ds-text-body-1 font-['DM_Sans'] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent",
            activeTab === 'all'
              ? 'text-ds-text-primary'
              : 'text-ds-text-secondary hover:text-ds-text-primary'
          )}
          aria-label="All notifications tab"
        >
          All
          {/* Active underline — full button width, accent, pinned to bottom */}
          {activeTab === 'all' && (
            <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-ds-accent" />
          )}
        </button>

        {/* Tab: Jobs */}
        {/*
        <button
          type="button"
          onClick={() => onTabChange('jobs')}
          className={cn(
            "relative flex items-center px-3 py-[6px] ds-text-body-1 font-['DM_Sans'] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent",
            activeTab === 'jobs'
              ? 'text-ds-text-primary'
              : 'text-ds-text-secondary hover:text-ds-text-primary'
          )}
          aria-label="Jobs notifications tab"
        >
          Jobs
          {activeTab === 'jobs' && (
            <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-ds-accent" />
          )}
        </button>
        */}
      </div>

      {/* Right: actions — only render what is relevant */}
      {(hasUnread || hasNotifications) && (
        <div className="flex flex-row items-center gap-3">

          {/* Mark all as read — only when there are unread items */}
          {hasUnread && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="ds-text-secondary font-['DM_Sans'] text-ds-accent hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded"
            >
              Mark all as read
            </button>
          )}

          {/* Separator — only when both buttons are visible */}
          {hasUnread && hasNotifications && (
            <span
              className="block w-px h-5 bg-ds-border flex-shrink-0"
              aria-hidden="true"
            />
          )}

          {/* Clear all — only when there are notifications */}
          {hasNotifications && (
            <button
              type="button"
              onClick={onClearAllClick}
              className="ds-text-secondary font-['DM_Sans'] text-ds-text-secondary hover:text-ds-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};
