import React from 'react';

export const OfferCardSkeleton: React.FC = () => {
  return (
    <div className="relative w-full flex flex-col items-end animate-pulse">
      {/* Top Offer Box */}
      <div className="w-full rounded-2xl bg-ds-surface-1 border border-ds-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-36 h-5 bg-ds-surface-2 rounded" />
            <div className="w-20 h-4 bg-ds-surface-2 rounded-full" />
          </div>
          <div className="w-28 h-4 bg-ds-surface-2 rounded" />
          <div className="w-20 h-3 bg-ds-surface-2 rounded" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="w-24 h-9 bg-ds-surface-2 rounded-full" />
          <div className="w-24 h-9 bg-ds-surface-2 rounded-full" />
        </div>
      </div>

      {/* Recruiter Note Skeleton */}
      <div className="w-[calc(100%-40px)] bg-ds-surface-1 border-l-2 border-l-ds-accent/40 border-t border-r border-b border-ds-border rounded-r-2xl p-3.5 mt-2 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-ds-surface-2" />
          <div className="w-28 h-4 bg-ds-surface-2 rounded" />
        </div>
        <div className="w-full h-3.5 bg-ds-surface-2 rounded" />
      </div>
    </div>
  );
};

export default OfferCardSkeleton;
