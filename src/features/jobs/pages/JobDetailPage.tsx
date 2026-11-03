import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJobDetail } from '../hooks/useJobDetail';
import { Icon } from '@iconify/react';
import { useSmartBack } from '@/hooks/use-smart-back';
import { getCurrencyIcon } from '../utils/currency.utils';
import { ApplyJobModal } from '../components/modals/ApplyJobModal';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';
import CocpitShareModel from '@/shared/commonComponents/cocpitsharemodel';
import { ExternalLink, Loader2 } from 'lucide-react';
import JobDetailSkeleton from '../components/skeletons/JobDetailSkeleton';
import { JobUnavailableScreen } from '../components/states/JobUnavailableScreen';
import Avatar from '@/components/shared/Avatar';
import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { FeatureDisabledTooltip } from '@/components/feature-flags';
import InteractiveLocationMap from '@/features/company-onboarding/components/InteractiveLocationMap';
import {
  CalendarIcon,
  CyphexAIIcon,
  LocationIcon,
  GoogleIcon,
  ShareIcon,
  SaveIcon,
  SaveFilledIcon,
  UserIcon,
  BusinessBuildingIcon,
  LeftArrowIcon,
  JobExperienceIcon,
  WorkModeIcon,
  BriefcaseIcon,
  IndianRupeeIcon,
} from '@/components/icons';

const getGoogleMapsUrl = (
  locationQuery?: string,
  latitude?: number | string | null,
  longitude?: number | string | null,
  customUrl?: string
): string | null => {
  if (customUrl && (customUrl.startsWith('http://') || customUrl.startsWith('https://'))) {
    return customUrl;
  }
  const hasCoords =
    latitude != null &&
    longitude != null &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude)) &&
    Number(latitude) !== 0 &&
    Number(longitude) !== 0;

  const query =
    (locationQuery && locationQuery.trim()) ||
    (hasCoords ? `${latitude},${longitude}` : '');

  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};


