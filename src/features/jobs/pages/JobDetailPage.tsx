import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJobDetail } from '../hooks/useJobDetail';
import { Icon } from '@iconify/react';
import { useSmartBack } from '@/hooks/use-smart-back';
import { getCurrencyIcon } from '../utils/currency.utils';
import { toast } from 'sonner';
import { ApplyJobModal } from '../components/ApplyJobModal';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';
import CocpitShareModel from '@/shared/commonComponents/cocpitsharemodel';
import JobDetailSkeleton from '../components/skeletons/JobDetailSkeleton';
import { useJobStore } from '@/store/job.store';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface JobDetailPageProps {
  jobId: string;
}

const JobDetailMap = ({ location }: { location: string }) => {
  return (
    <div className="w-full h-full bg-[#E5E9F0] relative overflow-hidden flex items-center justify-center">
      {location ? (
        <>
          <iframe
            width="100%"
            height="100%"
            className="border-0 relative z-0"
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=14&output=embed`}
          />
          <a
            href={`https://maps.google.com/maps?q=${encodeURIComponent(location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label="Open in Google Maps"
          />
        </>
      ) : (
        <div className="text-gray-400 text-sm font-['Poppins']">No location specified</div>
      )}
    </div>
  );
};

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ jobId }) => {
  const {
    job,
    isLoading,
    toggleSave,
    applyToJob,
    withdrawJob,
    respondToOffer,
    toggleFollow
  } = useJobDetail(jobId);
  const { isCompany, activeProfile } = useActiveProfile();
  const isCompanyMode = isCompany && activeProfile;
  const { goBack } = useSmartBack();
  const router = useRouter();
  const searchParams = useSearchParams();
  // If we arrived here from a chat's job context card, "back" should return
  // to that specific conversation instead of the generic jobs section.
  const returnTo = searchParams.get('returnTo');
  const handleBack = () => {
    if (returnTo) {
      router.push(returnTo);
      return;
    }
    goBack('/jobs');
  };
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  React.useEffect(() => {
    sessionStorage.setItem('coming_from_job_detail', 'true');
    window.scrollTo(0, 0);
  }, [jobId]);

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (!job) {
    return (
      <div className={`min-h-screen flex flex-col gap-4 bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'}`}>
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 shadow-sm">
          <Icon icon="lucide:alert-circle" className="w-8 h-8" />
        </div>
        <h2 className={`text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-xl font-bold font-['Poppins']`}>Job Not Found</h2>
        <p className={`text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-sm font-['Poppins'] max-w-sm`}>
          The job listing you are looking for does not exist or may have been filled or expired.
        </p>
        <button
          onClick={handleBack}
          className="mt-2 px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-3xl text-sm font-semibold font-['Poppins'] transition-all flex items-center gap-2"
        >
          <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          <span>Back to Jobs</span>
        </button>
      </div>
    );
  }

  const currentStatus = job.application_status || 'Applied';
  const isDeclined = currentStatus === 'Declined' || currentStatus === 'Rejected';

  const steps = isDeclined
    ? ['Applied', 'in-review', 'Declined']
    : ['Applied', 'in-review', 'Shortlisted'];

  const stepLabels: Record<string, string> = {
    'Applied': 'Applied',
    'in-review': 'In review',
    'Shortlisted': 'Shortlisted',
    'Declined': 'Declined',
  };

  let mappedStatus = currentStatus;
  if (mappedStatus.toLowerCase() === 'in-review') mappedStatus = 'in-review';
  else if (mappedStatus === 'Rejected') mappedStatus = 'Declined';
  else if (['Offer', 'Accepted', 'Interview', 'Approved'].includes(mappedStatus)) mappedStatus = 'Shortlisted';

  const currentStepIndex = steps.indexOf(mappedStatus) !== -1 ? steps.indexOf(mappedStatus) : 0;

  return (
    <div className={`relative w-full bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} flex justify-center px-4 md:px-0`}>
      <div className={`flex flex-col items-center py-0 gap-6 relative w-full max-w-[998px] bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} pb-8`}>

        {/* Header chevron and Title block */}
        <div className="w-full min-h-[48px] self-stretch flex flex-row items-start p-0 gap-[16px]">
          <button
            onClick={handleBack}
            className={`w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} backdrop-blur-[12px] flex flex-row justify-center items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-transparent transition-colors active:scale-95 flex-shrink-0`}
          >
            <Icon icon="lucide:chevron-left" className={`w-6 h-6 text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`} />
          </button>
          <div className="flex flex-col items-start p-0 w-full min-h-[42px] gap-0">
            <div className={`text-left text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[18px] font-medium font-['Poppins'] leading-[26px]`}>Job details</div>
            <div className={`text-left text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[12px] font-normal font-['Poppins'] leading-[16px]`}>Review the role, requirements, and benefits.</div>
          </div>
        </div>

        {/* Content body wrapper */}
        <div className="self-stretch p-0 md:p-4 flex flex-col justify-start items-start gap-6 w-full">

          {/* Active indicator and Job title card */}
          <div className="w-full h-auto self-stretch flex flex-col justify-center items-start p-0 gap-2 md:gap-4">
            {/* Desktop View (md and up) */}
            <div className="hidden md:flex w-full flex-col md:flex-row md:justify-between md:items-center">
              <div className="w-full flex flex-row justify-between md:justify-start items-center gap-4">
                <div className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-2xl md:text-[32px] font-semibold font-['Poppins'] leading-tight md:leading-[56px] py-1`}>{job.title}</div>
                {job.is_closed ? (
                  <div className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[74px] h-8 bg-[#FEF3C7] ${isCompanyMode ? 'dark:bg-[#4A3A10]' : 'dark:bg-[#4A3A10]'} border border-[#FBBF24] ${isCompanyMode ? 'dark:border-[#FBBF24]' : 'dark:border-[#F59E0B]'} rounded-[24px] flex-none order-0 flex-shrink-0`}>
                    <span className={`w-[42px] h-4 font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#FBBF24] ${isCompanyMode ? 'dark:text-[#FBBF24]' : 'dark:text-[#F59E0B]'} flex-none order-0 flex-grow-0`}>Closed</span>
                  </div>
                ) : (
                  <div className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[74px] h-8 bg-[#EEF2FF] ${isCompanyMode ? 'dark:bg-[#121B2B]' : 'dark:bg-[#1C2340]'} border border-[#6366F1] ${isCompanyMode ? 'dark:border-[#4D9CFF]' : 'dark:border-[#818CF8]'} rounded-[24px] flex-none order-0 flex-shrink-0`}>
                    <span className={`w-[42px] h-4 font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[#6366F1] ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'} flex-none order-0 flex-grow-0`}>Active</span>
                  </div>
                )}
              </div>
              {job.is_offer && job.offer_days_left !== undefined && 
               !['Accepted', 'Declined', 'Withdrawn', 'Expired'].includes(job.application_status || '') && (
                <div className="flex flex-row items-center gap-2 h-8">
                  <Icon
                    icon="solar:calendar-linear"
                    className="w-6 h-6 flex-shrink-0"
                    style={{ color: job.offer_days_left <= 5 ? '#FF8D28' : job.offer_days_left <= 15 ? '#FBBF24' : '#6B7280' }}
                  />
                  <span
                    className="font-['Poppins'] font-normal text-sm leading-5 text-center py-1.5"
                    style={{ color: job.offer_days_left <= 5 ? '#FF8D28' : job.offer_days_left <= 15 ? '#FBBF24' : '#6B7280' }}
                  >
                    Offer ends in {job.offer_days_left} {job.offer_days_left === 1 ? 'day' : 'days'}
                  </span>
                </div>
              )}
            </div>
            
            <div 
                className="hidden md:flex flex-row items-center justify-start p-0 gap-[12px] flex-grow flex-shrink-0 min-w-0 w-full sm:w-auto mt-2 sm:mt-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  if (job.recruiter_id) {
                    router.push(`/profile/${job.recruiter_id}`);
                  }
                }}
              >
              <div className="flex">
                {isLoading ? (
                  <div className="relative w-8 h-8 rounded-full border border-[#D1D5DB] flex justify-center items-center flex-shrink-0 animate-pulse bg-indigo-50">
                    <div className="w-4 h-4 rounded-full bg-indigo-200" />
                  </div>
                ) : job.company_logo === 'sphere' ? (
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex justify-center items-center overflow-hidden flex-shrink-0">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
                  </div>
                ) : (job.company_logo || job.recruiter_avatar) && !avatarError ? (
                  <img
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    src={job.company_logo || job.recruiter_avatar || "/assets/profilephoto.png"}
                    onError={() => setAvatarError(true)}
                    alt="Company Logo"
                  />
                ) : (
                  <div className="w-8 h-8 bg-indigo-50 rounded-full flex justify-center items-center flex-shrink-0">
                    <Icon icon="hugeicons:job-search" className="w-4 h-4 text-indigo-500" />
                  </div>
                )}
              </div>
              <div className="flex flex-row items-center gap-1">
                <span className={`text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[14px] font-normal font-['Poppins'] leading-[20px]`}>Posted by</span>
                <div className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[14px] font-semibold font-['Poppins'] leading-[20px] truncate max-w-[150px]`}>{job.company}</div>
              </div>
            </div>

            {/* Mobile View (logo -> title -> company name -> badges) */}
            <div className="flex md:hidden flex-col items-start gap-3 w-full">
              {/* Logo */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  if (job.recruiter_id) router.push(`/profile/${job.recruiter_id}`);
                }}
              >
                {isLoading ? (
                  <div className="relative w-12 h-12 rounded-full border border-[#D1D5DB] flex justify-center items-center flex-shrink-0 animate-pulse bg-indigo-50">
                    <div className="w-6 h-6 rounded-full bg-indigo-200" />
                  </div>
                ) : job.company_logo === 'sphere' ? (
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex justify-center items-center overflow-hidden flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
                  </div>
                ) : (job.company_logo || job.recruiter_avatar) && !avatarError ? (
                  <img
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    src={job.company_logo || job.recruiter_avatar || "/assets/profilephoto.png"}
                    onError={() => setAvatarError(true)}
                    alt="Company Logo"
                  />
                ) : (
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex justify-center items-center flex-shrink-0">
                    <Icon icon="hugeicons:building-03" className="w-6 h-6 text-indigo-500" />
                  </div>
                )}
              </div>

              {/* Title & Badges */}
              <div className="flex flex-col gap-1 w-full">
                <div className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-2xl font-semibold font-['Poppins'] leading-tight`}>
                  {job.title}
                </div>
                <div className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[16px] font-medium font-['Poppins'] leading-[24px]`}>
                  {job.company}
                </div>
              </div>

              {/* Status & Offer indicator */}
              <div className="flex flex-row items-center gap-3 w-full">
                {job.is_closed ? (
                  <div className={`box-border flex justify-center items-center px-4 py-1.5 h-8 bg-[#FEF3C7] ${isCompanyMode ? 'dark:bg-[#4A3A10]' : 'dark:bg-[#4A3A10]'} border border-[#FBBF24] ${isCompanyMode ? 'dark:border-[#FBBF24]' : 'dark:border-[#F59E0B]'} rounded-full`}>
                    <span className={`font-['Poppins'] font-normal text-xs text-[#FBBF24] ${isCompanyMode ? 'dark:text-[#FBBF24]' : 'dark:text-[#F59E0B]'}`}>Closed</span>
                  </div>
                ) : (
                  <div className={`box-border flex justify-center items-center px-4 py-1.5 h-8 bg-[#EEF2FF] ${isCompanyMode ? 'dark:bg-[#121B2B]' : 'dark:bg-[#1C2340]'} border border-[#6366F1] ${isCompanyMode ? 'dark:border-[#4D9CFF]' : 'dark:border-[#818CF8]'} rounded-full`}>
                    <span className={`font-['Poppins'] font-normal text-xs text-[#6366F1] ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'}`}>Active</span>
                  </div>
                )}

                {job.is_offer && job.offer_days_left !== undefined && 
                 !['Accepted', 'Declined', 'Withdrawn', 'Expired'].includes(job.application_status || '') && (
                  <div className="flex flex-row items-center gap-1.5 h-8">
                    <Icon
                      icon="solar:calendar-linear"
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: job.offer_days_left <= 5 ? '#FF8D28' : job.offer_days_left <= 15 ? '#FBBF24' : '#6B7280' }}
                    />
                    <span
                      className="font-['Poppins'] font-normal text-xs"
                      style={{ color: job.offer_days_left <= 5 ? '#FF8D28' : job.offer_days_left <= 15 ? '#FBBF24' : '#6B7280' }}
                    >
                      Offer ends in {job.offer_days_left}d
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Specifications specifications card */}
          <div className={`w-full self-stretch p-4 bg-gray-50 md:bg-white rounded-2xl md:rounded-3xl md:outline md:outline-1 md:outline-offset-[-1px] md:outline-indigo-50 grid grid-cols-2 gap-y-6 gap-x-4 md:flex md:flex-row md:flex-wrap md:gap-4 h-auto mt-2 md:mt-0 ${isCompanyMode ? 'dark:bg-[#16365F] dark:md:bg-[#0F1115] dark:md:outline-[#2A2D35]' : 'dark:bg-[#1C2340] dark:md:bg-[#0B0F19] dark:md:outline-[#2E3445]'}`}>
            {/* Salary Column */}
            <div className="flex-grow flex-shrink-0 flex flex-col justify-center items-start p-0 gap-1.5 md:gap-2 min-w-[120px] h-auto order-1 md:order-4">
              <div className="flex flex-row items-center p-0 gap-1.5 md:gap-2 h-5">
                <Icon icon={getCurrencyIcon(job.salary_currency)} className="w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                <div className={`text-left justify-start text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[11px] md:text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]`}>salary</div>
              </div>
              <div className={`text-left justify-start text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[15px] md:text-[16px] font-medium md:font-normal font-['Poppins'] leading-[20px] md:leading-[24px]`}>
                {job.salary_display
                  ? job.salary_display
                  : (job.salary_min || job.salary_max)
                    ? `${job.salary_min || ''} – ${job.salary_max || ''}`.trim()
                    : 'Salary not disclosed'
                }
              </div>
            </div>
            
            {/* Experience Column */}
            <div className="flex-grow flex-shrink-0 flex flex-col justify-center items-start p-0 gap-1.5 md:gap-2 min-w-[120px] h-auto order-2 md:order-1">
              <div className="flex flex-row items-center p-0 gap-1.5 md:gap-2 h-5">
                <Icon icon="hugeicons:job-search" className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                <div className={`justify-start text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[11px] md:text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]`}>Experience</div>
              </div>
              <div className={`justify-start text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[15px] md:text-[16px] font-medium md:font-normal font-['Poppins'] leading-[20px] md:leading-[24px]`}>{job.experience || '0-2 Yrs'}</div>
            </div>

            {/* Work Mode Column */}
            <div className="flex-grow flex-shrink-0 flex flex-col justify-center items-start p-0 gap-1.5 md:gap-2 min-w-[120px] h-auto order-3 md:order-2">
              <div className="flex flex-row items-center p-0 gap-1.5 md:gap-2 h-5">
                <Icon icon="hugeicons:location-05" className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                <div className={`justify-start text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[11px] md:text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]`}>work mode</div>
              </div>
              <div className={`justify-start text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[15px] md:text-[16px] font-medium md:font-normal font-['Poppins'] leading-[20px] md:leading-[24px]`}>{job.work_mode || 'Hybrid'}</div>
            </div>

            {/* Work Type Column */}
            <div className="flex-grow flex-shrink-0 flex flex-col justify-center items-start p-0 gap-1.5 md:gap-2 min-w-[120px] h-auto order-4 md:order-3">
              <div className="flex flex-row items-center p-0 gap-1.5 md:gap-2 h-5">
                <Icon icon="solar:calendar-linear" className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                <div className={`text-left justify-start text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[11px] md:text-[12px] font-normal font-['Poppins'] uppercase leading-[16px]`}>Work type</div>
              </div>
              <div className={`text-left justify-start text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[15px] md:text-[16px] font-medium md:font-normal font-['Poppins'] leading-[20px] md:leading-[24px]`}>{job.job_type || 'Full Time'}</div>
            </div>
          </div>

          {/* AI Matching strength bar */}
          <div className={`w-full h-auto py-[12px] px-[16px] bg-[#F9FAFF] ${isCompanyMode ? 'dark:bg-[#16365F]' : 'dark:bg-[#1C2340]'} rounded-[12px] self-stretch flex flex-row items-center gap-[10px]`}>
            <img src="/assets/AI 2.svg" className="w-5 h-5 flex-shrink-0" alt="AI Icon" />
            <div className={`flex-1 flex items-center text-[#6366F1] ${isCompanyMode ? 'dark:text-[#82B8FF]' : 'dark:text-[#818CF8]'} text-[14px] font-normal font-['Poppins'] leading-5`}>
              You&apos;re stronger than 90% of applicants for this job based on your profile and skills
            </div>
          </div>

          {/* Recruiter Note for Offers, Application Status, or Company Analytics Box */}
          {job.is_offer ? (
            job.recruiter_message ? (
              <div className={`box-border w-full max-w-full min-h-[104px] bg-[#F9FAFF] ${isCompanyMode ? 'dark:bg-[#16365F]' : 'dark:bg-[#1C2340]'} border-l-2 border-l-[#6366F1] ${isCompanyMode ? 'dark:border-l-[#4D9CFF]' : 'dark:border-l-[#818CF8]'} rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px] rounded-tl-none py-3 px-4 flex flex-col justify-start items-start gap-2 self-stretch`}>
                {/* Recruiter / Company Info Row */}
                <div className="flex flex-row justify-start items-center p-0 gap-2 h-10 w-full">
                  {job.org_id ? (
                    job.company_logo === 'sphere' ? (
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex justify-center items-center overflow-hidden flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
                      </div>
                    ) : job.company_logo ? (
                      <img
                        src={job.company_logo}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        alt={job.company || 'Company'}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#6366F1] flex-shrink-0">
                        <Icon icon="hugeicons:building-03" className="w-5 h-5" />
                      </div>
                    )
                  ) : job.recruiter_avatar ? (
                    <img
                      src={job.recruiter_avatar}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      alt={job.recruiter_name || 'Recruiter'}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#6366F1] flex-shrink-0">
                      <Icon icon="solar:user-bold" className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center items-start gap-1">
                    {job.org_id ? (
                      <div className="text-left font-['Poppins'] font-semibold text-[12px] leading-[16px] text-[#6366F1] uppercase">
                        {job.company}
                      </div>
                    ) : (
                      <>
                        {job.recruiter_name && (
                          <div className="text-left font-['Poppins'] font-semibold text-[12px] leading-[16px] text-[#6366F1] uppercase">
                            {job.recruiter_name}
                          </div>
                        )}
                        {job.recruiter_title && (
                          <div className="text-left font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6366F1] uppercase">
                            {job.recruiter_title}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Message text row */}
                <div className={`w-full max-w-full text-left font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`}>
                  &ldquo;{job.recruiter_message}&rdquo;
                </div>
              </div>
            ) : null
          ) : job.is_applied ? (
            <div className={`box-border w-full bg-[#FFFFFF] ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} border border-[#EEF2FF] ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} rounded-[28px] self-stretch p-4 flex flex-col items-start gap-4 h-auto`}>
              <div className={`text-left text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[16px] font-medium font-['Poppins'] leading-6`}>
                Application status
              </div>
              <div className="w-full flex flex-col md:flex-row md:flex-wrap justify-start md:justify-center items-start md:items-center p-0 self-stretch gap-0 h-auto">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  let circleClass = '';
                  let textClass = '';

                  if (step === 'Declined' && isCurrent) {
                    circleClass = 'bg-transparent border border-[#EF4444]';
                    textClass = 'text-[#EF4444]';
                  } else if (isCompleted || isCurrent) {
                    circleClass = isCompleted ? 'bg-[#6366F1] border border-[#6366F1]' : 'bg-transparent border border-[#6366F1]';
                    textClass = 'text-[#6366F1]';
                  } else {
                    circleClass = 'bg-transparent border border-[#DADADA]';
                    textClass = 'text-[#6B7280]';
                  }

                  return (
                    <div key={step} className="flex flex-col items-start md:items-center w-full md:w-auto">
                      <div className="flex flex-row items-center gap-0 w-full md:w-auto">
                        {/* Step Frame */}
                        <div className="box-border flex flex-row items-center py-2 px-0 md:px-4 gap-[8px] md:gap-[10px] w-auto h-9 rounded-[24px] flex-none">
                          <div className={`box-border w-4 h-4 rounded-full flex-none ${circleClass}`} />
                          <span className={`w-fit h-5 font-['Poppins'] font-normal text-sm leading-5 text-center ${textClass}`}>
                            {stepLabels[step] || step}
                          </span>
                        </div>

                        {/* Connector Line Desktop */}
                        {idx < steps.length - 1 && (
                          <div
                            className={`hidden md:block w-[60px] h-[1px] self-center flex-none ${idx < currentStepIndex ? 'bg-[#6366F1]' : 'bg-[#DADADA]'
                              }`}
                          />
                        )}
                      </div>
                      
                      {/* Connector Line Mobile */}
                      {idx < steps.length - 1 && (
                        <div
                          className={`md:hidden w-[1px] h-6 ml-[7px] ${idx < currentStepIndex ? 'bg-[#6366F1]' : 'bg-[#DADADA]'}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`box-border w-full bg-[#FFFFFF] ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} border border-[#EEF2FF] ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} rounded-[28px] self-stretch p-4 flex flex-col items-start gap-4 h-auto`}>
              <div className={`text-left text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[16px] font-medium font-['Poppins'] leading-6`}>Company analytics</div>

              {!job.response_rate || !job.avg_reply ? (
                <div className="flex flex-col items-start p-0 gap-4 w-full h-auto">
                  <div className="flex flex-row items-center p-0 gap-2 w-fit h-5 flex-none">
                    <Icon icon="proicons:info" className={`w-5 h-5 text-[#FBBF24] ${isCompanyMode ? 'dark:text-[#FBBF24]' : 'dark:text-[#F59E0B]'} flex-none`} />
                    <span className={`h-5 font-['Poppins'] font-normal text-sm leading-5 flex items-center text-[#FBBF24] ${isCompanyMode ? 'dark:text-[#FBBF24]' : 'dark:text-[#F59E0B]'} flex-none`}>
                      Response data unavailable
                    </span>
                  </div>
                  <div className={`w-full font-['Poppins'] font-normal text-sm leading-5 flex items-center text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} self-stretch`}>
                    We don&apos;t have enough application data to calculate this company&apos;s response or reply rate yet.
                  </div>
                </div>
              ) : (
                <>
                  {/* Stats/analytics row */}
                  <div className="w-full flex flex-row flex-wrap items-start py-2 gap-8 md:gap-[340px] h-auto">
                    {/* Response Rate Column */}
                    <div className="box-border flex flex-col items-start pb-3 gap-2 w-[120px] h-auto">
                      <div className={`text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[10px] font-semibold uppercase tracking-wider font-['Poppins'] leading-[14px]`}>RESPONSE RATE</div>
                      <div className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[24px] font-bold font-['Poppins'] leading-8`}>{job.response_rate}</div>
                      {/* Progress Bar */}
                      <div className="w-full h-[2px] bg-gray-200 mt-1 relative rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-[#22C55E] rounded-full"
                          style={{ width: job.response_rate || '0%' }}
                        />
                      </div>
                    </div>

                    {/* Avg Reply Column */}
                    <div className="flex flex-col items-start gap-1 h-auto">
                      <div className={`text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[10px] font-semibold uppercase tracking-wider font-['Poppins'] leading-[14px]`}>AVG. REPLY</div>
                      <div className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[24px] font-bold font-['Poppins'] leading-8`}>{job.avg_reply}</div>
                      <div className={`text-[#6366F1] ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'} text-[10px] font-medium font-['Poppins'] leading-[14px]`}>Very fast</div>
                    </div>
                  </div>

                  {/* Footer text */}
                  <div className={`text-left text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[14px] font-normal font-['Poppins'] leading-[20px] w-full max-w-sm h-auto`}>
                    {job.company} usually views applications within 24 hours of submission.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Description Section */}
          <div className="w-full self-stretch flex flex-col items-start p-0 gap-4">
            <div className={`text-left text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[18px] font-medium font-['Poppins'] leading-[26px]`}>Description</div>
            <div className="self-stretch flex-1 justify-start">
              <div className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[16px] font-normal font-['Poppins'] leading-[24px] whitespace-pre-line ${!showFullDesc ? 'line-clamp-5' : ''}`}>
                {job.description}
              </div>

              {showFullDesc && job.requirements && job.requirements.length > 0 && (
                <div className="mt-4 animate-in fade-in duration-200">
                  <span className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[16px] font-semibold font-['Poppins'] leading-[24px] block`}>
                    Key Responsibilities
                  </span>
                  <div className={`text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[16px] font-normal font-['Poppins'] leading-[24px] mt-2 flex flex-col gap-1`}>
                    {job.requirements.map((req, i) => (
                      <span key={i} className="block">
                        • {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className={`text-center justify-start text-indigo-500 ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'} text-sm font-normal font-['Poppins'] leading-5 hover:underline`}
            >
              {showFullDesc ? 'See less' : 'See more'}
            </button>
          </div>

          {/* Map Location Section */}
          <div className="self-stretch flex flex-col justify-start items-start gap-4 mt-4 w-full">
            <div className={`self-stretch h-60 rounded-3xl border-4 border-indigo-50 ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} overflow-hidden relative w-full`}>
              <JobDetailMap location={job.location || ''} />
            </div>

            <a 
              href={job.location ? `https://maps.google.com/maps?q=${encodeURIComponent(job.location)}` : '#'}
              target={job.location ? "_blank" : undefined}
              rel={job.location ? "noopener noreferrer" : undefined}
              className="self-stretch inline-flex justify-start items-center gap-2 cursor-pointer group"
            >
              <Icon icon="solar:map-point-linear" className={`w-5 h-5 text-gray-400 group-hover:text-indigo-500 ${isCompanyMode ? 'dark:group-hover:text-[#4D9CFF]' : 'dark:group-hover:text-[#818CF8]'} flex-shrink-0 mt-0.5 transition-colors`} />
              <div className={`flex-1 justify-start text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} group-hover:text-indigo-500 ${isCompanyMode ? 'dark:group-hover:text-[#4D9CFF]' : 'dark:group-hover:text-[#818CF8]'} text-sm font-normal font-['Poppins'] leading-5 transition-colors`}>
                {job.location || 'Location not specified'}
              </div>
            </a>
          </div>

        </div>

        {/* Bottom Floating Bar */}
        {/* Bottom Floating Bar */}
        <div className={`sticky bottom-[72px] md:bottom-6 z-50 self-stretch p-4 bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} md:rounded-3xl rounded-[24px] shadow-[0px_4px_16px_rgba(99,102,241,0.08)] outline outline-1 outline-offset-[-1px] outline-indigo-50 ${isCompanyMode ? 'dark:outline-[#2A2D35]' : 'dark:outline-[#2E3445]'} flex flex-row justify-between items-center gap-4 w-full h-auto`}>
          {/* Left Text Block - Hidden on mobile */}
          <div className="hidden md:flex flex-1 flex-col justify-center items-start min-w-0">
            <div className={`text-left text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-base md:text-lg font-medium font-['Poppins'] leading-6 truncate w-full`}>{job.title}</div>
            <div className="self-stretch inline-flex justify-start items-center gap-2 mt-1">
              <div className={`justify-start text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-xs font-normal font-['Poppins'] leading-4 truncate`}>{job.company}</div>
              <div className="size-1.5 bg-gray-500 rounded-full flex-shrink-0" />
              <div className={`justify-start text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-xs font-normal font-['Poppins'] leading-4 truncate`}>{job.location}</div>
            </div>
          </div>
          <div className="flex flex-row flex-1 md:flex-none items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto">
            {!job.is_offer && (
              <div className="flex justify-start items-center gap-4">
                {/* Share button */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className={`size-10 rounded-full bg-slate-50 ${isCompanyMode ? 'dark:bg-[#2A2D35]' : 'dark:bg-[#2E3445]'} text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} hover:text-indigo-500 ${isCompanyMode ? 'dark:hover:text-[#4D9CFF]' : 'dark:hover:text-[#818CF8]'} hover:bg-slate-100 ${isCompanyMode ? 'dark:hover:bg-[#121B2B]' : 'dark:hover:bg-[#1C2340]'} transition-colors flex items-center justify-center flex-shrink-0`}
                >
                  <Icon icon="solar:share-linear" className="w-5 h-5" />
                </button>
                {/* Bookmark button */}
                <button
                  onClick={toggleSave}
                  className={`size-10 rounded-full bg-slate-50 ${isCompanyMode ? 'dark:bg-[#2A2D35]' : 'dark:bg-[#2E3445]'} transition-colors flex items-center justify-center flex-shrink-0`}
                >
                  <Icon
                    icon={job.is_saved ? 'solar:bookmark-bold' : 'solar:bookmark-linear'}
                    className={`w-5 h-5 ${job.is_saved ? (isCompanyMode ? 'text-[#4D9CFF] dark:text-[#4D9CFF]' : 'text-[#6366F1] dark:text-[#818CF8]') : `text-black ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} hover:text-indigo-500 ${isCompanyMode ? 'dark:hover:text-[#4D9CFF]' : 'dark:hover:text-[#818CF8]'}`}`}
                  />
                </button>
              </div>
            )}
            {/* Action buttons section */}
            <div className="flex-1 sm:flex-none flex justify-end items-center gap-3">
              {job.is_offer ? (
                /* Offer state */
                job.application_status === 'Accepted' ? (
                  /* Accepted -> Chat */
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
                    className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-full sm:w-[140px] h-10 bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} border border-white ${isCompanyMode ? 'dark:border-[#0F1115]' : 'dark:border-[#0B0F19]'} rounded-[24px] transition-all active:scale-95 cursor-pointer`}
                  >
                    <span className="w-[68px] h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-white">Chat</span>
                  </button>
                ) : job.application_status === 'Declined' ? (
                  /* Declined -> Offer declined */
                  <div className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-full sm:w-[140px] h-10 rounded-[24px]">
                    <span className="w-[99px] h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-[#6B7280]">
                      Offer declined
                    </span>
                  </div>
                ) : job.application_status === 'Withdrawn' ? (
                  /* Withdrawn -> Offer withdrawn */
                  <div className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-full sm:w-[140px] h-10 rounded-[24px]">
                    <span className="font-['Poppins'] font-normal text-sm leading-[20px] text-center text-[#EF4444]">
                      Offer withdrawn
                    </span>
                  </div>
                ) : job.application_status === 'Expired' ? (
                  /* Expired -> Offer expired */
                  <div className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-full sm:w-[140px] h-10 rounded-[24px]">
                    <span className="font-['Poppins'] font-normal text-sm leading-[20px] text-center text-[#EF4444]">
                      Offer expired
                    </span>
                  </div>
                ) : (
                  /* Pending -> Accept & Decline buttons */
                  <div className="flex flex-row items-center p-0 gap-2 w-full sm:w-[288px] h-10">
                    <button
                      onClick={() => setShowDeclineConfirm(true)}
                      className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] flex-1 sm:w-[140px] h-10 bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} border border-[#818CF8] ${isCompanyMode ? 'dark:border-[#4D9CFF]' : 'dark:border-[#818CF8]'} rounded-[24px] transition-all active:scale-95 cursor-pointer`}
                    >
                      <span className={`w-auto h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-[#818CF8] ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'}`}>Decline</span>
                    </button>
                    <button
                      onClick={() => respondToOffer('accept')}
                      className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] flex-1 sm:w-[140px] h-10 bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} border border-white ${isCompanyMode ? 'dark:border-[#0F1115]' : 'dark:border-[#0B0F19]'} rounded-[24px] transition-all active:scale-95 cursor-pointer`}
                    >
                      <span className="w-auto h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-white">Accept</span>
                    </button>
                  </div>
                )
              ) : job.application_status === 'Rejected' ? (
                /* Rejected — no further action available */
                <div className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-full sm:w-[160px] h-10 rounded-[24px]">
                  <span className="font-['Poppins'] font-normal text-sm leading-[20px] text-center text-[#6B7280]">
                    Application Rejected
                  </span>
                </div>
              ) : (
                <div className="flex-1 md:flex-none flex justify-end items-center gap-3 w-full">
                  {/* Apply Button */}
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
                      className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-full sm:w-[140px] h-10 bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} border border-white ${isCompanyMode ? 'dark:border-[#0F1115]' : 'dark:border-[#0B0F19]'} rounded-[24px] transition-all active:scale-95 cursor-pointer`}
                    >
                      <span className="w-auto h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-white">Chat</span>
                    </button>
                  ) : job.is_closed ? (
                    <div className="box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-full sm:w-[160px] h-10 rounded-[24px]">
                      <span className="font-['Poppins'] font-medium text-sm leading-[20px] text-center text-[#EF4444]">
                        Job No Longer Available
                      </span>
                    </div>
                  ) : job.is_applied ? (
                    <button
                      onClick={() => setShowWithdrawConfirm(true)}
                      className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-full sm:w-[140px] h-10 bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#0B0F19]'} border border-[#818CF8] ${isCompanyMode ? 'dark:border-[#4D9CFF]' : 'dark:border-[#818CF8]'} rounded-[24px] transition-all active:scale-95 cursor-pointer`}
                    >
                      <span className={`w-[68px] h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-[#818CF8] ${isCompanyMode ? 'dark:text-[#4D9CFF]' : 'dark:text-[#818CF8]'}`}>Withdraw</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-full sm:w-[140px] h-10 bg-[#6366F1] ${isCompanyMode ? 'dark:bg-[#4D9CFF]' : 'dark:bg-[#818CF8]'} border border-white ${isCompanyMode ? 'dark:border-[#0F1115]' : 'dark:border-[#0B0F19]'} rounded-[24px] transition-all active:scale-95 cursor-pointer`}
                    >
                      <span className="w-auto h-5 font-['Poppins'] font-normal text-sm leading-[20px] text-center text-white">
                        Apply
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apply Job Modal */}
        <ApplyJobModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          onApply={(resumeUrl, uploadedFile, resumeId, coverLetter) => {
            applyToJob(resumeUrl, uploadedFile, resumeId, coverLetter);
            setShowApplyModal(false);
          }}
          jobTitle={job.title}
        />

        {/* Withdraw Confirmation Modal */}
        <CocpitConfirmBox
          isOpen={showWithdrawConfirm}
          title="Are you sure you want to withdraw your application?"
          message="This cannot be undone"
          confirmText="Withdraw"
          cancelText="Cancel"
          onConfirm={() => {
            withdrawJob();
            setShowWithdrawConfirm(false);
          }}
          onCancel={() => setShowWithdrawConfirm(false)}
        />

        {/* Share Modal */}
        <CocpitShareModel
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />

        {/* Decline Offer Confirmation Modal */}
        <CocpitConfirmBox
          isOpen={showDeclineConfirm}
          title="Are you sure you want to decline this offer?"
          message="This cannot be undone"
          confirmText="Decline"
          cancelText="Cancel"
          onConfirm={() => {
            respondToOffer('decline');
            setShowDeclineConfirm(false);
          }}
          onCancel={() => setShowDeclineConfirm(false)}
        />

      </div>
    </div>
  );
};

export default JobDetailPage;
