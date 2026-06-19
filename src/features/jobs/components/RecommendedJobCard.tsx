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
      className="w-[309.33px] h-56 p-4 bg-white rounded-3xl shadow-[0px_0px_0px_0px_rgba(99,102,241,0.08)] outline outline-1 outline-offset-[-1px] outline-indigo-50 inline-flex flex-col justify-start items-start gap-2 cursor-pointer hover:shadow-[0px_8px_30px_rgba(99,102,241,0.08)] transition-all duration-300 transform hover:-translate-y-1 flex-shrink-0"
    >
      {/* Title, Company, Location & Badge row */}
      <div className="self-stretch inline-flex justify-between items-start">
        <div className="size- inline-flex flex-col justify-start items-start gap-px">
          <div className="justify-center text-black text-sm font-normal font-['Poppins'] leading-5 truncate w-48">
            {job.title}
          </div>
          <div className="self-stretch inline-flex justify-start items-center gap-1">
            <div className="size- inline-flex flex-col justify-start items-start">
              <div className="justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4">
                {job.company}
              </div>
            </div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-gray-500 text-xs font-medium font-['Poppins'] leading-4">
                {job.location}
              </div>
            </div>
          </div>
        </div>
        {job.recommended_badge && (
          <div className="size- px-2 py-1 bg-indigo-500/10 rounded-full inline-flex flex-col justify-start items-start">
            <div className="justify-center text-indigo-500 text-[10px] font-medium font-['Poppins']">
              {job.recommended_badge}
            </div>
          </div>
        )}
      </div>

      {/* Salary display */}
      <div className="self-stretch flex flex-col justify-start items-start">
        <div className="self-stretch flex flex-col justify-start items-start">
          <div className="self-stretch justify-center text-black text-xs font-medium font-['Poppins'] leading-4">
            {job.salary_display || '$160k - $210k'}
          </div>
        </div>
      </div>

      {/* Response rate and Avg. reply stats grid */}
      <div className="self-stretch pt-3 border-t border-slate-200/50 inline-flex flex-row justify-between items-start">
        <div className="inline-flex flex-col justify-start items-start">
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch justify-center text-gray-500 text-[10px] font-normal font-['Poppins']">RESPONSE RATE</div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch justify-center text-black text-xs font-medium font-['Poppins'] leading-4">
              {job.response_rate || '98%'}
            </div>
          </div>
        </div>
        <div className="inline-flex flex-col justify-start items-start">
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch justify-center text-gray-500 text-[10px] font-normal font-['Poppins']">AVG. REPLY</div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch justify-center text-black text-xs font-medium font-['Poppins'] leading-4">
              {job.avg_reply || '1 day'}
            </div>
          </div>
        </div>
      </div>

      {/* Match Reason Banner */}
      {job.match_reason && (
        <div className="self-stretch pt-3 flex flex-col justify-start items-start">
          <div className="self-stretch p-2 bg-slate-50 rounded-xl inline-flex justify-start items-center gap-2">
            <img src="/assets/AI 2.svg" className="w-5 h-5 flex-shrink-0" alt="AI Icon" />
            <div className="flex-1 justify-center text-indigo-500 text-xs font-normal font-['Poppins'] leading-4">
              {job.match_reason}
            </div>
          </div>
        </div>
      )}
    </Link>
  );
};

export default RecommendedJobCard;
