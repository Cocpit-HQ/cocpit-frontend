import React from 'react';

export const ListingsSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[800px] flex flex-col gap-4 font-dm-sans animate-pulse">
      {/* Heading Frame Skeleton */}
      <div className="w-full flex flex-col gap-1 px-0">
        <div className="w-24 h-5 bg-ds-surface-2 rounded" />
        <div className="w-32 h-4 bg-ds-surface-2 rounded" />
      </div>

      {/* Filter Row Frame Skeleton */}
      <div className="w-full flex items-center gap-3 py-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="w-16 h-8 bg-ds-surface-2 rounded-full" />
        ))}
      </div>

      {/* Job Card List Skeleton */}
      <div className="w-full flex flex-col gap-3 mt-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="w-full py-4 border-b border-ds-border flex flex-col gap-3"
          >
            <div className="w-full flex justify-between items-center">
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="w-1/3 h-5 bg-ds-surface-2 rounded" />
                <div className="w-1/4 h-4 bg-ds-surface-2 rounded" />
              </div>
              <div className="w-16 h-4 bg-ds-surface-2 rounded-full" />
            </div>
            <div className="w-full flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="w-16 h-8 bg-ds-surface-2 rounded" />
                <div className="w-16 h-8 bg-ds-surface-2 rounded" />
                <div className="w-16 h-8 bg-ds-surface-2 rounded" />
              </div>
              <div className="w-28 h-9 bg-ds-surface-2 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingsSkeleton;
