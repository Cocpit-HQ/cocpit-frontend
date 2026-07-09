import React from 'react';
import { Job } from '../types/jobs.types';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getCurrencyIcon } from '../utils/currency.utils';

interface RecommendedJobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
}

export const RecommendedJobCard: React.FC<RecommendedJobCardProps> = ({ job, onClick }) => {
  const percentMatch = job.recommended_badge ? job.recommended_badge.match(/\d+/) : null;
  const percentNum = percentMatch ? parseInt(percentMatch[0], 10) : 10;
  const strongerThanPercent = 100 - percentNum;

  return (
    <Link
      href={`/jobs/${job.id}`}
      onClick={() => onClick?.(job)}
      className="w-[309.33px] h-56 p-4 bg-white dark:bg-[#0B0F19] rounded-3xl shadow-[0px_0px_0px_0px_rgba(99,102,241,0.08)] outline outline-1 outline-offset-[-1px] outline-indigo-50 dark:outline-[#2E3445] inline-flex flex-col justify-start items-start gap-2 cursor-pointer flex-shrink-0"
    >
      {/* Title, Company, Location & Badge row */}
      <div className="self-stretch inline-flex justify-between items-start">
        <div className="size- inline-flex flex-col justify-start items-start gap-px">
          <div className="justify-center text-black dark:text-[#F9FAFB] text-sm font-normal font-['Poppins'] leading-5 truncate w-48">
            {job.title}
          </div>
          <div className="self-stretch inline-flex justify-start items-center gap-1">
            <div className="size- inline-flex flex-col justify-start items-start">
              <div className="justify-center text-gray-500 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4">
                {job.company}
              </div>
            </div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-gray-500 dark:text-[#9CA3AF] text-xs font-medium font-['Poppins'] leading-4">
                {job.location}
              </div>
            </div>
          </div>
        </div>
        {job.recommended_badge && (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div className="px-2 py-1 bg-indigo-500/10 dark:bg-[#818CF8]/10 rounded-full inline-flex flex-col justify-start items-start">
                <div className="justify-center text-indigo-500 dark:text-[#818CF8] text-[10px] font-medium font-['Poppins']">
                  {job.recommended_badge}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="end"
              sideOffset={8}
              className="w-[289px] py-3 px-4 bg-[#EEF2FF] dark:bg-[#1C2340] rounded-[24px] border-none shadow-[0px_4px_16px_rgba(99,102,241,0.08)] text-black dark:text-[#F9FAFB] z-[9999]"
            >
              <span className="w-[257px] flex items-center text-black dark:text-[#F9FAFB] text-[12px] font-normal font-['Poppins'] leading-[16px] flex-grow">
                You&apos;re stronger than {strongerThanPercent}% of applicants for this job based on your profile and skills
              </span>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Salary display */}
      <div className="self-stretch flex flex-col justify-start items-start">
        <div className="self-stretch flex flex-col justify-start items-start">
          <div className="self-stretch justify-center text-black dark:text-[#F9FAFB] text-xs font-medium font-['Poppins'] leading-4 flex items-center gap-1">
              {job.salary_display || job.salary_min || job.salary_max ? (
                <>
                  <span>
                    {job.salary_display
                      ? job.salary_display
                      : `${job.salary_min || ''} – ${job.salary_max || ''}`.trim()
                    }
                  </span>
                </>
              ) : (
                <span className="opacity-0 select-none">-</span>
              )}
            </div>
        </div>
      </div>

      {/* Response rate and Avg. reply stats grid */}
      <div className="self-stretch pt-3 border-t border-slate-200/50 dark:border-[#2E3445]/50 inline-flex flex-row justify-between items-start">
        <div className="inline-flex flex-col justify-start items-start">
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch justify-center text-gray-500 dark:text-[#9CA3AF] text-[10px] font-normal font-['Poppins']">RESPONSE RATE</div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch justify-center text-black dark:text-[#F9FAFB] text-xs font-medium font-['Poppins'] leading-4">
              {job.response_rate || '98%'}
            </div>
          </div>
        </div>
        <div className="inline-flex flex-col justify-start items-start">
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch justify-center text-gray-500 dark:text-[#9CA3AF] text-[10px] font-normal font-['Poppins']">AVG. REPLY</div>
          </div>
          <div className="self-stretch flex flex-col justify-start items-start">
            <div className="self-stretch justify-center text-black dark:text-[#F9FAFB] text-xs font-medium font-['Poppins'] leading-4">
              {job.avg_reply || '1 day'}
            </div>
          </div>
        </div>
      </div>

      {/* Match Reason Banner */}
      {job.match_reason && (
        <div className="self-stretch pt-3 flex flex-col justify-start items-start">
          <div className="self-stretch p-2 bg-slate-50 dark:bg-[#2E3445] rounded-xl inline-flex justify-start items-center gap-2">
            <img src="/assets/AI 2.svg" className="w-5 h-5 flex-shrink-0" alt="AI Icon" />
            <div className="flex-1 justify-center text-indigo-500 dark:text-[#818CF8] text-xs font-normal font-['Poppins'] leading-4">
              {job.match_reason}
            </div>
          </div>
        </div>
      )}
    </Link>
  );
};

export default RecommendedJobCard;
