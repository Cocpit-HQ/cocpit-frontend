import React from 'react';

export const RecommendedJobCardSkeleton: React.FC = () => {
  return (
    <div className="w-64 sm:w-[300px] h-[192px] p-3 bg-ds-bg border border-ds-border rounded-2xl flex flex-col justify-between shrink-0 animate-pulse">
      <div className="w-full h-10 flex justify-between items-center">
        <div className="size-10 rounded-lg bg-ds-surface-1 border border-ds-border/40" />
        {/* Top % badge skeleton temporarily commented out */}
        {/* <div className="w-12 h-5 bg-ds-surface-1 rounded-full" /> */}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="w-36 h-5 bg-ds-surface-1 rounded" />
        <div className="w-24 h-4 bg-ds-surface-1 rounded" />
        <div className="w-28 h-4 bg-ds-surface-1 rounded" />
      </div>

      <div className="w-full h-6 flex justify-between items-end">
        <div className="w-20 h-5 bg-ds-surface-1 rounded" />
        <div className="w-14 h-4 bg-ds-surface-1 rounded" />
      </div>
    </div>
  );
};

export default RecommendedJobCardSkeleton;
