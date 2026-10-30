import React from 'react';

export const JobDetailSkeleton: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans py-4 md:py-6 px-4 animate-pulse">
      <div className="w-full max-w-[800px] mx-auto flex flex-col gap-5 pb-16">

        {/* Top Header Row Skeleton */}
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 md:size-10 rounded-full border border-ds-border bg-ds-surface-1" />
            <div className="flex flex-col gap-1.5">
              <div className="w-28 h-4 bg-ds-surface-2 rounded-md" />
              <div className="w-48 h-3 bg-ds-surface-1 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-full border border-ds-border bg-ds-surface-1" />
            <div className="size-9 rounded-full border border-ds-border bg-ds-surface-1" />
          </div>
        </div>

        {/* Hero Card Skeleton */}
        <div className="w-full bg-ds-surface-1 border border-ds-border rounded-2xl p-4 md:p-6 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="size-14 md:size-16 rounded-2xl border border-ds-border bg-ds-surface-2" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="w-3/5 h-6 bg-ds-surface-2 rounded-md" />
                <div className="w-16 h-6 bg-ds-surface-2 rounded-full" />
              </div>
              <div className="w-2/5 h-4 bg-ds-surface-2 rounded-md" />
            </div>
          </div>
        </div>

        {/* Specifications Grid Skeleton */}
        <div className="w-full bg-ds-surface-1 border border-ds-border rounded-2xl p-4 md:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="w-16 h-3 bg-ds-surface-2 rounded" />
              <div className="w-24 h-5 bg-ds-surface-2 rounded" />
            </div>
          ))}
        </div>

        {/* AI Banner Skeleton */}
        <div className="w-full h-12 bg-ds-surface-1 border border-ds-border rounded-xl" />

        {/* Description Skeleton */}
        <div className="w-full bg-ds-surface-1 border border-ds-border rounded-2xl p-4 md:p-5 flex flex-col gap-3">
          <div className="w-24 h-4 bg-ds-surface-2 rounded" />
          <div className="flex flex-col gap-2">
            <div className="w-full h-3.5 bg-ds-surface-2 rounded" />
            <div className="w-11/12 h-3.5 bg-ds-surface-2 rounded" />
            <div className="w-10/12 h-3.5 bg-ds-surface-2 rounded" />
            <div className="w-4/5 h-3.5 bg-ds-surface-2 rounded" />
          </div>
        </div>

        {/* Map Skeleton */}
        <div className="w-full bg-ds-surface-1 border border-ds-border rounded-2xl p-4 md:p-5 flex flex-col gap-3">
          <div className="w-28 h-4 bg-ds-surface-2 rounded" />
          <div className="w-full h-56 bg-ds-surface-2 rounded-xl" />
        </div>

      </div>

      {/* Floating Bottom Bar Skeleton */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="max-w-[800px] w-full mx-auto p-3 md:p-4 bg-ds-surface-1 border border-ds-border rounded-2xl flex items-center justify-between gap-4">
          <div className="w-40 h-5 bg-ds-surface-2 rounded" />
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-ds-surface-2" />
            <div className="size-9 rounded-full bg-ds-surface-2" />
            <div className="w-28 h-9 rounded-full bg-ds-surface-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailSkeleton;
