import React from 'react';
import { Job } from '../types/jobs.types';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface JobCardProps {
  job: Job;
  onSave?: (jobId: string, e: React.MouseEvent) => void;
  onApply?: (jobId: string, e: React.MouseEvent) => void;
  onClick?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSave, onApply, onClick }) => {
  // Determine if we show a custom logo or default placeholders
  const renderLogo = () => {
    if (job.company_logo === 'sphere') {
      return (
        <div className="w-14 h-10 bg-slate-100 rounded-3xl flex justify-center items-center overflow-hidden">
          {/* Sphere shape inside */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
        </div>
      );
    }
    // Default briefcase icon
    return (
      <div className="w-14 h-10 bg-indigo-50 rounded-3xl flex justify-center items-center flex-shrink-0">
        <Icon icon="lucide:briefcase" className="w-5 h-5 text-indigo-500" />
      </div>
    );
  };

  // Determine color for posted date
  const getPostedDateColor = () => {
    if (job.posted_at.includes('month') || job.posted_at.includes('year')) {
      return 'text-amber-500 font-medium';
    }
    return 'text-gray-400';
  };

  return (
    <div
      onClick={() => onClick?.(job)}
      className="self-stretch p-4 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50/100 flex flex-col justify-center items-start gap-3 hover:outline-indigo-200 hover:shadow-[0px_4px_20px_rgba(99,102,241,0.05)] transition-all duration-200 cursor-pointer"
    >
      {/* Top Row: Job Info and Logo */}
      <div className="self-stretch flex justify-between items-start">
        <div className="flex flex-col justify-start items-start gap-1">
          <h3 className="text-black text-base font-semibold font-['Poppins'] leading-6">
            {job.title}
          </h3>
          <span className="text-gray-500 text-sm font-normal font-['Poppins'] leading-5">
            {job.company}
          </span>
          <span className="text-gray-400 text-xs font-medium font-['Poppins'] leading-4">
            {job.job_type}
          </span>
        </div>
        {renderLogo()}
      </div>

      {/* Middle Row: Meta and Salary */}
      <div className="self-stretch flex justify-between items-center gap-4 border-t border-slate-100/50 pt-2">
        <div className="flex items-center gap-2">
          {/* Experience tag */}
          <div className="flex justify-start items-center gap-1.5 text-gray-700 text-xs font-normal font-['Poppins']">
            <Icon icon="lucide:briefcase" className="w-4 h-4 text-gray-500" />
            <span>{job.experience || '0-2Yrs'}</span>
          </div>

          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />

          {/* Location / Work mode tag */}
          <div className="flex justify-start items-center gap-1.5 text-gray-700 text-xs font-normal font-['Poppins']">
            <Icon icon="lucide:map-pin" className="w-4 h-4 text-gray-500" />
            <span>
              {job.work_mode && job.location
                ? `${job.work_mode} - ${job.location}`
                : job.work_mode || job.location}
            </span>
          </div>
        </div>

        {/* Salary */}
        <div className="text-black text-sm font-semibold font-['Poppins'] leading-5">
          {job.salary_display || '$160k - $210k'}
        </div>
      </div>

      {/* Bottom Row: Posted date and actions */}
      <div className="self-stretch flex justify-between items-center border-t border-slate-100/50 pt-2">
        <span className={`text-xs font-normal font-['Poppins'] leading-4 ${getPostedDateColor()}`}>
          {job.posted_at}
        </span>

        <div className="flex justify-start items-center gap-3">
          {/* Apply Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply?.(job.id, e);
            }}
            className={`w-28 h-10 rounded-3xl flex justify-center items-center text-sm font-semibold transition-all ${
              job.is_applied
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm'
            }`}
          >
            {job.is_applied ? 'Applied' : 'Apply'}
          </button>

          {/* Save / Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave?.(job.id, e);
            }}
            className="w-10 h-10 rounded-full bg-indigo-50/50 hover:bg-indigo-50 flex items-center justify-center transition-all text-gray-700 active:scale-95"
            aria-label="Bookmark job"
          >
            <Icon
              icon={job.is_saved ? 'solar:bookmark-bold' : 'solar:bookmark-linear'}
              className={`w-5 h-5 ${job.is_saved ? 'text-indigo-500' : 'text-gray-500'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
