'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { ActivityLogEntry } from '../../types/team.types';

interface ActivityLogRowProps {
  entry: ActivityLogEntry;
}

function ActivityLogRow({ entry }: ActivityLogRowProps) {
  const router = useRouter();
  const timeAgo = getTimeAgo(entry.timestamp);

  const handleLinkClick = () => {
    if (entry.linkUrl) {
      router.push(entry.linkUrl);
    }
  };

  return (
    <div className="w-full flex items-center gap-2 md:gap-3 py-2 md:py-3 min-h-[48px]">
      {/* Actor avatar */}
      <div className="relative w-8 h-8 rounded-full bg-ds-surface-1 text-ds-text-primary flex items-center justify-center ds-text-small-2 flex-shrink-0 overflow-hidden select-none">
        <Icon name="user" className="w-[18px] h-[18px] text-ds-text-primary" />
        {entry.actorAvatarUrl && entry.actorAvatarUrl !== '/assets/pngegg.png' ? (
          <img
            src={entry.actorAvatarUrl}
            alt={entry.actorName}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-['DM_Sans',sans-serif] font-normal text-[14px] leading-[20px] text-ds-text-primary">
          <span>{entry.actorName}</span>
          {' '}{entry.action}
          {entry.targetName ? (
            <>
              {' '}
              <span
                onClick={handleLinkClick}
                className={`${entry.linkUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              >
                {entry.targetName}
              </span>
            </>
          ) : null}
          {entry.highlightedText ? (
            <>
              {' '}
              <span
                onClick={handleLinkClick}
                className={`text-ds-accent ${entry.linkUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              >
                {entry.highlightedText}
              </span>
            </>
          ) : null}
        </p>
      </div>

      {/* Timestamp */}
      <span className="font-['DM_Sans',sans-serif] font-medium text-[14px] leading-[20px] text-ds-text-muted flex-shrink-0">
        <span className="md:hidden">{getCompactTimeAgo(entry.timestamp)}</span>
        <span className="hidden md:inline">{getTimeAgo(entry.timestamp)}</span>
      </span>
    </div>
  );
}

// Memoized: activity log lists can run long, and rows shouldn't re-render just
// because a sibling filter or an unrelated parent state (e.g. a modal) changed.
export default React.memo(ActivityLogRow);

function getCompactTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${diffDays}d`;
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
