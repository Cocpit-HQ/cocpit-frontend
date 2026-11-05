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
  // SCRUM-1610: Support both returnTo and from query params (e.g. from notifications)
  // so back navigation pops history back to the caller instead of forcing /jobs
  const returnTo = searchParams.get('returnTo') || searchParams.get('from');

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

  const jobAny = job as any;
  const jobLat = jobAny?.latitude != null ? Number(jobAny.latitude) : null;
  const jobLng = jobAny?.longitude != null ? Number(jobAny.longitude) : null;
  const mapUrl = job
    ? getGoogleMapsUrl(
        job.location,
        jobLat,
        jobLng,
        jobAny?.map_url || jobAny?.mapUrl
      )
    : null;

  const { steps, activeStep } = useMemo(() => {
    if (!job) return { steps: ['Applied', 'In review', 'Shortlisted'] as const, activeStep: 0 };
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
  }, [job?.application_status]);

  const isJobCompany = Boolean(job?.org_id || job?.company_id || (job as any)?.company_type === 'COMPANY' || (job as any)?.company_type === 'ORGANIZATION');

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (!job) {
    return <JobUnavailableScreen onBack={handleBack} />;
  }

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

  const salaryDisplay = (() => {
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
  })();

  const renderBottomBarActions = () => {
    // Closed jobs: Recruitment pipeline is ended.
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
          <span className="text-ds-text-secondary ds-text-small px-3 py-1.5 text-center flex items-center">
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
        <span className="text-ds-text-secondary ds-text-small px-4 py-1.5 border border-ds-border rounded-full">
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

  const renderMobileBottomBarActions = () => {
    if (job.is_closed) {
      return (
        <button
          onClick={toggleFollow}
          disabled={isFollowLoading}
          type="button"
          className="w-full h-9 px-4 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary text-base font-medium font-dm-sans leading-6 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none outline-none disabled:opacity-75 disabled:cursor-not-allowed whitespace-nowrap"
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
            className="w-full h-9 px-3 py-1.5 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary text-base font-medium font-dm-sans leading-6 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none whitespace-nowrap"
          >
            Chat
          </button>
        );
      }
      if (isDeclined) {
        return (
          <div className="w-full h-9 px-3 py-1.5 rounded-full border border-ds-border flex items-center justify-center text-ds-text-muted text-base font-medium font-dm-sans leading-6 select-none whitespace-nowrap">
            Offer declined
          </div>
        );
      }
      if (isWithdrawn) {
        return (
          <span className="text-ds-error text-sm px-3 py-1.5 text-center flex items-center justify-center w-full">
            Offer withdrawn
          </span>
        );
      }
      if (isExpired) {
        return (
          <span className="text-ds-error text-sm px-3 py-1.5 text-center flex items-center justify-center w-full">
            Offer expired
          </span>
        );
      }

      return (
        <div className="w-full flex items-center gap-2">
          <button
            onClick={() => respondToOffer('accept')}
            type="button"
            className="flex-1 h-9 px-3 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary text-base font-medium font-dm-sans leading-6 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none whitespace-nowrap"
          >
            Accept
          </button>
          <button
            onClick={() => setShowDeclineConfirm(true)}
            type="button"
            className="flex-1 h-9 px-3 rounded-full border border-ds-border hover:bg-ds-surface-1/50 active:scale-95 text-ds-text-primary text-base font-medium font-dm-sans leading-6 transition-all flex items-center justify-center cursor-pointer outline-none whitespace-nowrap"
          >
            Decline
          </button>
        </div>
      );
    }

    if (isDeclined) {
      return (
        <span className="w-full text-ds-text-secondary text-sm px-4 py-1.5 border border-ds-border rounded-full text-center flex items-center justify-center">
          Application Declined
        </span>
      );
    }

    if (isShortlisted) {
      return (
        <button
          onClick={navigateToChat}
          type="button"
          className="w-full h-9 px-4 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary text-base font-medium font-dm-sans leading-6 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none whitespace-nowrap"
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
          className="w-full h-9 px-4 rounded-full border border-ds-border hover:bg-ds-surface-1/50 active:scale-95 text-ds-text-primary text-base font-medium font-dm-sans leading-6 transition-all cursor-pointer outline-none whitespace-nowrap"
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
          className="w-full h-9 px-4 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary text-base font-medium font-dm-sans leading-6 shadow-sm flex items-center justify-center cursor-pointer transition-all border-none outline-none whitespace-nowrap"
        >
          Apply now
        </button>
      </FeatureDisabledTooltip>
    );
  };

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans relative selection:bg-ds-accent/30 selection:text-ds-text-primary">
      {/* Desktop Fixed Top-Left Back Button (top: 40px, left: 40px matching Figma) */}
      <button
        onClick={handleBack}
        type="button"
        aria-label="Back"
        className="hidden sm:inline-flex fixed top-[40px] left-[40px] z-50 items-center gap-2 p-0 text-ds-text-primary text-base font-medium font-dm-sans leading-6 cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
        <span>Back</span>
      </button>

      {/* Mobile Top Header (Frame 2609713 / 2609475: height 24px, Arrow 20x20, Text "Back" 16px 500) */}
      <div className="sm:hidden w-full px-4 pt-4 pb-2 flex items-center justify-between z-30">
        <button
          onClick={handleBack}
          type="button"
          aria-label="Back"
          className="inline-flex items-center gap-2 p-0 text-ds-text-primary text-base font-medium font-dm-sans leading-6 cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
          <span>Back</span>
        </button>
      </div>

      {/* Main Column (Desktop: centered max-w-[768px], pt-[60px], pb-28; Mobile: pt-2, pb-24, px-4) */}
      <div className="w-full max-w-[768px] mx-auto pt-2 sm:pt-[60px] pb-24 sm:pb-28 px-4 sm:px-0 flex flex-col gap-5 animate-in fade-in duration-300">

        {/* Job Header & Metadata */}
        <div className="w-full flex flex-col justify-start items-start gap-3">
          {/* Job Title: Mobile 32px/40px font-bold, Desktop 40px/48px font-bold */}
          <h1 className="w-full text-[32px] sm:text-[40px] leading-[40px] sm:leading-[48px] font-bold font-dm-sans text-ds-text-primary">
            {job.title}
          </h1>

          {/* Posted By & Active Status Badge (Frame 2608872) */}
          <div className="w-full flex justify-between items-center gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => {
                const orgTarget = job.company_slug || job.org_id || (job as any).company_id;
                const returnUrl = typeof window !== "undefined" ? (window.location.pathname + window.location.search) : "/jobs";
                if (orgTarget) {
                  router.push(`/organization/${orgTarget}?source=jobs&returnTo=${encodeURIComponent(returnUrl)}`);
                } else if (job.recruiter_id) {
                  router.push(`/profile/${job.recruiter_id}?source=jobs&returnTo=${encodeURIComponent(returnUrl)}`);
                }
              }}
            >
              {/* Org (Square / rounded-lg) vs User (Circle / rounded-full) */}
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
              <div className="h-8 px-4 py-2 bg-ds-surface-1 border border-ds-warning rounded-[24px] flex items-center justify-center shrink-0 box-border">
                <span className="font-dm-sans font-normal text-xs leading-4 text-center text-ds-warning">
                  Closed
                </span>
              </div>
            ) : (
              <div className="h-8 px-4 py-2 bg-ds-surface-1 border border-ds-success rounded-[24px] flex items-center justify-center shrink-0 box-border">
                <span className="font-dm-sans font-normal text-xs leading-4 text-center text-ds-success">
                  Active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4-Item Specifications Grid (Mobile 2x2 grid, Desktop 4-col flex with dividers) */}
        <div className="w-full py-2 bg-transparent grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-4">
          {/* Experience */}
          <div className="flex-1 flex flex-col justify-center items-start gap-1.5">
            <div className="flex items-center gap-2 text-ds-text-secondary">
              <JobExperienceIcon size={20} className="w-5 h-5 text-ds-text-secondary shrink-0" />
              <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">Experience</span>
            </div>
            <div className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
              {job.experience || '0-2 Yrs'}
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-ds-border self-center shrink-0" />

          {/* Work mode */}
          <div className="flex-1 flex flex-col justify-center items-start gap-1.5">
            <div className="flex items-center gap-2 text-ds-text-secondary">
              <LocationIcon size={20} className="w-5 h-5 text-ds-text-secondary shrink-0" />
              <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">Work mode</span>
            </div>
            <div className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
              {job.work_mode || 'Hybrid'}
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-ds-border self-center shrink-0" />

          {/* Work type */}
          <div className="flex-1 flex flex-col justify-center items-start gap-1.5">
            <div className="flex items-center gap-2 text-ds-text-secondary">
              <CalendarIcon size={20} className="w-5 h-5 text-ds-text-secondary shrink-0" />
              <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">Work type</span>
            </div>
            <div className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
              {job.job_type || 'Full Time'}
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-10 bg-ds-border self-center shrink-0" />

          {/* Salary */}
          <div className="flex-1 flex flex-col justify-center items-start gap-1.5">
            <div className="flex items-center gap-2 text-ds-text-secondary">
              <IndianRupeeIcon size={20} className="w-5 h-5 text-ds-text-secondary shrink-0" />
              <span className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">Salary</span>
            </div>
            <div className="text-ds-text-primary text-base font-normal font-dm-sans leading-6">
              {salaryDisplay}
            </div>
          </div>
        </div>

        {/* Profile Match Banner (Figma tooltip spec: h:36px, bg-ds-surface-1, border-ds-border) */}
        <div className="w-full min-h-9 p-2 bg-ds-surface-1 border border-ds-border rounded-lg flex items-center gap-2.5 self-stretch flex-none box-border">
          <CyphexAIIcon size={20} className="w-5 h-5 text-ds-accent shrink-0 flex-none" />
          <span className="text-ds-accent text-xs font-normal font-dm-sans leading-4 flex items-center flex-1">
            You&apos;re stronger than {job.match_score ?? 90}% of applicants for this job based on your profile and skills
          </span>
        </div>

        {/* Offer Recruiter Note (Figma Frame 2609030) */}
        {job.is_offer && job.recruiter_message && (
          <div className="w-full max-w-[700px] min-h-[84px] p-3 bg-ds-surface-1 border-l-2 border-ds-accent rounded-r-2xl rounded-bl-2xl rounded-tl-none flex flex-col items-start gap-2 self-stretch flex-none box-border">
            <div className="flex items-center gap-2 h-9">
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
              <div className="flex flex-col items-start justify-center h-9">
                <span className="font-dm-sans font-semibold text-base leading-6 text-ds-text-primary">
                  {job.recruiter_name || job.company}
                </span>
                <span className="font-dm-sans font-normal text-[10px] leading-3 text-ds-text-secondary">
                  {job.recruiter_title || (job.company ? `Recruiter at ${job.company}` : 'Hiring Team')}
                </span>
              </div>
            </div>

            <p className="font-dm-sans font-normal text-xs leading-4 text-ds-text-secondary self-stretch m-0">
              {job.recruiter_message}
            </p>
          </div>
        )}

        {/* Application Status Tracker (if applied) */}
        {job.is_applied && (
          <>
            {/* Desktop Tracker (Unchanged for screens >= sm) */}
            <div className="hidden sm:flex w-full max-w-[768px] rounded-2xl border border-ds-border py-5 px-4 flex-col items-start gap-4 self-stretch flex-none box-border">
              <h3 className="font-dm-sans text-base font-medium leading-6 text-ds-text-primary m-0">
                Application status
              </h3>

              <div className="w-full flex items-center h-9 self-stretch flex-none overflow-x-auto no-scrollbar">
                {steps.map((step, idx) => {
                  const isCompleted = idx < activeStep || (idx === 0 && activeStep === 0);
                  const isCurrent = idx === activeStep && idx !== 0;
                  const isActive = idx <= activeStep;

                  let dotClass = 'bg-ds-text-primary border border-ds-text-secondary';
                  if (isCompleted) {
                    dotClass = 'bg-ds-accent border border-ds-accent';
                  } else if (isCurrent) {
                    dotClass = 'bg-ds-text-primary border border-ds-accent';
                  }

                  const textClass = isActive ? 'text-ds-accent' : 'text-ds-text-secondary';
                  const lineClass = idx < activeStep ? 'border-ds-accent' : 'border-ds-text-secondary';

                  return (
                    <React.Fragment key={step}>
                      <div className="flex items-center gap-2.5 px-4 py-2 h-9 rounded-[24px] shrink-0 box-border">
                        <div className={`w-4 h-4 rounded-full shrink-0 box-border ${dotClass}`} />
                        <span className={`font-poppins text-sm font-normal leading-5 text-center whitespace-nowrap ${textClass}`}>
                          {step}
                        </span>
                      </div>

                      {idx < steps.length - 1 && (
                        <div className={`flex-1 min-w-6 h-0 border-t ${lineClass}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Mobile Vertical Tracker (Figma Frame 2609080: sm:hidden) */}
            <div className="sm:hidden w-full flex flex-col items-start py-2 px-4 gap-2 rounded-[28px] self-stretch flex-none box-border">
              <h3 className="font-poppins text-base font-medium leading-6 text-ds-text-primary m-0">
                Application status
              </h3>

              <div className="flex flex-col justify-center items-start px-4">
                {steps.map((step, idx) => {
                  const isCompleted = idx < activeStep || (idx === 0 && activeStep === 0);
                  const isCurrent = idx === activeStep && idx !== 0;
                  const isActive = idx <= activeStep;

                  let dotClass = 'bg-ds-text-primary border border-ds-text-secondary';
                  if (isCompleted) {
                    dotClass = 'bg-ds-accent border border-ds-accent';
                  } else if (isCurrent) {
                    dotClass = 'bg-ds-text-primary border border-ds-accent';
                  }

                  const textClass = isActive ? 'text-ds-accent' : 'text-ds-text-secondary';
                  const lineClass = idx < activeStep ? 'border-ds-accent' : 'border-ds-text-secondary';

                  return (
                    <React.Fragment key={step}>
                      <div className="flex items-center gap-2.5 py-2 h-9 rounded-[24px] box-border">
                        <div className={`w-4 h-4 rounded-full shrink-0 box-border ${dotClass}`} />
                        <span className={`font-dm-sans text-sm font-normal leading-5 text-center whitespace-nowrap ${textClass}`}>
                          {step}
                        </span>
                      </div>

                      {idx < steps.length - 1 && (
                        <div className="w-4 h-5 flex justify-center items-center">
                          <div className={`w-0 h-5 border-l ${lineClass}`} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Company Analytics Card (Figma Frame 2608882: Mobile border-y, Desktop rounded-2xl border) */}
        <div className="w-full py-4 sm:p-4 border-y sm:border border-ds-border rounded-none sm:rounded-2xl flex flex-col items-start gap-4 self-stretch flex-none box-border">
          <h3 className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
            Company analytics
          </h3>

          <div className="w-full h-[73px] grid grid-cols-2 gap-4 self-stretch flex-none box-border">
            {/* RESPONSE RATE */}
            <div className="w-full max-w-[108px] h-[73px] flex flex-col items-start pb-3 gap-3 border-b-2 border-ds-success box-border flex-none">
              <span className="w-full h-4 font-dm-sans font-normal text-xs leading-4 text-ds-text-secondary uppercase flex items-center">
                RESPONSE RATE
              </span>
              <span className="w-full h-[26px] font-dm-sans font-medium text-lg leading-[26px] text-ds-text-primary flex items-center">
                {job.response_rate || '98%'}
              </span>
            </div>

            {/* AVG. REPLY */}
            <div className="w-full max-w-[360px] h-[73px] flex flex-col items-start gap-2 box-border flex-none">
              <span className="w-full h-4 font-dm-sans font-normal text-xs leading-4 text-ds-text-secondary uppercase flex items-center">
                AVG. REPLY
              </span>
              <span className="w-full h-[26px] font-dm-sans font-medium text-lg leading-[26px] text-ds-text-primary flex items-center">
                {job.avg_reply || '1 day'}
              </span>
              <span className="w-full h-[15px] font-poppins font-normal text-[10px] leading-[15px] text-ds-success flex items-center">
                Very fast
              </span>
            </div>
          </div>

          <p className="w-full max-w-[360px] min-h-10 font-dm-sans font-normal text-sm leading-5 text-ds-text-secondary flex flex-col justify-center flex-none m-0">
            <span>{job.company || 'The recruiter'} usually views applications within 24</span>
            <span>hours of submission.</span>
          </p>
        </div>

        {/* Job Overview Section */}
        <div className="w-full flex flex-col justify-start items-start gap-3">
          <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
            Job overview
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

        {/* Location & Map Section (Frame 2608887) */}
        <div className="w-full flex flex-col items-start gap-4 self-stretch flex-none box-border">
          {/* Map Container (Mobile h-[94px], Desktop h-[198px]) */}
          <div className="relative w-full h-[94px] sm:h-[198px] rounded-2xl overflow-hidden group self-stretch flex-none box-border border border-ds-border">
            <InteractiveLocationMap
              locationAddress={job.location || ''}
              latitude={jobLat}
              longitude={jobLng}
              readOnly={true}
              className="!w-full !h-full !rounded-2xl !border-0 !shadow-none !bg-transparent"
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
                  <ExternalLink className="w-3 h-3 text-ds-text-secondary shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Address Row (Frame 2608879) */}
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Google Maps"
              aria-label={`Open ${job.location} in Google Maps`}
              className="w-full min-h-10 flex items-center gap-2 self-stretch flex-none group hover:opacity-85 transition-opacity cursor-pointer no-underline"
            >
              <LocationIcon className="w-5 h-5 text-ds-text-secondary group-hover:text-ds-accent transition-colors shrink-0 flex-none" />
              <span className="text-sm font-normal font-dm-sans leading-5 text-ds-text-secondary group-hover:text-ds-text-primary transition-colors flex-1">
                {job.location}
              </span>
            </a>
          ) : (
            <div className="w-full min-h-10 flex items-center gap-2 self-stretch flex-none">
              <LocationIcon className="w-5 h-5 text-ds-text-secondary shrink-0 flex-none" />
              <span className="text-sm font-normal font-dm-sans leading-5 text-ds-text-secondary flex-1">
                {job.location || 'Location not specified'}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Desktop Floating Bottom Action Bar (Unchanged for screens >= sm: width 800px, height 72px) */}
      <div className="hidden sm:block fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-[800px] w-full h-[72px] mx-auto p-3 bg-ds-bg border border-ds-border rounded-2xl shadow-2xl flex items-center justify-between gap-3 pointer-events-auto box-border">
          {/* Frame 2609957: Job Title & Recruiter • Location */}
          <div className="flex flex-col items-start justify-center gap-1 min-w-0 flex-1 h-12">
            <span className="w-full text-ds-text-primary text-base font-medium font-dm-sans leading-6 truncate">
              {job.title}
            </span>
            <div className="w-full flex items-center gap-2 text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate">
              <span className="truncate">{job.company || job.recruiter_name || 'Recruiter'}</span>
              <span className="w-1 h-1 bg-ds-text-secondary rounded-full shrink-0" />
              <span className="truncate">{job.location || 'Remote'}</span>
            </div>
          </div>

          {/* Frame 2609956: Share, Bookmark & Context Action Button */}
          <div className="flex items-center gap-3 shrink-0 h-12">
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

            {renderBottomBarActions()}
          </div>
        </div>
      </div>

      {/* Mobile Fixed Docked Bottom Action Bar (Frame 2609956: Full-width CTA, Share, Save) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-ds-bg/95 backdrop-blur-md border-t border-ds-border px-4 py-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-3 shadow-2xl">
        {/* Full-width Contextual Action Button */}
        <div className="flex-1 min-w-0">
          {renderMobileBottomBarActions()}
        </div>

        {/* Share icon: Only for active open jobs (Apply now / Withdraw) */}
        {showShare && (
          <button
            onClick={() => setShowShareModal(true)}
            aria-label="Share Job"
            type="button"
            className="w-9 h-9 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors bg-transparent border-none outline-none cursor-pointer shrink-0 p-0"
          >
            <ShareIcon size={20} className="w-5 h-5 shrink-0" fill="currentColor" />
          </button>
        )}

        {/* Bookmark / Save: Active open jobs AND pending offers */}
        {showSave && (
          <button
            onClick={toggleSave}
            aria-label={job.is_saved ? 'Unsave job' : 'Save job'}
            type="button"
            className="w-9 h-9 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors bg-transparent border-none outline-none cursor-pointer shrink-0 p-0"
          >
            {job.is_saved ? (
              <SaveFilledIcon size={20} className="w-5 h-5 text-ds-accent shrink-0" fill="currentColor" />
            ) : (
              <SaveIcon size={20} className="w-5 h-5 text-ds-text-primary hover:text-ds-accent shrink-0" fill="currentColor" />
            )}
          </button>
        )}
      </div>

      {/* Apply Job Modal / Bottom Drawer */}
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
