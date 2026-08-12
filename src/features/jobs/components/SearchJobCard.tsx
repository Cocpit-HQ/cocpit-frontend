import React from 'react';
import { Job } from '../types/jobs.types';
import { Icon } from '@iconify/react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface SearchJobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  onApply?: (jobId: string, e: React.MouseEvent) => void;
  onSave?: (jobId: string, e: React.MouseEvent) => void;
}

export const SearchJobCard: React.FC<SearchJobCardProps> = React.memo(({
  job,
  onClick,
  onApply,
  onSave
}) => {
  const { isCompany, activeProfile } = useActiveProfile();
  const isCompanyMode = isCompany && !!activeProfile?.id;

  const getPostedDateColor = () => {
    if (!job.posted_at) return '';
    const dateLower = job.posted_at.toLowerCase();
    if (dateLower.includes('month') || dateLower.includes('months')) {
      return 'text-[#F59E0B] dark:text-[#FBBF24]';
    }
    return '';
  };

  const badgeText = job.recommended_badge || "Top 10%";
  const percentMatch = badgeText.match(/\d+/);
  const percentNum = percentMatch ? parseInt(percentMatch[0], 10) : 10;
  const strongerThanPercent = 100 - percentNum;

  return (
    <div
      onClick={() => onClick?.(job)}
      className={`w-full p-4 bg-white ${isCompanyMode ? 'dark:bg-[#0F1115] dark:outline-[#2A2D35]' : 'dark:bg-[#0B0F19] dark:outline-[#2E3445]'} rounded-[24px] outline outline-1 outline-offset-[-1px] outline-[#EEF2FF] flex flex-col justify-center items-start gap-3 transition-all duration-200 cursor-pointer mb-6 last:mb-0`}
    >
      <div className="w-full flex justify-between items-start">
        {/* Left Header */}
        <div className="flex flex-col items-start gap-1">
          <div className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[16px] font-medium font-['Poppins'] leading-normal`}>
            {job.title}
          </div>
          <div className="text-[#6B7280] dark:text-[#9CA3AF] text-[14px] font-normal font-['Poppins'] leading-tight">
            {job.company}
          </div>
          <div className="text-[#6B7280] dark:text-[#9CA3AF] text-[14px] font-semibold font-['Poppins'] leading-tight">
            {job.job_type || 'Full time'}
          </div>
        </div>

        {/* Right Header (Badge) */}
        {job.is_recommended || job.recommended_badge ? (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div className={`px-2 py-1 bg-indigo-500/10 ${isCompanyMode ? 'dark:bg-[#4D9CFF]/10' : 'dark:bg-[#818CF8]/10'} rounded-full inline-flex flex-col justify-start items-start`}>
                <div className={`justify-center text-indigo-500 ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'} text-[10px] font-medium font-['Poppins']`}>
                  {badgeText}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="end"
              sideOffset={8}
              className={`w-[289px] py-3 px-4 bg-[#EEF2FF] ${isCompanyMode ? 'dark:bg-[#1C2340]' : 'dark:bg-[#1C2340]'} rounded-[24px] border-none shadow-[0px_4px_16px_rgba(99,102,241,0.08)] text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} z-[9999]`}
            >
              <span className={`w-[257px] flex items-center text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[12px] font-normal font-['Poppins'] leading-[16px] flex-grow`}>
                You&apos;re stronger than {strongerThanPercent}% of applicants for this job based on your profile and skills
              </span>
            </TooltipContent>
          </Tooltip>
        ) : (
          /* Placeholder if no badge, just to keep space if needed, or null */
          <div className="h-6" />
        )}
      </div>

      <div className="w-full flex justify-between items-center mt-2">
        {/* Experience and Location */}
        <div className="flex items-center gap-4">
          <div className="flex justify-start items-center gap-2">
            <Icon icon="hugeicons:job-search" className={`w-5 h-5 text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`} />
            <div className={`justify-start text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[14px] font-normal font-['Poppins'] leading-5`}>{job.experience || '0-2Yrs'}</div>
          </div>

          <div className={`size-[6px] bg-black ${isCompanyMode ? 'dark:bg-[#FFFFFF]' : 'dark:bg-[#F9FAFB]'} rounded-full`} />
          
          <div className="flex justify-start items-center gap-2">
            <Icon icon="hugeicons:location-05" className={`w-5 h-5 text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`} />
            <div className={`justify-start text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[14px] font-normal font-['Poppins'] leading-5`}>
              {job.work_mode && job.work_mode.toLowerCase() === 'remote'
                ? 'Remote'
                : job.work_mode && job.location
                ? `${job.work_mode} - ${job.location}`
                : job.work_mode || job.location}
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className={`justify-start text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[14px] font-normal font-['Poppins'] leading-5 flex items-center`}>
          {job.salary_display || job.salary_min || job.salary_max ? (
            <span>
              {job.salary_display
                ? job.salary_display
                : `${job.salary_min || ''} - ${job.salary_max || ''}`.trim()
              }
            </span>
          ) : (
            <span className="opacity-0 select-none text-[12px]">-</span>
          )}
        </div>
      </div>

      <div className="w-full flex justify-between items-end mt-4">
        {/* Posted At */}
        <div className={`justify-start text-[#6B7280] dark:text-[#9CA3AF] text-[12px] font-normal font-['Poppins'] leading-4 ${getPostedDateColor()}`}>
          {job.posted_at}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply?.(job.id, e);
            }}
            className={`box-border flex flex-row justify-center items-center px-4 py-2 w-[120px] h-10 rounded-[24px] bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} hover:bg-[#6366F1]/90 ${isCompanyMode ? 'dark:hover:bg-[#4D9CFF]/90' : 'dark:hover:bg-[#818CF8]/90'} text-white ${isCompanyMode ? 'dark:text-[#0F1115]' : 'dark:text-[#F9FAFB]'} transition-all duration-200 active:scale-95 flex-none text-[14px] font-normal font-['Poppins'] leading-5`}
          >
            Apply
          </button>

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
              className={`w-6 h-6 transition-colors ${job.is_saved ? (isCompanyMode ? 'text-[#4D9CFF] dark:text-[#4D9CFF]' : 'text-[#6366F1] dark:text-[#818CF8]') : `text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} hover:text-[#6366F1] ${isCompanyMode ? 'dark:hover:text-[#4D9CFF]' : 'dark:hover:text-[#818CF8]'}`}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
});

SearchJobCard.displayName = 'SearchJobCard';

export default SearchJobCard;
