import React from 'react';
import { Job } from '../types/jobs.types';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface RecommendedJobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
}

export const RecommendedJobCard: React.FC<RecommendedJobCardProps> = ({ job, onClick }) => {
  return (
    <Link
      href={`/jobs/${job.id}`}
      onClick={() => onClick?.(job)}
      className="w-80 h-56 p-4 bg-white rounded-3xl shadow-[0px_0px_0px_0px_rgba(99,102,241,0.08)] outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-start items-start gap-2 cursor-pointer hover:shadow-[0px_8px_30px_rgba(99,102,241,0.08)] transition-all duration-300 transform hover:-translate-y-1 flex-shrink-0"
    >
      {/* Title, Company, Location & Badge row */}
      <div className="self-stretch flex justify-between items-start">
        <div className="flex flex-col justify-start items-start gap-px">
          <div className="text-black text-sm font-normal font-['Poppins'] leading-5 truncate w-48">
            {job.title}
          </div>
          <div className="flex flex-col justify-start items-start">
            <div className="text-gray-500 text-xs font-normal font-['Poppins'] leading-4">
              {job.company}
            </div>
          </div>
          <div className="flex flex-col justify-start items-start">
            <div className="text-gray-500 text-xs font-medium font-['Poppins'] leading-4">
              {job.location}
            </div>
          </div>
        </div>
        {job.recommended_badge && (
          <div className="px-2 py-1 bg-indigo-500/10 rounded-full flex flex-col justify-start items-start">
            <div className="text-indigo-500 text-[10px] font-medium font-['Poppins']">
              {job.recommended_badge}
            </div>
          </div>
        )}
      </div>

      {/* Salary display */}
      <div className="self-stretch flex flex-col justify-start items-start">
        <div className="text-black text-xs font-medium font-['Poppins'] leading-4">
          {job.salary_display || '$160k - $210k'}
        </div>
      </div>

      {/* Response rate and Avg. reply stats grid */}
      <div className="self-stretch pt-3 border-t border-slate-200/50 flex flex-row justify-between items-start">
        <div className="flex flex-col justify-start items-start">
          <div className="text-gray-500 text-[10px] font-normal font-['Poppins']">
            RESPONSE RATE
          </div>
          <div className="text-black text-xs font-medium font-['Poppins'] leading-4">
            {job.response_rate || '98%'}
          </div>
        </div>
        <div className="flex flex-col justify-start items-start">
          <div className="text-gray-500 text-[10px] font-normal font-['Poppins']">
            AVG. REPLY
          </div>
          <div className="text-black text-xs font-medium font-['Poppins'] leading-4">
            {job.avg_reply || '1 day'}
          </div>
        </div>
      </div>

      {/* Match Reason Banner */}
      {job.match_reason && (
        <div className="self-stretch pt-3 flex flex-col justify-start items-start">
          <div className="self-stretch p-2 bg-slate-50 rounded-xl flex justify-start items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center text-indigo-500 flex-shrink-0">
              <Icon icon="lucide:sparkles" className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex-1 text-indigo-500 text-xs font-normal font-['Poppins'] leading-4">
              {job.match_reason}
            </div>
          </div>
        </div>
      )}
    </Link>
  );
};

export default RecommendedJobCard;
