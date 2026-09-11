'use client';

import React from 'react';

export function SuggestionCardSkeleton() {
  return (
    <div
      className="flex flex-col items-center gap-3 p-5 rounded-[16px] border border-ds-border bg-ds-surface-1/40 h-full min-h-[240px] animate-pulse"
      aria-hidden="true"
    >
      <div className="w-16 h-16 rounded-full bg-ds-surface-1 mt-2 border border-ds-border" />
      <div className="h-4 bg-ds-surface-1 rounded-full w-[120px] mt-1" />
      <div className="h-3 bg-ds-surface-1 rounded-full w-[150px]" />
      <div className="h-6 bg-ds-surface-1 rounded-full w-[110px] mt-1" />
      <div className="h-[36px] w-full rounded-full bg-ds-surface-1 mt-auto border border-ds-border" />
    </div>
  );
}
export default SuggestionCardSkeleton;
