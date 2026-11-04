import React from 'react';
import { useRouter } from 'next/navigation';
import { Job } from '../../types/jobs.types';
import { Icon } from '@iconify/react';
import { Icon as CustomIcon, BriefcaseIcon } from '@/components/icons';
import Avatar from '@/components/shared/Avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { FeatureDisabledTooltip } from '@/components/feature-flags';
import { formatJobLocation } from '../../utils/location.utils';

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

export const JobCard: React.FC<JobCardProps> = React.memo(({
  job,
  onSave,
  onApply,
  onWithdraw,
  onClick,
  onAccept,
  onDecline,
  isSavedTab,
}) => {
  const router = useRouter();
  const { flags } = useFeatureFlags();
  const { isCompany, activeProfile } = useActiveProfile();

  const badgeText = job.recommended_badge || 'Top 15%';
  const percentMatch = badgeText.match(/\d+/);
  const strongerThanPercent = 100 - (percentMatch ? parseInt(percentMatch[0], 10) : 15);
  const salaryText = job.salary_display || (job.salary_min && job.salary_max ? `${job.salary_min}–${job.salary_max}` : job.salary_min || job.salary_max);
  const companyOrPosterName = job.org_id
    ? (job.company || job.recruiter_name)
    : (job.recruiter_name || job.company);

  const navigateToChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams();
    if (job.org_id) params.set('companyId', job.org_id);
    else if (job.recruiter_id) params.set('userId', job.recruiter_id);
    if (job.offer_id) params.set('offerContext', job.offer_id);
    else if (job.id) params.set('jobContext', job.id);
    router.push(`/messaging?${params.toString()}`);
  };

  // Render contextual CTA based on role/offer state
  const renderActionButtons = () => {
    if (job.is_offer) {
      const isAccepted = job.offerStatus === 'accepted' || job.application_status === 'Accepted';
      const isDeclined = job.offerStatus === 'declined' || job.application_status === 'Declined';
      const isWithdrawn = job.offerStatus === 'withdrawn' || job.application_status === 'Withdrawn';
      const isExpired = job.offerStatus === 'expired' || job.application_status === 'Expired';

      if (isAccepted) {
        return (
          <button
            type="button"
            onClick={navigateToChat}
            className="h-[36px] px-4 rounded-[100px] bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none shrink-0 focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            Chat
          </button>
        );
      }
      if (isDeclined) return <span className="text-ds-text-muted ds-text-small">Offer declined</span>;
      if (isWithdrawn) return <span className="text-ds-text-muted ds-text-small">Offer withdrawn</span>;
      if (isExpired) return <span className="text-ds-text-muted ds-text-small">Offer expired</span>;

      return (
        <div className="w-[194px] h-[36px] flex flex-row justify-end items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAccept?.(job.offer_id || job.id, e);
            }}
            className="w-[91px] h-[36px] px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary rounded-[100px] ds-text-body-1 font-medium font-dm-sans flex items-center justify-center transition-all shadow-sm cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDecline?.(job.offer_id || job.id, e);
            }}
            className="w-[91px] h-[36px] px-3 py-1.5 bg-transparent hover:bg-ds-surface-1 border border-ds-border text-ds-text-primary rounded-[100px] ds-text-body-1 font-medium font-dm-sans flex items-center justify-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            Decline
          </button>
        </div>
      );
    }

    if (job.application_status?.toLowerCase() === 'shortlisted') {
      return (
        <button
          type="button"
          onClick={navigateToChat}
          className="h-9 px-4 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary ds-text-body-1 transition-all shadow-sm flex items-center justify-center cursor-pointer border-none outline-none shrink-0"
        >
          Chat
        </button>
      );
    }

    if (job.is_closed) {
      return (
        <span className="text-ds-error ds-text-small font-medium">
          Job Closed
        </span>
      );
    }

    if (job.is_applied) {
      return (
        <div className="w-[98px] h-[36px] flex flex-row justify-end items-center shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onWithdraw?.(job.id, e);
            }}
            className="w-[98px] h-[36px] px-3 py-1.5 bg-transparent hover:bg-ds-surface-1 border border-ds-border text-ds-text-primary rounded-[100px] flex items-center justify-center ds-text-body-1 font-medium font-dm-sans transition-all active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            Withdraw
          </button>
        </div>
      );
    }

    return (
      <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onApply?.(job.id, e);
          }}
          className="w-[69px] md:w-[104px] h-9 px-3 py-1.5 bg-ds-accent hover:bg-ds-accent/90 text-ds-text-primary rounded-full inline-flex items-center justify-center ds-text-body-1 font-medium focus:outline-none transition-all duration-150 active:scale-95 shadow-sm cursor-pointer"
        >
          <span className="md:hidden">Apply</span>
          <span className="hidden md:inline">Apply now</span>
        </button>
      </FeatureDisabledTooltip>
    );
  };

  return (
    <div
      onClick={() => onClick?.(job)}
      className="w-full max-w-[800px] min-h-[188px] p-[12px_0px] md:p-3 bg-transparent md:bg-ds-bg rounded-none md:rounded-2xl border-0 md:border md:border-ds-border flex flex-col justify-between gap-3 cursor-pointer font-dm-sans"
    >
      {/* Top Section (Frame 2609818 w:776px h:40px): Logo left, Bookmark right */}
      <div className="w-full h-10 flex items-center justify-between">
        <Avatar
          src={job.org_id ? job.company_logo : (job.recruiter_avatar || job.company_logo)}
          name={companyOrPosterName}
          fallbackIcon={<BriefcaseIcon className="w-[60%] h-[60%] text-ds-text-primary shrink-0" />}
          isCompany={Boolean(job.org_id)}
          className="size-10"
        />

        {/* Right side: Bookmark & Badges */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isSavedTab ? (
            job.is_closed ? (
              <div className="w-[74px] h-8 px-4 py-2 bg-ds-surface-1 border border-ds-warning rounded-full text-ds-warning ds-text-small font-normal flex items-center justify-center shrink-0">
                Closed
              </div>
            ) : null
          ) : (
            job.recommended_badge && (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div tabIndex={0} className="px-2 py-0.5 bg-ds-surface-1 rounded-full inline-flex items-center focus:outline-none">
                    <span className="text-ds-accent ds-text-meta font-medium">
                      {badgeText}
                    </span>

                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="end"
                  sideOffset={8}
                  className="w-64 py-2 px-3 bg-ds-surface-1 rounded-xl border border-ds-border text-ds-text-primary ds-text-small font-dm-sans z-[9999]"
                >
                  Stronger than {strongerThanPercent}% of applicants
                </TooltipContent>
              </Tooltip>
            )
          )}

          {/* Bookmark Button (Save) */}
          {flags?.saved_jobs !== false && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSave?.(job.id, e);
              }}
              className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent focus:outline-none transition-colors active:scale-95 cursor-pointer shrink-0"
              aria-label="Save job"
            >
              <CustomIcon
                name={job.is_saved ? "save-filled" : "save"}
                size={20}
                className={`w-5 h-5 transition-colors ${job.is_saved ? 'text-ds-accent' : 'text-ds-text-primary'}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Middle & Bottom Layout (Frame 2609958 w:776px): Left Info vs Right Action/Salary */}
      <div className="w-full flex items-end justify-between gap-3">
        {/* Left Column (Frame 2609957): Title, Company, Experience, Location, Posted */}
        <div className="flex flex-col items-start gap-3 min-w-0 flex-1">
          {/* Frame 2609814: Title & Company */}
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-ds-text-primary ds-text-body-1 font-medium truncate">
              {job.title}
            </h3>
            {companyOrPosterName && (
              <span className="text-ds-text-secondary ds-text-secondary font-normal truncate">
                {companyOrPosterName}
              </span>
            )}
          </div>

          {/* Frame 2609816 & Frame 2609961: Experience & Location */}
          <div className="flex flex-col items-start gap-1 md:flex-row md:flex-wrap md:items-center md:gap-2 text-ds-text-secondary ds-text-secondary font-normal min-w-0">
            {/* Experience: jobs briefcase icon (16x16) + experience text */}
            <div className="flex items-center gap-2 shrink-0">
              <CustomIcon name="job-experience" size={16} className="w-4 h-4 text-ds-text-secondary shrink-0" />
              <span>{job.experience || '0-2Yrs'}</span>
            </div>

            {/* Frame 2609961: Location */}
            {(job.work_mode || job.location) && (
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <Icon icon="solar:map-point-linear" className="size-4 text-ds-text-secondary shrink-0" />
                {job.work_mode && <span className="shrink-0">{job.work_mode}</span>}
                {job.work_mode && job.location && (
                  <span className="size-1 rounded-full bg-ds-text-muted shrink-0" />
                )}
                {job.location && <span>{formatJobLocation(job.location)}</span>}
              </div>
            )}
          </div>

          {/* Posted time - Desktop only inside left column */}
          <span className="hidden md:inline text-ds-text-secondary ds-text-secondary font-normal">
            {job.posted_at}
          </span>
        </div>

        {/* Right Column: Salary & Action Button, or Closed warning text when closed in Saved tab */}
        {isSavedTab && job.is_closed ? (
          <div className="flex flex-col justify-end items-end shrink-0 pb-0.5" onClick={(e) => e.stopPropagation()}>
            <span className="w-[150px] h-[16px] text-ds-error text-xs font-normal font-dm-sans leading-4 text-right whitespace-nowrap">
              This job no longer available
            </span>

          </div>
        ) : (
          <div className="flex flex-col justify-end items-end gap-4 md:gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            {salaryText && (
              <div className="text-ds-text-primary text-[18px] font-bold leading-6 text-right">
                {salaryText}
              </div>
            )}

            {renderActionButtons()}
          </div>
        )}
      </div>

      {/* Posted time - Mobile only below middle content */}
      {job.posted_at && (
        <span className="md:hidden text-ds-text-secondary ds-text-secondary font-normal">
          {job.posted_at}
        </span>
      )}
    </div>
  );
});

JobCard.displayName = 'JobCard';

export default JobCard;
