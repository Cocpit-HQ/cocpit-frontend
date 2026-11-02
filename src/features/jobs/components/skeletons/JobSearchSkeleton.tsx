import React from 'react';
import JobCardSkeleton from './JobCardSkeleton';

export const JobSearchSkeleton: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans flex flex-col items-center pb-20 select-none relative">
      {/* Header bar with centered search bar skeleton */}
      <header className="w-full px-4 sm:px-10 pt-6 sm:pt-10 flex items-center justify-center relative animate-pulse">
        <div className="w-full max-w-[384px] h-10 px-3 py-1.5 border-b border-ds-border flex items-center justify-between gap-2">
          <div className="w-48 h-5 bg-ds-surface-1 rounded" />
          <div className="size-4 bg-ds-surface-1 rounded-full" />
        </div>
      </header>

      {/* Filter chips skeleton bar */}
      <div className="w-full max-w-[1200px] px-4 sm:px-10 pt-6 flex items-center gap-3 overflow-hidden animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="h-9 w-24 bg-ds-surface-1 border border-ds-border rounded-[100px] shrink-0"
          />
        ))}
      </div>

      {/* Main search results skeleton */}
      <div className="w-full max-w-[800px] px-4 sm:px-0 pt-8 flex flex-col gap-5">
        <JobCardSkeleton />
        <JobCardSkeleton />
        <JobCardSkeleton />
      </div>
    </div>
  );
};

export default JobSearchSkeleton;

