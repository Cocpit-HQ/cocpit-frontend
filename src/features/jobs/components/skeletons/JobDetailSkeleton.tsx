import React from 'react';

export const JobDetailSkeleton: React.FC = () => {
  return (
    <div className="relative w-full bg-white flex justify-center animate-pulse px-4 md:px-0">
      <div className="flex flex-col items-center py-0 gap-6 relative w-full max-w-[998px] bg-white pb-8">
        
        {/* Header chevron and Title block */}
        <div className="w-full min-h-[48px] self-stretch flex flex-row items-start p-0 gap-[16px] mt-6">
          <div className="w-12 h-12 rounded-[100px] border border-[#DADADA] bg-slate-100 flex-shrink-0" />
          <div className="flex flex-col items-start p-0 gap-1.5 flex-1">
            <div className="w-32 h-5 bg-slate-200 rounded" />
            <div className="w-64 h-4 bg-slate-150 rounded" />
          </div>
        </div>

        {/* Content body wrapper */}
        <div className="self-stretch p-0 md:p-4 flex flex-col justify-start items-start gap-6 w-full">
          
          {/* Active indicator and Job title card */}
          <div className="w-full h-auto self-stretch flex flex-col justify-center items-start p-0 gap-4">
            <div className="w-full flex flex-row justify-between items-center">
              {/* Active status badge */}
              <div className="w-[74px] h-8 bg-slate-200 rounded-[24px]" />
              {/* Offer deadline timer */}
              <div className="w-32 h-6 bg-slate-100 rounded" />
            </div>
            {/* Title */}
            <div className="w-2/3 h-10 bg-slate-200 rounded mt-1" />
            {/* Posted by info */}
            <div className="w-full h-8 self-stretch flex flex-row items-center p-0 gap-2 mt-1">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="w-14 h-4 bg-slate-100 rounded" />
              <div className="w-24 h-4 bg-slate-200 rounded" />
            </div>
          </div>

          {/* Job Specifications card */}
          <div className="w-full self-stretch p-4 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col sm:flex-row flex-wrap gap-4 h-auto">
            {/* Experience Column */}
            <div className="flex-grow flex-shrink-0 flex flex-col justify-center items-start p-0 gap-2 min-w-[120px] h-auto">
              <div className="w-24 h-4 bg-slate-200 rounded" />
              <div className="w-16 h-4 bg-slate-100 rounded" />
            </div>

            {/* Work Mode Column */}
            <div className="flex-grow flex-shrink-0 flex flex-col justify-center items-start p-0 gap-2 min-w-[120px] h-auto">
              <div className="w-24 h-4 bg-slate-200 rounded" />
              <div className="w-16 h-4 bg-slate-100 rounded" />
            </div>

            {/* Work Type Column */}
            <div className="flex-grow flex-shrink-0 flex flex-col justify-center items-start p-0 gap-2 min-w-[120px] h-auto">
              <div className="w-24 h-4 bg-slate-200 rounded" />
              <div className="w-16 h-4 bg-slate-100 rounded" />
            </div>

            {/* Salary Column */}
            <div className="flex-grow flex-shrink-0 flex flex-col justify-center items-start p-0 gap-2 min-w-[120px] h-auto">
              <div className="w-24 h-4 bg-slate-200 rounded" />
              <div className="w-20 h-4 bg-slate-100 rounded" />
            </div>
          </div>

          {/* AI Matching strength bar */}
          <div className="w-full h-auto py-[12px] px-[16px] bg-[#F9FAFF] rounded-[12px] self-stretch flex flex-row items-center gap-[10px]">
            <div className="w-5 h-5 bg-slate-200 rounded-full flex-shrink-0" />
            <div className="w-3/4 h-4 bg-slate-200 rounded" />
          </div>

          {/* Company Analytics / Recruiter Note / Application Status Skeleton Box */}
          <div className="box-border w-full bg-[#FFFFFF] border border-[#EEF2FF] rounded-[28px] self-stretch p-4 flex flex-col items-start gap-4 h-auto">
            <div className="w-40 h-5 bg-slate-200 rounded" />
            <div className="w-full flex flex-col gap-2.5">
              <div className="w-full h-4 bg-slate-100 rounded" />
              <div className="w-4/5 h-4 bg-slate-100 rounded" />
            </div>
          </div>

          {/* Description Section */}
          <div className="w-full self-stretch flex flex-col items-start p-0 gap-4 mt-2">
            <div className="w-32 h-5 bg-slate-200 rounded" />
            <div className="self-stretch flex-1 flex flex-col gap-3">
              <div className="w-full h-4.5 bg-slate-200 rounded" />
              <div className="w-full h-4.5 bg-slate-200 rounded" />
              <div className="w-11/12 h-4.5 bg-slate-200 rounded" />
              <div className="w-10/12 h-4.5 bg-slate-200 rounded" />
              <div className="w-4/5 h-4.5 bg-slate-200 rounded" />
            </div>
            <div className="w-16 h-4 bg-slate-100 rounded mt-1" />
          </div>

          {/* Map Location Section */}
          <div className="self-stretch flex flex-col justify-start items-start gap-4 mt-4 w-full">
            <div className="self-stretch h-60 rounded-3xl border-4 border-indigo-50 bg-slate-100 w-full" />
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <div className="w-5 h-5 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="w-full h-4 bg-slate-100 rounded" />
            </div>
          </div>

        </div>

        {/* Bottom Floating Bar */}
        <div className="sticky bottom-6 z-50 self-stretch p-4 bg-white rounded-3xl shadow-[0px_4px_16px_rgba(99,102,241,0.08)] outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 w-full h-auto">
          <div className="flex-1 flex flex-col justify-center items-start min-w-0 gap-2">
            <div className="w-44 h-5 bg-slate-200 rounded" />
            <div className="self-stretch inline-flex justify-start items-center gap-2">
              <div className="w-20 h-3 bg-slate-100 rounded" />
              <div className="size-1.5 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="w-24 h-3 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex flex-row items-center justify-between sm:justify-end gap-4 md:gap-6">
            <div className="flex justify-start items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0" />
              <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0" />
            </div>
            {/* Action button */}
            <div className="w-full sm:w-40 h-10 bg-slate-200 rounded-[100px] flex-shrink-0" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default JobDetailSkeleton;
