import React from 'react';

export const JobCardSkeleton: React.FC = () => {
  return (
    <div className="w-full p-4 bg-ds-surface-1 border border-ds-border rounded-2xl flex flex-col gap-3 animate-pulse">
      <div className="w-full flex justify-between items-start gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <div className="w-1/2 h-5 bg-ds-surface-2 rounded-md" />
          <div className="w-1/3 h-4 bg-ds-surface-2 rounded-md" />
          <div className="w-20 h-4 bg-ds-surface-2 rounded-md" />
        </div>
        <div className="w-16 h-5 bg-ds-surface-2 rounded-full shrink-0" />
      </div>

      <div className="w-full flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mt-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-20 h-4 bg-ds-surface-2 rounded" />
          <div className="size-1 bg-ds-border rounded-full" />
          <div className="w-24 h-4 bg-ds-surface-2 rounded" />
        </div>
        <div className="w-24 h-4 bg-ds-surface-2 rounded" />
      </div>

      <div className="w-full flex justify-between items-center mt-1">
        <div className="w-20 h-3 bg-ds-surface-2 rounded" />
        <div className="flex items-center gap-3">
          <div className="w-24 h-8 bg-ds-surface-2 rounded-full" />
          <div className="size-8 bg-ds-surface-2 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default JobCardSkeleton;
