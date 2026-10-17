import React from 'react';

export const ListingsSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[998px] h-auto min-h-[500px] bg-white rounded-[24px] p-[16px] flex flex-col items-start gap-[16px] box-border animate-pulse">
      {/* Heading Frame Skeleton */}
      <div className="w-full flex flex-col gap-[8px] px-0">
        <div className="w-24 h-5 bg-slate-200 rounded" />
        <div className="w-32 h-4 bg-slate-100 rounded" />
      </div>

      {/* Filter Row Frame Skeleton */}
      <div className="w-full flex flex-row items-center gap-[8px] border-b border-transparent py-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="w-16 h-8 bg-slate-200 rounded-3xl" />
        ))}
      </div>

      {/* Job Card List Skeleton */}
      <div className="w-full flex-1 flex flex-col gap-[16px] mt-2">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="w-full flex flex-row items-center justify-between py-[16px] px-0 gap-[16px] bg-white h-[80px] border-b border-[#EEF2FF]/60 last:border-b-0"
          >
            {/* Text Frame Skeleton */}
            <div className="flex flex-col items-start gap-[8px] h-[48px] flex-1">
              <div className="w-1/2 h-5 bg-slate-200 rounded" />
              <div className="w-1/3 h-4 bg-slate-100 rounded" />
            </div>

            {/* Status Badge Skeleton */}
            <div className="w-[70px] h-[31px] bg-slate-200 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingsSkeleton;
