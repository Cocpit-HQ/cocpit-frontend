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
      className="self-stretch p-4 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-center items-start gap-3 hover:outline-indigo-200 hover:shadow-[0px_4px_20px_rgba(99,102,241,0.05)] transition-all duration-200 cursor-pointer"
    >
      {/* Top Row: Job Info and Logo */}
      <div className="self-stretch inline-flex justify-between items-start">
        <div className="size- inline-flex flex-col justify-start items-start gap-2">
          <div className="justify-start text-black text-base font-medium font-['Poppins'] leading-6">{job.title}</div>
          <div className="justify-start text-gray-500 text-sm font-normal font-['Poppins'] leading-5">{job.company}</div>
          <div className="justify-start text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">{job.job_type}</div>
        </div>
        {renderLogo()}
      </div>

      {/* Middle Row: Meta and Salary */}
      <div className="self-stretch inline-flex justify-between items-center">
        <div className="size- flex justify-start items-center gap-2">
          <div className="size- flex justify-start items-center gap-2">
            <div className="size-5 relative overflow-hidden">
              <div className="w-4 h-3 left-[1.67px] top-[4.58px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-black" />
              <div className="size-1.5 left-[11.67px] top-[11.62px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-black" />
              <div className="w-2 h-[2.92px] left-[5.83px] top-[1.67px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-black" />
            </div>
            <div className="justify-start text-black text-sm font-normal font-['Poppins'] leading-5">{job.experience || '0-2Yrs'}</div>
          </div>
          <div className="size-1.5 bg-black rounded-full" />
          <div className="size- flex justify-start items-center gap-2">
            <div className="size-5 relative overflow-hidden">
              <div className="size-1 left-[7.92px] top-[5.42px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-black" />
              <div className="w-3 h-3.5 left-[4.17px] top-[1.67px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-black" />
              <div className="w-2.5 h-[1.67px] left-[5px] top-[16.67px] absolute outline outline-[1.50px] outline-offset-[-0.75px] outline-black" />
            </div>
            <div className="justify-start text-black text-sm font-normal font-['Poppins'] leading-5">
              {job.work_mode && job.location
                ? `${job.work_mode} - ${job.location}`
                : job.work_mode || job.location}
            </div>
          </div>
        </div>
        <div className="size- flex justify-start items-center gap-2">
          <div className="justify-start text-black text-sm font-normal font-['Poppins'] leading-5">{job.salary_display || '$160k - $210k'}</div>
        </div>
      </div>

      {/* Bottom Row: Posted date and actions */}
      <div className="self-stretch inline-flex justify-between items-center">
        <div className={`justify-start text-gray-500 text-xs font-normal font-['Poppins'] leading-4 ${getPostedDateColor()}`}>
          {job.posted_at}
        </div>
        <div className="w-[160px] h-10 flex flex-row items-center gap-4 flex-none justify-end">
          {/* Apply Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply?.(job.id, e);
            }}
            className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[120px] h-10 border border-white rounded-[24px] bg-[#6366F1] hover:bg-[#6366F1]/90 text-white transition-all duration-200 active:scale-95 flex-none"
          >
            <div className="w-[40px] h-[20px] text-center text-sm font-normal font-['Poppins'] leading-5 text-white whitespace-nowrap flex items-center justify-center">
              Apply
            </div>
          </button>
          
          {/* Bookmark Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave?.(job.id, e);
            }}
            className="w-6 h-6 flex items-center justify-center transition-all active:scale-95 flex-none"
            aria-label="Bookmark job"
          >
            <Icon
              icon={job.is_saved ? 'solar:bookmark-bold' : 'solar:bookmark-linear'}
              className={`w-6 h-6 transition-colors ${job.is_saved ? 'text-[#6366F1]' : 'text-gray-500 hover:text-[#6366F1]'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
