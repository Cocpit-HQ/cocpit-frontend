'use client';

import React from 'react';

export function SuggestionCardSkeleton() {
  return (
    /* Skeleton matching suggestion card dimensions 182x216px and #030303 background */
    <div
      className="flex flex-col items-center gap-2 p-3 rounded-[16px] border border-ds-border bg-[#030303] w-[182px] h-[216px] animate-pulse"
      aria-hidden="true"
    >
      <div className="w-[60px] h-[60px] rounded-full bg-ds-surface-1 mt-1 border border-ds-border" />
      <div className="h-4 bg-ds-surface-1 rounded-full w-[100px] mt-1" />
      <div className="h-3 bg-ds-surface-1 rounded-full w-[120px]" />
      <div className="h-6 bg-ds-surface-1 rounded-full w-[90px] mt-1" />
      <div className="h-[36px] w-[89px] rounded-full bg-ds-surface-1 mt-auto border border-ds-border" />
    </div>
  );
}
export default SuggestionCardSkeleton;
