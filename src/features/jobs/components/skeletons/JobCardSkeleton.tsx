import React from 'react';

export const JobCardSkeleton: React.FC = () => {
  return (
    <div className="self-stretch p-4 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-center items-start gap-3 animate-pulse">
      {/* Top Row: Job Info and Badge */}
      <div className="self-stretch flex flex-row justify-between items-start gap-4">
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
          {/* Job Title */}
          <div className="w-1/2 h-5 bg-slate-200 rounded" />
          {/* Company */}
          <div className="w-1/3 h-4 bg-slate-200 rounded" />
          {/* Job Type */}
          <div className="w-20 h-4 bg-slate-200 rounded" />
        </div>
        {/* Match Badge */}
        <div className="w-16 h-5 bg-slate-200 rounded-full flex-shrink-0" />
      </div>

      {/* Middle Row: Meta and Salary */}
      <div className="self-stretch flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mt-1">
        <div className="flex flex-wrap justify-start items-center gap-2">
          {/* Experience Icon + Text */}
          <div className="flex justify-start items-center gap-2">
            <div className="w-5 h-5 bg-slate-200 rounded-full" />
            <div className="w-14 h-4 bg-slate-200 rounded" />
          </div>
          <div className="size-1.5 bg-slate-200 rounded-full" />
          {/* Location Icon + Text */}
          <div className="flex justify-start items-center gap-2">
            <div className="w-5 h-5 bg-slate-200 rounded-full" />
            <div className="w-24 h-4 bg-slate-200 rounded" />
          </div>
        </div>
        {/* Salary */}
        <div className="w-24 h-4 bg-slate-200 rounded" />
      </div>

      {/* Bottom Row: Posted date and actions */}
      <div className="self-stretch flex flex-row justify-between items-center mt-1">
        {/* Posted Date */}
        <div className="w-20 h-3 bg-slate-100 rounded" />
        {/* Actions (Apply + Bookmark) */}
        <div className="w-auto h-10 flex flex-row items-center gap-4 justify-end">
          {/* Apply Button */}
          <div className="w-[100px] sm:w-[120px] h-10 bg-slate-200 rounded-full" />
          {/* Bookmark Button */}
          <div className="w-6 h-6 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default JobCardSkeleton;
