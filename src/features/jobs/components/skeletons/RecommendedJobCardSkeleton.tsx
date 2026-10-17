import React from 'react';

export const RecommendedJobCardSkeleton: React.FC = () => {
  return (
    <div className="w-[309.33px] h-56 p-4 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex flex-col justify-start items-start gap-2 flex-shrink-0 animate-pulse">
      {/* Title, Company, Location & Badge row */}
      <div className="self-stretch inline-flex justify-between items-start">
        <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
          {/* Title */}
          <div className="w-3/4 h-4 bg-slate-200 rounded" />
          {/* Company */}
          <div className="w-1/2 h-3.5 bg-slate-200 rounded mt-1" />
          {/* Location */}
          <div className="w-2/3 h-3.5 bg-slate-200 rounded mt-1" />
        </div>
        {/* Recommended Badge */}
        <div className="w-14 h-5 bg-slate-200 rounded-full" />
      </div>

      {/* Salary display */}
      <div className="self-stretch flex flex-col justify-start items-start mt-1">
        <div className="w-24 h-4 bg-slate-200 rounded" />
      </div>

      {/* Response rate and Avg. reply stats grid */}
      <div className="self-stretch pt-3 border-t border-slate-200/50 inline-flex flex-row justify-between items-start mt-2">
        <div className="inline-flex flex-col justify-start items-start gap-1">
          <div className="w-14 h-2 bg-slate-100 rounded" />
          <div className="w-10 h-3.5 bg-slate-200 rounded" />
        </div>
        <div className="inline-flex flex-col justify-start items-start gap-1">
          <div className="w-14 h-2 bg-slate-100 rounded" />
          <div className="w-8 h-3.5 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Match Reason Banner */}
      <div className="self-stretch pt-2 flex flex-col justify-start items-start">
        <div className="self-stretch p-2 bg-slate-50 rounded-xl inline-flex justify-start items-center gap-2">
          {/* AI Icon placeholder */}
          <div className="w-5 h-5 bg-slate-200 rounded-full flex-shrink-0" />
          {/* Match reasoning text */}
          <div className="flex-grow h-3 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  );
};

export default RecommendedJobCardSkeleton;
