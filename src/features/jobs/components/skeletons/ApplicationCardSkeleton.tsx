import React from 'react';

export const ApplicationCardSkeleton: React.FC = () => {
  return (
    <>
      {/* Mobile Application Card Skeleton */}
      <div className="w-full flex sm:hidden flex-col gap-2 py-3 animate-pulse font-dm-sans">
        <div className="w-16 h-4 bg-ds-surface-2 rounded" />
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="w-3/4 h-5 bg-ds-surface-2 rounded" />
            <div className="w-1/2 h-4 bg-ds-surface-2 rounded" />
            <div className="w-1/3 h-4 bg-ds-surface-2 rounded" />
          </div>
          <div className="w-[98px] h-9 bg-ds-surface-2 rounded-full shrink-0" />
        </div>
      </div>

      {/* Desktop Application Card Skeleton (800px max, 84px height, 24px radius, 4 sections) */}
      <div className="w-full max-w-[800px] sm:h-[84px] p-4 rounded-[24px] hidden sm:flex sm:flex-row sm:items-center justify-between gap-3 self-stretch animate-pulse font-dm-sans">
        {/* Section 1: Job Details (w-[230px], h-[52px]) */}
        <div className="w-full sm:w-[230px] sm:h-[52px] flex flex-col items-start justify-center gap-2 shrink-0 min-w-0">
          <div className="w-3/4 h-5 bg-ds-surface-2 rounded" />
          <div className="w-1/2 h-4 bg-ds-surface-2 rounded" />
        </div>

        {/* Section 2: Application Date (w-[180px], h-[52px]) */}
        <div className="w-full sm:w-[180px] sm:h-[52px] flex flex-row items-center justify-start shrink-0 min-w-0">
          <div className="w-32 h-4 bg-ds-surface-2 rounded" />
        </div>

        {/* Section 3: Application Status (w-[130px], h-[52px]) */}
        <div className="w-full sm:w-[130px] sm:h-[52px] flex flex-row items-center justify-start shrink-0 min-w-0">
          <div className="w-20 h-4 bg-ds-surface-2 rounded" />
        </div>

        {/* Section 4: Action Button (w-[99px], h-9, rounded-[100px]) */}
        <div className="w-full sm:w-[99px] sm:h-9 flex items-center justify-start sm:justify-center shrink-0">
          <div className="w-[99px] h-9 bg-ds-surface-2 rounded-[100px]" />
        </div>
      </div>
    </>
  );
};

export default ApplicationCardSkeleton;
