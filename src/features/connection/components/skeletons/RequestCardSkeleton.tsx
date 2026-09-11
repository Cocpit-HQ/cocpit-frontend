'use client';

import React from 'react';

export function RequestCardSkeleton() {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-2 sm:px-4 border-b border-ds-border last:border-b-0 gap-3 sm:gap-4 animate-pulse font-dm-sans"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-ds-surface-1 border border-ds-border shrink-0" />
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="h-4 bg-ds-surface-1 rounded-full w-[140px]" />
          <div className="h-3 bg-ds-surface-1 rounded-full w-[180px]" />
          <div className="h-5 bg-ds-surface-1 rounded-full w-[120px] mt-1" />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0 justify-end">
        <div className="h-[36px] w-[90px] rounded-full bg-ds-surface-1 border border-ds-border" />
        <div className="h-[36px] w-[90px] rounded-full bg-ds-surface-1 border border-ds-border" />
      </div>
    </div>
  );
}
export default RequestCardSkeleton;
