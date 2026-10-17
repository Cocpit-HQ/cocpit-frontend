"use client";

import React from 'react';
import {
  CommentPollIcon,
  CommentArticleIcon,
  CommentMediaIcon,
  ReportProfileIcon,
  InfoIcon,
} from '@/components/icons';
import { ReportListItem } from '@/features/settings/api/reports';

interface YourReportsTabProps {
  reports: ReportListItem[];
  onSelectReport: (id: number) => void;
}

export function YourReportsEmptyState() {
  return (
    <div className="w-full max-w-[680px] px-5 py-16 flex flex-col justify-center items-center gap-4 mx-auto select-none">
      <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
        <InfoIcon size={32} className="size-8 text-ds-text-secondary shrink-0" fill="currentColor" />
      </div>
      <div className="self-stretch flex flex-col justify-start items-center gap-1.5 text-center">
        <h3 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6 m-0">
          No account activity
        </h3>
        <p className="max-w-[320px] text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 m-0">
          Account activity and status changes will appear here.
        </p>
      </div>
    </div>
  );
}

function renderReportThumbnail(item: ReportListItem) {
  const postType = (item.postType || item.mediaType || '').toLowerCase();
  const targetType = (item.targetType || item.type || '').toUpperCase();
  const combined = `${item.targetType || ''} ${item.type || ''} ${item.title || ''} ${item.reason || ''} ${item.postType || ''}`.toLowerCase();

  // 1. Profile / User / Company
  if (
    targetType === 'USER' ||
    targetType === 'PROFILE' ||
    targetType === 'COMPANY' ||
    combined.includes('profile') ||
    combined.includes('fake account') ||
    combined.includes('impersonat')
  ) {
    return (
      <div className="w-[76px] h-[76px] bg-ds-surface-1 rounded-xl flex items-center justify-center shrink-0">
        <ReportProfileIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
      </div>
    );
  }

  // 2. Poll
  if (postType === 'poll' || combined.includes('poll')) {
    return (
      <div className="w-[76px] h-[76px] bg-ds-surface-1 rounded-xl flex items-center justify-center shrink-0">
        <CommentPollIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
      </div>
    );
  }

  // 3. Article
  if (postType === 'article' || combined.includes('article')) {
    return (
      <div className="w-[76px] h-[76px] bg-ds-surface-1 rounded-xl flex items-center justify-center shrink-0">
        <CommentArticleIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
      </div>
    );
  }

  // 4. Video, image, and all other reported content -> show image icon (no thumbnail)
  return (
    <div className="w-[76px] h-[76px] bg-ds-surface-1 rounded-xl flex items-center justify-center shrink-0">
      <CommentMediaIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Recently';
  if (/^[A-Za-z]{3}\s\d{1,2},\s\d{4}/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {}
  return dateStr;
}

export function YourReportsTab({ reports, onSelectReport }: YourReportsTabProps) {
  if (!reports || reports.length === 0) {
    return <YourReportsEmptyState />;
  }

  return (
    <div className="w-full flex flex-col justify-start items-start gap-4">
      {reports.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelectReport(item.id)}
          className="w-full pb-4 border-b border-ds-border last:border-b-0 last:pb-0 flex justify-start items-center gap-4 cursor-pointer group"
        >
          {/* Left 76x76 icon / media box */}
          {renderReportThumbnail(item)}

          {/* Right Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-center items-start gap-1.5">
            {/* Date & Category Tag */}
            <div className="w-full flex justify-start items-center gap-2 min-w-0">
              <span className="text-ds-text-secondary ds-text-secondary shrink-0">
                {formatDate(item.date)}
              </span>
              <span className="size-1 bg-ds-text-secondary rounded-full shrink-0" />
              <span className="text-ds-accent ds-text-small-1 truncate">
                {item.reason || item.type || 'Report'}
              </span>
            </div>

            {/* Title / Target */}
            <div className="w-full text-ds-text-primary ds-text-secondary-1 line-clamp-2 break-words leading-5">
              {item.title || (item.reportedUsername ? `Report about content posted by @${item.reportedUsername.replace(/^@/, '')}` : 'Report about content')}
            </div>

            {/* Status */}
            <div className="w-full text-ds-text-secondary ds-text-small truncate">
              {item.statusLabel || item.status || 'Submitted'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default YourReportsTab;
