'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="w-full flex items-center gap-3 py-3">
      {/* Actor avatar */}
      <img
        src={entry.actorAvatarUrl || '/assets/pngegg.png'}
        alt={entry.actorName}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/assets/pngegg.png';
        }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300 font-['Poppins']">
          <span className="font-medium text-gray-900 dark:text-white">
            {entry.actorName}
          </span>{' '}
          {entry.action}{' '}
          {entry.targetName && (
            <span
              onClick={handleLinkClick}
              className={`font-medium ${entry.linkUrl ? 'text-[#1A73E8] dark:text-[#4D9CFF] cursor-pointer hover:underline' : 'text-gray-900 dark:text-white'}`}
            >
              {entry.targetName}
            </span>
          )}{' '}
          {entry.highlightedText && (
            <span
              onClick={handleLinkClick}
              className={`text-[#1A73E8] dark:text-[#4D9CFF] ${entry.linkUrl ? 'cursor-pointer hover:underline' : ''}`}
            >
              {entry.highlightedText}
            </span>
          )}
        </p>
      </div>

      {/* Timestamp */}
      <span className="text-xs text-gray-400 dark:text-gray-500 font-['Poppins'] flex-shrink-0">
        {timeAgo}
      </span>
    </div>
  );
}

// Memoized: activity log lists can run long, and rows shouldn't re-render just
// because a sibling filter or an unrelated parent state (e.g. a modal) changed.
export default React.memo(ActivityLogRow);

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
