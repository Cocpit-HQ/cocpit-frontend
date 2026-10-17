import React from 'react';
import { useRouter } from 'next/navigation';
import { Job } from '../types/jobs.types';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { getCurrencyIcon } from '../utils/currency.utils';
import { toast } from 'sonner';
import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { FeatureDisabledTooltip } from '@/components/feature-flags';

interface JobCardProps {
  job: Job;
  onSave?: (jobId: string, e: React.MouseEvent) => void;
  onApply?: (jobId: string, e: React.MouseEvent) => void;
  onWithdraw?: (jobId: string, e: React.MouseEvent) => void;
  onClick?: (job: Job) => void;
  onAccept?: (offerId: string, e: React.MouseEvent) => void;
  onDecline?: (offerId: string, e: React.MouseEvent) => void;
  isSavedTab?: boolean;
}

export const JobCard: React.FC<JobCardProps> = React.memo(({ job, onSave, onApply, onWithdraw, onClick, onAccept, onDecline, isSavedTab }) => {
  const router = useRouter();
  const { flags } = useFeatureFlags();

  const { isCompany, activeProfile } = useActiveProfile();
  const isCompanyMode = isCompany && activeProfile;
  const badgeText = job.recommended_badge || 'Top 15%';
  const percentMatch = badgeText.match(/\d+/);
  const percentNum = percentMatch ? parseInt(percentMatch[0], 10) : 15;
  const strongerThanPercent = 100 - percentNum;

  // Determine color for posted date
  const getPostedDateColor = () => {
    if (job.posted_at.includes('month') || job.posted_at.includes('year')) {
      return `text-amber-500 ${isCompanyMode ? 'dark:text-[#FBBF24]' : 'dark:text-amber-400'} font-medium`;
    }
    return `text-gray-400 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`;
  };

  return (
    <div
      onClick={() => onClick?.(job)}
      className={`self-stretch p-4 bg-white ${isCompanyMode ? 'dark:bg-[#0F1115] dark:outline-[#2A2D35]' : 'dark:bg-[#0B0F19] dark:outline-[#2E3445]'} rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-center items-start gap-3 transition-all duration-200 cursor-pointer`}
    >
      {/* Top Row: Job Info and Badge */}
      <div className="self-stretch inline-flex justify-between items-start">
        <div className="flex justify-start items-start gap-3">
          {/* Company Logo - Removed as requested */}
          {/*
          <div className="w-12 h-12 rounded-xl flex-shrink-0 flex justify-center items-center overflow-hidden bg-indigo-50 border border-indigo-100">
            {job.company_logo && job.company_logo !== 'sphere' ? (
              <img 
                src={job.company_logo} 
                alt={`${job.company} logo`}
                className="w-full h-full object-contain bg-white dark:bg-[#0B0F19]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : job.company_logo === 'sphere' ? (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
            ) : null}
            <Icon 
              icon="hugeicons:job-search" 
              className={`w-6 h-6 text-indigo-500 ${(job.company_logo && job.company_logo !== 'sphere') ? 'hidden' : ''}`}
            />
          </div>
          */}

          <div className="inline-flex flex-col justify-start items-start gap-1">
            <div className={`justify-start text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-base font-medium font-['Poppins'] leading-6`}>{job.title}</div>
            <div className={`justify-start text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-sm font-normal font-['Poppins'] leading-5`}>{job.company}</div>
            {(job.work_type || job.job_type) && (
              <div className={`justify-start text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-sm font-normal font-['Poppins'] leading-5`}>
                {job.work_type || job.job_type}
              </div>
            )}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          {isSavedTab ? (
            job.is_offer ? (
              <div className="px-3 py-1 bg-[#EEF2FF] dark:bg-indigo-950/30 border border-[#6366F1] dark:border-indigo-800 rounded-full inline-flex flex-col justify-start items-start">
                <span className={`justify-center text-[#6366F1] ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'} text-[10px] font-semibold font-['Poppins']`}>
                  Offer
                </span>
              </div>
            ) : job.is_closed ? (
              <div className="px-3 py-1 bg-[#FEF3C7] dark:bg-amber-950/30 border border-[#FBBF24] dark:border-amber-800 rounded-full inline-flex flex-col justify-start items-start">
                <span className={`justify-center text-[#D97706] ${isCompanyMode ? 'dark:text-[#FBBF24]' : 'dark:text-amber-400'} text-[10px] font-semibold font-['Poppins']`}>
                  Closed
                </span>
              </div>
            ) : (
              <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full inline-flex flex-col justify-start items-start">
                <span className={`justify-center text-emerald-600 ${isCompanyMode ? 'dark:text-[#4ADE80]' : 'dark:text-[#4ADE80]'} text-[10px] font-semibold font-['Poppins']`}>
                  Active
                </span>
              </div>
            )
          ) : (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div tabIndex={0} className={`px-2 py-1 bg-indigo-500/10 ${isCompanyMode ? 'dark:bg-[#4D9CFF]/10' : 'dark:bg-[#818CF8]/10'} rounded-full inline-flex flex-col justify-start items-start focus:outline-none`}>
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
          )}
        </div>
      </div>

      {/* Middle Row: Meta and Salary */}
      <div className="self-stretch flex flex-col items-start gap-2 md:flex-row md:justify-between md:items-center mt-1 md:mt-0">
        <div className="flex flex-col items-start gap-2 md:flex-row md:flex-wrap md:items-center">
          {/* Experience */}
          <div className="flex justify-start items-center gap-2">
            <Icon icon="hugeicons:job-search" className={`w-5 h-5 text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`} />
            <div className={`justify-start text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-sm font-normal font-['Poppins'] leading-5`}>{job.experience || '0-2Yrs'}</div>
          </div>

          {/* Work Mode & Location */}
          {(job.work_mode || job.location) && (
            <>
              <div className={`hidden md:block size-1.5 bg-black ${isCompanyMode ? 'dark:bg-[#FFFFFF]' : 'dark:bg-[#F9FAFB]'} rounded-full`} />
              <div className="flex justify-start items-center gap-2">
                <Icon icon="hugeicons:location-05" className={`w-5 h-5 text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`} />
                <div className={`justify-start text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-sm font-normal font-['Poppins'] leading-5`}>
                  {job.work_mode && job.work_mode.toLowerCase() === 'remote'
                    ? 'Remote'
                    : job.work_mode && job.location
                      ? `${job.work_mode} - ${job.location}`
                      : job.work_mode || job.location}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-start items-center gap-2 md:ml-auto">
          <Icon icon="solar:wallet-linear" className={`md:hidden w-5 h-5 text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'}`} />
          <div className={`justify-start text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-sm font-normal font-['Poppins'] leading-5 flex items-center gap-1.5`}>
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
              <span className="opacity-0 select-none text-xs">-</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Posted date and actions */}
      <div className="self-stretch flex flex-row justify-between items-center mt-2">
        <div className={`justify-start text-gray-500 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4 ${getPostedDateColor()}`}>
          {job.posted_at}
        </div>
        <div className="flex-1 flex flex-row items-center gap-2 sm:gap-4 justify-end">
          {job.is_offer ? (
            (job.offerStatus === 'accepted' || job.application_status === 'Accepted') ? (
              <div className="flex flex-row items-center gap-3">
                <span className={`text-gray-400 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-sm font-['Poppins'] leading-5`}>Offer accepted</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const params = new URLSearchParams();
                    if (job.org_id) {
                      params.set('companyId', job.org_id);
                    } else if (job.recruiter_id) {
                      params.set('userId', job.recruiter_id);
                    }
                    if (job.offer_id) {
                      params.set('offerContext', job.offer_id);
                    }
                    router.push(`/messaging?${params.toString()}`);
                  }}
                  className={`box-border flex flex-row justify-center items-center px-4 py-2 w-[120px] h-10 rounded-[100px] bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} hover:bg-[#6366F1]/90 ${isCompanyMode ? 'dark:hover:bg-[#4D9CFF]/90' : 'dark:hover:bg-[#818CF8]/90'} text-white ${isCompanyMode ? 'dark:text-[#0F1115]' : 'dark:text-[#F9FAFB]'} transition-all duration-200 active:scale-95 flex-none text-sm font-normal font-['Poppins'] leading-5`}
                >
                  Chat
                </button>
              </div>
            ) : (job.offerStatus === 'declined' || job.application_status === 'Declined') ? (
              <span className={`text-gray-400 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-sm font-['Poppins'] leading-5 pr-2`}>Offer declined</span>
            ) : (job.offerStatus === 'withdrawn' || job.application_status === 'Withdrawn') ? (
              <span className={`text-gray-400 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-sm font-['Poppins'] leading-5 pr-2`}>Offer withdrawn</span>
            ) : (job.offerStatus === 'expired' || job.application_status === 'Expired') ? (
              <span className={`text-gray-400 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-sm font-['Poppins'] leading-5 pr-2`}>Offer expired</span>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecline?.(job.offer_id || job.id, e);
                  }}
                  className={`box-border flex flex-row justify-center items-center px-4 py-2 w-[120px] h-10 rounded-[100px] border border-[#6B7280] ${isCompanyMode ? 'dark:border-[#A1A8B3]' : 'dark:border-[#9CA3AF]'} text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} bg-white dark:bg-transparent hover:bg-slate-50 ${isCompanyMode ? 'dark:hover:bg-[#2A2D35]' : 'dark:hover:bg-[#2E3445]'} transition-all duration-200 active:scale-95 flex-none text-sm font-normal font-['Poppins'] leading-5`}
                >
                  Decline
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept?.(job.offer_id || job.id, e);
                  }}
                  className={`box-border flex flex-row justify-center items-center px-4 py-2 w-[120px] h-10 rounded-[100px] bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} hover:bg-[#6366F1]/90 ${isCompanyMode ? 'dark:hover:bg-[#4D9CFF]/90' : 'dark:hover:bg-[#818CF8]/90'} text-white ${isCompanyMode ? 'dark:text-[#0F1115]' : 'dark:text-[#F9FAFB]'} transition-all duration-200 active:scale-95 flex-none text-sm font-normal font-['Poppins'] leading-5`}
                >
                  Accept
                </button>
              </>
            )
          ) : (
            <>
              {/* Apply / Withdraw / Chat Button */}
              {job.application_status?.toLowerCase() === 'shortlisted' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const params = new URLSearchParams();
                    if (job.org_id) {
                      params.set('companyId', job.org_id);
                    } else if (job.recruiter_id) {
                      params.set('userId', job.recruiter_id);
                    }
                    params.set('jobContext', job.id);
                    router.push(`/messaging?${params.toString()}`);
                  }}
                  className={`box-border flex flex-row justify-center items-center px-4 py-2 w-[120px] h-10 rounded-[100px] bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} hover:bg-[#6366F1]/90 ${isCompanyMode ? 'dark:hover:bg-[#4D9CFF]/90' : 'dark:hover:bg-[#818CF8]/90'} text-white ${isCompanyMode ? 'dark:text-[#0F1115]' : 'dark:text-[#F9FAFB]'} transition-all duration-200 active:scale-95 flex-none text-sm font-normal font-['Poppins'] leading-5`}
                >
                  Chat
                </button>
              ) : (isSavedTab && job.is_closed) ? (
                /* Closed Job in Saved Tab -> show NO action buttons/text next to bookmark */
                null
              ) : job.is_closed ? (
                <span className="text-[#EF4444] dark:text-[#F87171] text-[14px] font-normal font-['Poppins'] leading-[20px] pr-2 font-medium">
                  Job No Longer Available
                </span>
              ) : job.is_applied ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWithdraw?.(job.id, e);
                  }}
                  className={`box-border flex flex-row justify-center items-center px-4 py-2 w-[120px] h-10 rounded-[100px] border border-[#6B7280] ${isCompanyMode ? 'dark:border-[#A1A8B3]' : 'dark:border-[#9CA3AF]'} text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} bg-white dark:bg-transparent hover:bg-slate-50 ${isCompanyMode ? 'dark:hover:bg-[#2A2D35]' : 'dark:hover:bg-[#2E3445]'} transition-all duration-200 active:scale-95 flex-none text-sm font-normal font-['Poppins'] leading-5`}
                >
                  Withdraw
                </button>
              ) : (
                <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply?.(job.id, e);
                    }}
                    className={`box-border flex flex-row justify-center items-center px-4 py-2 w-[120px] h-10 rounded-[100px] bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} hover:bg-[#6366F1]/90 ${isCompanyMode ? 'dark:hover:bg-[#4D9CFF]/90' : 'dark:hover:bg-[#818CF8]/90'} text-white ${isCompanyMode ? 'dark:text-[#0F1115]' : 'dark:text-[#F9FAFB]'} transition-all duration-200 active:scale-95 flex-none text-sm font-normal font-['Poppins'] leading-5`}
                  >
                    Apply
                  </button>
                </FeatureDisabledTooltip>
              )}
            </>
          )}

          {/* Bookmark Button */}
          {flags?.saved_jobs === false ? (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  tabIndex={0}
                  className="w-6 h-6 flex items-center justify-center cursor-default opacity-50 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon
                    icon="solar:bookmark-linear"
                    className="w-6 h-6 text-gray-500 dark:text-gray-400"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                sideOffset={8}
                className="py-2 px-3 bg-gray-900 dark:bg-gray-800 border-none text-white text-xs font-['Poppins'] z-[9999] shadow-lg rounded-xl"
              >
                Feature under maintenance
              </TooltipContent>
            </Tooltip>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
});

JobCard.displayName = 'JobCard';

export default JobCard;