interface JobDetailPageProps {
  jobId: string;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ jobId }) => {
  const {
    job,
    isLoading,
    isFollowLoading,
    toggleSave,
    applyToJob,
    withdrawJob,
    respondToOffer,
    toggleFollow,
  } = useJobDetail(jobId);
  const { flags } = useFeatureFlags();
  const { goBack } = useSmartBack();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const handleBack = () => {
    if (returnTo) {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push(returnTo);
      }
      return;
    }
    goBack('/jobs');
  };

  const [showFullDesc, setShowFullDesc] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [recruiterAvatarError, setRecruiterAvatarError] = useState(false);
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
    return <JobUnavailableScreen onBack={handleBack} />;
  }

  const jobAny = job as any;
  const jobLat = jobAny?.latitude != null ? Number(jobAny.latitude) : null;
  const jobLng = jobAny?.longitude != null ? Number(jobAny.longitude) : null;
  const mapUrl = getGoogleMapsUrl(
    job.location,
    jobLat,
    jobLng,
    jobAny?.map_url || jobAny?.mapUrl
  );

  const { steps, activeStep } = useMemo(() => {
    const normalized = (job.application_status || 'Applied').toLowerCase();
    const isDeclinedStatus = ['declined', 'rejected', 'withdrawn'].includes(normalized);

    if (isDeclinedStatus) {
      return {
        steps: ['Applied', 'In review', 'Declined'] as const,
        activeStep: 2,
      };
    }

    let stepIdx = 0;
    if (normalized === 'in-review' || normalized === 'in review') stepIdx = 1;
    else if (['shortlisted', 'interview', 'offer', 'accepted', 'approved'].includes(normalized)) stepIdx = 2;

    return {
      steps: ['Applied', 'In review', 'Shortlisted'] as const,
      activeStep: stepIdx,
    };
  }, [job.application_status]);
  const isJobCompany = Boolean(job.org_id || job.company_id || job.company_type === 'COMPANY' || job.company_type === 'ORGANIZATION');

  const navigateToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams();
    if (job.org_id) params.set('companyId', job.org_id);
    else if (job.recruiter_id) params.set('userId', job.recruiter_id);
    if (job.offer_id) params.set('offerContext', job.offer_id);
    else if (job.id) params.set('jobContext', job.id);
    router.push(`/messaging?${params.toString()}`);
  };

  // Candidate application and offer status flags
  const isAccepted = job.application_status === 'Accepted' || job.offerStatus === 'accepted';
  const isDeclined = job.application_status === 'Declined' || job.application_status === 'Rejected' || job.offerStatus === 'declined';
  const isWithdrawn = job.application_status === 'Withdrawn' || job.offerStatus === 'withdrawn';
  const isExpired = job.application_status === 'Expired' || job.offerStatus === 'expired';
  const isShortlisted = job.application_status?.toLowerCase() === 'shortlisted';
  const isTerminalOffer = Boolean(job.is_offer && (isDeclined || isWithdrawn || isExpired));

  // Share & Bookmark visibility rules based on Figma:
  // - Share icon: Visible ONLY for standard active jobs (Apply now / Withdraw). Hidden for closed jobs and offers.
  // - Bookmark/Save icon: Visible for standard active jobs, pending offers (Accept / Decline), and closed jobs (Follow / Unfollow)
  // - Both icons hidden for chat states (Chat now), terminal offer states (expired/declined), and rejected jobs
  const showShare = !job.is_offer && !job.is_closed && job.application_status !== 'Rejected' && !isShortlisted && !isAccepted;
  const showSave = (
    job.application_status !== 'Rejected' &&
    !isShortlisted &&
    !isAccepted &&
    !isTerminalOffer &&
    flags?.saved_jobs !== false
  );

  const renderBottomBarActions = () => {
    // Closed jobs: Recruitment pipeline is ended.
    // Display Follow/Unfollow company/recruiter per Figma design and industry standards.
    if (job.is_closed) {
      return (
        <button
          onClick={toggleFollow}
          disabled={isFollowLoading}
          type="button"
          className="h-9 px-4 min-w-[96px] rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none outline-none disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isFollowLoading ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-ds-text-primary" />
          ) : (
            job.is_followed ? 'Unfollow' : 'Follow'
          )}
        </button>
      );
    }

    if (job.is_offer) {
      if (isAccepted) {
        return (
          <button
            onClick={navigateToChat}
            type="button"
            className="h-9 px-4 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none"
          >
            Chat now
          </button>
        );
      }
      if (isDeclined) {
        return (
          <span className="text-ds-text-muted ds-text-small px-3 py-1.5 text-center flex items-center">
            Offer declined
          </span>
        );
      }
      if (isWithdrawn) {
        return (
          <span className="text-ds-error ds-text-small px-3 py-1.5 text-center flex items-center">
            Offer withdrawn
          </span>
        );
      }
      if (isExpired) {
        return (
          <span className="text-ds-error ds-text-small px-3 py-1.5 text-center flex items-center">
            Offer expired
          </span>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => respondToOffer('accept')}
            type="button"
            className="h-9 px-4 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none"
          >
            Accept
          </button>
          <button
            onClick={() => setShowDeclineConfirm(true)}
            type="button"
            className="h-9 px-4 rounded-full border border-ds-border hover:bg-ds-surface-1/50 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all flex items-center justify-center cursor-pointer outline-none"
          >
            Decline
          </button>
        </div>
      );
    }

    if (isDeclined) {
      return (
        <span className="text-ds-text-muted ds-text-small px-4 py-1.5 border border-ds-border rounded-full">
          Application Declined
        </span>
      );
    }

    if (isShortlisted) {
      return (
        <button
          onClick={navigateToChat}
          type="button"
          className="h-9 px-4 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none"
        >
          Chat now
        </button>
      );
    }

    if (job.is_applied) {
      return (
        <button
          onClick={() => setShowWithdrawConfirm(true)}
          type="button"
          className="h-9 px-4 rounded-full border border-ds-border hover:bg-ds-surface-1/50 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all cursor-pointer outline-none"
        >
          Withdraw
        </button>
      );
    }

    return (
      <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
        <button
          onClick={() => setShowApplyModal(true)}
          type="button"
          className="w-[104px] h-[36px] rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary ds-text-body-1 shadow-sm flex items-center justify-center cursor-pointer transition-all border-none outline-none whitespace-nowrap"
        >
          Apply now
        </button>
      </FeatureDisabledTooltip>
    );
  };

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans relative selection:bg-ds-accent/30 selection:text-ds-text-primary">
      {/* Fixed Top-Left Back Button (top: 40px, left: 40px matching Figma) */}
      <button
        onClick={handleBack}
        type="button"
        aria-label="Back"
        className="fixed top-[40px] left-[40px] z-50 inline-flex items-center gap-2 p-0 text-ds-text-primary text-base font-medium font-dm-sans leading-6 cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
        <span>Back</span>
      </button>

      {/* Main 768px Centered Column (Figma: top-[60px], centered w-[768px]) */}
      <div className="w-full max-w-[768px] mx-auto pt-14 sm:pt-[60px] pb-28 px-4 sm:px-0 flex flex-col gap-5 animate-in fade-in duration-300">

        {/* Job Header & Metadata */}
        <div className="w-full flex flex-col justify-start items-start gap-3">
          {/* Job Title */}
          <h1 className="w-full text-[40px] leading-[48px] font-bold font-dm-sans text-ds-text-primary">
            {job.title}
          </h1>

          {/* Posted By & Active Status Badge */}
          <div className="w-full flex justify-between items-center gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => {
                if (job.org_id) {
                  router.push(`/company/${job.org_id}`);
                } else if (job.recruiter_id) {
                  const returnUrl = typeof window !== "undefined" ? (window.location.pathname + window.location.search) : "/jobs";
                  router.push(`/profile/${job.recruiter_id}?source=jobs&returnTo=${encodeURIComponent(returnUrl)}`);
                }
              }}
            >
              {/* Org (Square / rounded-lg with BusinessBuildingIcon fallback) vs User (Circle / rounded-full with UserIcon fallback) */}
              {job.org_id ? (
                <div className="size-8 rounded-lg overflow-hidden shrink-0 bg-ds-surface-2 border border-ds-border flex items-center justify-center">
                  {job.company_logo && !avatarError ? (
                    <img
                      src={job.company_logo}
                      alt={job.company || 'Company'}
                      className="size-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <BriefcaseIcon className="w-[60%] h-[60%] text-ds-text-primary" />
                  )}
                </div>
              ) : (
                <div className="size-8 rounded-full overflow-hidden shrink-0 bg-ds-surface-2 flex items-center justify-center">
                  {(job.recruiter_avatar || job.company_logo) && !avatarError ? (
                    <img
                      src={job.recruiter_avatar || job.company_logo}
                      alt={job.recruiter_name || job.company || 'Recruiter'}
                      className="size-full object-cover rounded-full"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <BriefcaseIcon className="w-[60%] h-[60%] text-ds-text-primary" />
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs font-normal font-dm-sans leading-4">
                <span className="text-ds-text-secondary">Posted by</span>
                <span className="text-ds-text-primary font-medium text-sm leading-5 group-hover:text-ds-accent transition-colors">
                  {job.org_id ? (job.company || 'Company') : (job.recruiter_name || job.company || 'Recruiter')}
                </span>
              </div>
            </div>

            {/* Status Badge (Frame 2608515 matching Figma) */}
            {job.is_closed ? (
              <div className="w-[66px] h-[32px] px-4 py-2 bg-ds-surface-1 border border-ds-warning rounded-[24px] flex items-center justify-center shrink-0 box-border">
                <span className="font-dm-sans font-normal text-xs leading-4 text-center text-ds-warning">
                  Close
                </span>
              </div>
            ) : (
              <div className="w-[69px] h-[32px] px-4 py-2 bg-ds-surface-1 border border-ds-success rounded-[24px] flex items-center justify-center shrink-0 box-border">
                <span className="font-dm-sans font-normal text-xs leading-4 text-center text-ds-success">
                  Active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4-Column Specifications Row (seamless without outer border matching Figma) */}
        <div className="w-full py-2 bg-transparent grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-4">
          {/* Experience */}
          <div className="flex-1 flex flex-col justify-center items-start gap-1.5">
            <div className="flex items-center gap-2 text-ds-text-muted">
              <JobExperienceIcon size={20} className="w-5 h-5 text-ds-text-muted shrink-0" />
              <span className="text-ds-text-muted text-xs font-normal font-dm-sans leading-4">Experience</span>
            </div>
            <div className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
              {job.experience || '0-2 Yrs'}
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-ds-border self-center shrink-0" />

          {/* Work mode */}
          <div className="flex-1 flex flex-col justify-center items-start gap-1.5">
            <div className="flex items-center gap-2 text-ds-text-muted">
              <LocationIcon size={20} className="w-5 h-5 text-ds-text-muted shrink-0" />
              <span className="text-ds-text-muted text-xs font-normal font-dm-sans leading-4">Work mode</span>
            </div>
            <div className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
              {job.work_mode || 'Hybrid'}
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-ds-border self-center shrink-0" />

          {/* Work type */}
          <div className="flex-1 flex flex-col justify-center items-start gap-1.5">
            <div className="flex items-center gap-2 text-ds-text-muted">
              <CalendarIcon size={20} className="w-5 h-5 text-ds-text-muted shrink-0 flex-none order-0 grow-0" />
              <span className="text-ds-text-muted text-xs font-normal font-dm-sans leading-4">Work type</span>
            </div>
            <div className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
              {job.job_type || 'Full Time'}
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-ds-border self-center shrink-0" />

          {/* Salary */}
          <div className="flex-1 flex flex-col justify-center items-start gap-1.5">
            <div className="flex items-center gap-2 text-ds-text-muted">
              <IndianRupeeIcon size={20} className="w-5 h-5 text-ds-text-muted shrink-0" />
              <span className="text-ds-text-muted text-xs font-normal font-dm-sans leading-4">Salary</span>
            </div>
            <div className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
              {(() => {
                if (job.salary_display) {
                  return job.salary_display.replace(/[\$₹]/g, '').trim();
                }
                if (job.salary_min && job.salary_max) {
                  return `${Number(job.salary_min).toLocaleString()} - ${Number(job.salary_max).toLocaleString()}`;
                }
                if (job.salary_min) {
                  return `${Number(job.salary_min).toLocaleString()}+`;
                }
                if (job.salary_max) {
                  return `Up to ${Number(job.salary_max).toLocaleString()}`;
                }
                return 'Undisclosed';
              })()}
            </div>
          </div>
        </div>

        {/* Profile Match Banner (Figma tooltip spec: 768px, h:36px, var(--ds-surface-1), var(--ds-border), 20px gap) */}
        <div className="w-full min-h-9 p-2 bg-ds-surface-1 border border-ds-border rounded-lg flex items-center gap-2.5 self-stretch flex-none box-border">
          <CyphexAIIcon size={20} className="w-5 h-5 text-ds-accent shrink-0 flex-none order-0 grow-0" />
          <span className="text-ds-accent ds-text-small flex items-center flex-1 order-1">
            You&apos;re stronger than {job.match_score ?? 90}% of applicants for this job based on your profile and skills
          </span>
        </div>

        {/* Offer Recruiter Note (Figma Frame 2609030: w:700px, min-h:84px, p:12px, gap:8px, bg:var(--ds-surface-1), border-l:2px var(--ds-accent), rounded: 0 16px 16px 16px) */}
        {job.is_offer && job.recruiter_message && (
          <div className="w-full max-w-[700px] min-h-[84px] p-3 bg-ds-surface-1 border-l-2 border-ds-accent rounded-r-2xl rounded-bl-2xl rounded-tl-none flex flex-col items-start gap-2 self-stretch flex-none box-border">
            {/* Frame 2609968: Recruiter Info Header */}
            <div className="flex items-center gap-2 h-9">
              {/* Rectangle 29: Avatar (32px x 32px, rounded-full) */}
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 flex-none bg-ds-surface-2">
                {job.recruiter_avatar && !recruiterAvatarError ? (
                  <img
                    src={job.recruiter_avatar}
                    alt={job.recruiter_name || job.company || 'Recruiter'}
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setRecruiterAvatarError(true)}
                  />
                ) : (
                  <UserIcon className="w-full h-full p-1.5 text-ds-text-primary" />
                )}
              </div>
              {/* Frame 2609931: Recruiter Name & Title */}
              <div className="flex flex-col items-start justify-center h-9">
                <span className="font-dm-sans font-semibold text-base leading-6 text-ds-text-primary">
                  {job.recruiter_name || job.company}
                </span>
                <span className="font-dm-sans font-normal text-[10px] leading-3 text-ds-text-secondary">
                  {job.recruiter_title || (job.company ? `Recruiter at ${job.company}` : 'Hiring Team')}
                </span>
              </div>
            </div>

            {/* Recruiter Message Body */}
            <p className="font-dm-sans font-normal text-xs leading-4 text-ds-text-secondary self-stretch m-0">
              {job.recruiter_message}
            </p>
          </div>
        )}

        {/* Application Status Tracker (if applied) */}
        {job.is_applied && (
          <div className="w-full max-w-[768px] rounded-2xl border border-ds-border py-5 px-4 flex flex-col items-start gap-4 self-stretch flex-none box-border">
            <h3 className="font-dm-sans text-base font-medium leading-6 text-ds-text-primary m-0">
              Application status
            </h3>

            {/* Frame 2609079: Steps Track (w: 736px, h: 36px) */}
            <div className="w-full flex items-center h-9 self-stretch flex-none overflow-x-auto no-scrollbar">
              {steps.map((step, idx) => {
                const isCompleted = idx < activeStep || (idx === 0 && activeStep === 0);
                const isCurrent = idx === activeStep && idx !== 0;
                const isActive = idx <= activeStep;

                // Ellipse 30 (16px x 16px) using newGlobal.css tokens
                let dotClass = 'bg-ds-text-primary border border-ds-text-secondary';
                if (isCompleted) {
                  dotClass = 'bg-ds-accent border border-ds-accent';
                } else if (isCurrent) {
                  dotClass = 'bg-ds-text-primary border border-ds-accent';
                }

                // Poppins 14px 400 text
                const textClass = isActive ? 'text-ds-accent' : 'text-ds-text-secondary';

                // Line 164/165/166
                const lineClass = idx < activeStep ? 'border-ds-accent' : 'border-ds-text-secondary';

                return (
                  <React.Fragment key={step}>
                    {/* Step Pill (Frame 2608617 / 2608621 / 2608622 / 2608623) */}
                    <div className="flex items-center gap-2.5 px-4 py-2 h-9 rounded-[24px] shrink-0 box-border">
                      <div className={`w-4 h-4 rounded-full shrink-0 box-border ${dotClass}`} />
                      <span className={`font-poppins text-sm font-normal leading-5 text-center whitespace-nowrap ${textClass}`}>
                        {step}
                      </span>
                    </div>

                    {/* Connecting Line (Line 164, 165, 166) */}
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 min-w-6 h-0 border-t ${lineClass}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Company Analytics Card (Figma Frame 2608882: w:768px, p:16px, gap:16px, border: 1px solid var(--ds-border), rounded: 16px) */}
        <div className="w-full p-4 rounded-2xl border border-ds-border flex flex-col items-start gap-4 self-stretch flex-none box-border">
          <h3 className="ds-text-body-1 text-ds-text-primary">
            Company analytics
          </h3>

          {/* HorizontalBorder (w: 736px, h: 73px, 2-column layout split by 16px gap, Col 2 starts at 376px) */}
          <div className="w-full h-[73px] grid grid-cols-2 gap-4 self-stretch flex-none box-border">
            {/* Left Container (w: 108px, h: 73px, pb: 12px, gap: 12px, border-b: 2px solid #22C55E) */}
            <div className="w-[108px] h-[73px] flex flex-col items-start pb-3 gap-3 border-b-2 border-ds-success box-border flex-none">
              {/* RESPONSE RATE (w: 108px, h: 16px, DM Sans 12px/16px #B8ADA8) */}
              <span className="w-[108px] h-4 font-dm-sans font-normal text-xs leading-4 text-ds-text-secondary uppercase flex items-center">
                RESPONSE RATE
              </span>
              {/* Value (w: 108px, h: 26px, Poppins 500 18px/26px #FFECE6) */}
              <span className="w-[108px] h-[26px] font-dm-sans font-medium text-lg leading-[26px] text-ds-text-primary flex items-center">
                {job.response_rate || '98%'}
              </span>
            </div>

            {/* Right Container (left: 376px, w: 360px, h: 73px, gap: 8px) */}
            <div className="w-full max-w-[360px] h-[73px] flex flex-col items-start gap-2 box-border flex-none">
              {/* AVG. REPLY (w: 360px, h: 16px, DM Sans 12px/16px #B8ADA8) */}
              <span className="w-full h-4 font-dm-sans font-normal text-xs leading-4 text-ds-text-secondary uppercase flex items-center">
                AVG. REPLY
              </span>
              {/* Value (w: 360px, h: 26px, Poppins 500 18px/26px #FFECE6) */}
              <span className="w-full h-[26px] font-dm-sans font-medium text-lg leading-[26px] text-ds-text-primary flex items-center">
                {job.avg_reply || '1 day'}
              </span>
              {/* Very fast (w: 360px, h: 15px, Poppins 400 10px/15px var(--ds-success)) */}
              <span className="w-full h-[15px] font-poppins font-normal text-[10px] leading-[15px] text-ds-success flex items-center">
                Very fast
              </span>
            </div>
          </div>

          {/* Recruiter Note (Figma: width 360px, height 40px, DM Sans 14px/20px #B8ADA8) */}
          <p className="w-full max-w-[360px] min-h-10 font-dm-sans font-normal text-sm leading-5 text-ds-text-secondary flex flex-col justify-center flex-none">
            <span>{job.company || 'The recruiter'} usually views applications within 24</span>
            <span>hours of submission.</span>
          </p>
        </div>

        {/* Description Section */}
        <div className="w-full flex flex-col justify-start items-start gap-3">
          <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
            Description
          </h3>
          <div className={`w-full text-ds-text-primary text-sm font-normal font-dm-sans leading-5 whitespace-pre-line ${!showFullDesc ? 'line-clamp-6' : ''}`}>
            {job.description}
          </div>

          {showFullDesc && job.requirements && job.requirements.length > 0 && (
            <div className="mt-2 w-full flex flex-col gap-2">
              <h4 className="text-sm font-bold text-ds-text-primary">Key Responsibilities</h4>
              <ul className="flex flex-col gap-1.5 pl-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="text-sm text-ds-text-secondary flex items-start gap-2">
                    <span className="text-ds-accent mt-1">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="text-ds-accent text-sm font-normal font-dm-sans leading-5 hover:opacity-90 transition-opacity self-start cursor-pointer bg-transparent border-none outline-none"
          >
            {showFullDesc ? 'See less' : 'See more'}
          </button>
        </div>

        {/* Location & Map Section (Figma Frame 2608887: w:768px, gap:16px) */}
        <div className="w-full flex flex-col items-start gap-4 self-stretch flex-none box-border">
          {/* Map Container (h:198px, 24px radius, seamless without border, with floating Google Maps redirect pill identical to Org Profile AboutTab) */}
          <div className="relative w-full h-[198px] rounded-[24px] overflow-hidden group self-stretch flex-none box-border">
            <InteractiveLocationMap
              locationAddress={job.location || ''}
              latitude={jobLat}
              longitude={jobLng}
              readOnly={true}
              className="!w-full !h-full !rounded-[24px] !border-0 !shadow-none !bg-transparent"
            />

            {mapUrl && (
              <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-30 pointer-events-auto">
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Maps"
                  aria-label={`Open ${job.location || 'location'} in Google Maps`}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-ds-surface-1/90 hover:bg-ds-surface-2 active:scale-95 backdrop-blur-md border border-ds-border shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] text-xs font-medium font-dm-sans text-ds-text-primary cursor-pointer no-underline"
                >
                  <GoogleIcon size={14} className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Open in Google Maps</span>
                  <span className="sm:hidden">Open Maps</span>
                  <ExternalLink className="w-3 h-3 text-ds-text-muted shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Address Row (Frame 2608879: h:40px, gap:8px, items: center) */}
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Google Maps"
              aria-label={`Open ${job.location} in Google Maps`}
              className="w-full min-h-10 flex items-center gap-2 self-stretch flex-none group hover:opacity-85 transition-opacity cursor-pointer no-underline"
            >
              <LocationIcon className="w-5 h-5 text-ds-text-secondary group-hover:text-ds-accent transition-colors shrink-0 flex-none order-0 grow-0" />
              <span className="ds-text-secondary text-ds-text-secondary group-hover:text-ds-text-primary transition-colors flex-1 order-1">
                {job.location}
              </span>
            </a>
          ) : (
            <div className="w-full min-h-10 flex items-center gap-2 self-stretch flex-none">
              <LocationIcon className="w-5 h-5 text-ds-text-secondary shrink-0 flex-none order-0 grow-0" />
              <span className="ds-text-secondary text-ds-text-secondary flex-1 order-1">
                {job.location || 'Location not specified'}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Floating Bottom Action Bar (Figma: width 800px, height 72px, padding 12px, border-radius 16px, border 1px solid var(--ds-border)) */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-[800px] w-full h-[72px] mx-auto p-3 bg-ds-bg border border-ds-border rounded-2xl shadow-2xl flex items-center justify-between gap-3 pointer-events-auto box-border">
          {/* Frame 2609957: Job Title & Recruiter • Location (h: 48px, gap: 4px) */}
          <div className="flex flex-col items-start justify-center gap-1 min-w-0 flex-1 h-12">
            <span className="w-full text-ds-text-primary text-base font-medium font-dm-sans leading-6 truncate">
              {job.title}
            </span>
            {/* Frame 2609961: Company • Location (h: 20px, gap: 8px) */}
            <div className="w-full flex items-center gap-2 text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate">
              <span className="truncate">{job.company || job.recruiter_name || 'Recruiter'}</span>
              <span className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
              <span className="truncate">{job.location || 'Remote'}</span>
            </div>
          </div>

          {/* Frame 2609956: Share, Bookmark & Context Action Button (h: 48px, gap: 12px) */}
          <div className="flex items-center gap-3 shrink-0 h-12">
            {/* Share icon: Only for active open jobs (Apply now / Withdraw) */}
            {showShare && (
              <button
                onClick={() => setShowShareModal(true)}
                aria-label="Share Job"
                type="button"
                className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors bg-transparent border-none outline-none cursor-pointer flex-none p-0"
              >
                <ShareIcon size={20} className="w-5 h-5 shrink-0" fill="currentColor" />
              </button>
            )}

            {/* Bookmark / Save: Active open jobs AND pending offers (Accept / Decline) */}
            {showSave && (
              <button
                onClick={toggleSave}
                aria-label={job.is_saved ? 'Unsave job' : 'Save job'}
                type="button"
                className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors bg-transparent border-none outline-none cursor-pointer flex-none p-0"
              >
                {job.is_saved ? (
                  <SaveFilledIcon size={20} className="w-5 h-5 text-ds-accent shrink-0" fill="currentColor" />
                ) : (
                  <SaveIcon size={20} className="w-5 h-5 text-ds-text-primary hover:text-ds-accent shrink-0" fill="currentColor" />
                )}
              </button>
            )}

            {/* Dynamic Contextual Action */}
            {renderBottomBarActions()}
          </div>
        </div>
      </div>


      {/* Apply Job Modal */}
      <ApplyJobModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onApply={async (resumeUrl, uploadedFile, resumeId, coverLetter) => {
          await applyToJob(resumeUrl, uploadedFile, resumeId, coverLetter);
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
        jobId={jobId}
        entityType="job"
        entityId={jobId}
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
  );
};

export default JobDetailPage;
