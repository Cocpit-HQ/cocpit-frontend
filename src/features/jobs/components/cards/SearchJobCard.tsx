import React from 'react';
import { Job } from '../../types/jobs.types';
import { Icon } from '@iconify/react';
import Avatar from '@/components/shared/Avatar';
import { BriefcaseIcon } from '@/components/icons';
import { formatJobLocation } from '../../utils/location.utils';
import { cleanSalary } from '../../utils/currency.utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  const badgeText = job.recommended_badge || "Top 10%";
  const percentMatch = badgeText.match(/\d+/);
  const percentNum = percentMatch ? parseInt(percentMatch[0], 10) : 10;
  const strongerThanPercent = 100 - percentNum;

  const salaryText = cleanSalary(job.salary_display || (job.salary_min && job.salary_max ? `${job.salary_min}–${job.salary_max}` : job.salary_min || job.salary_max));
  const companyOrPosterName = job.org_id
    ? (job.company || job.recruiter_name)
    : (job.recruiter_name || job.company);

  return (
    <div
      onClick={() => onClick?.(job)}
      className="w-full p-4 sm:p-5 bg-ds-surface-1 rounded-2xl border border-ds-border flex flex-col justify-between gap-3 sm:gap-4 transition-all duration-200 hover:border-ds-text-muted cursor-pointer group"
    >
      {/* Top Header */}
      <div className="w-full flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            src={job.org_id ? job.company_logo : (job.recruiter_avatar || job.company_logo)}
            name={companyOrPosterName}
            isCompany={Boolean(job.org_id)}
            className="size-10 mt-0.5"
            fallbackIcon={<BriefcaseIcon className="w-[60%] h-[60%] text-ds-text-primary shrink-0" />}
          />
          <div className="flex flex-col min-w-0">
            <h3 className="text-ds-text-primary text-base font-medium font-dm-sans leading-snug line-clamp-1 group-hover:text-ds-accent transition-colors">
              {job.title}
            </h3>
            <span className="text-ds-text-secondary text-sm font-normal font-dm-sans truncate">
              {companyOrPosterName}
            </span>
          </div>
        </div>

        {/* Right side: Badge & Bookmark */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {(job.is_recommended || job.recommended_badge) && (
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div tabIndex={0} className="px-2 py-0.5 bg-ds-surface-2 border border-ds-border rounded-full inline-flex items-center focus:outline-none">
                  <span className="text-ds-accent text-[10px] font-medium font-dm-sans">
                    {badgeText}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="end"
                sideOffset={8}
                className="w-64 py-2 px-3 bg-ds-surface-2 rounded-xl border border-ds-border text-ds-text-primary text-[11px] font-dm-sans z-[9999]"
              >
                Stronger than {strongerThanPercent}% of applicants
              </TooltipContent>
            </Tooltip>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave?.(job.id, e);
            }}
            className="size-8 rounded-full flex items-center justify-center text-ds-text-muted hover:text-ds-accent transition-colors active:scale-95 cursor-pointer"
            aria-label="Save job"
          >
            <Icon
              icon={job.is_saved ? 'solar:bookmark-bold' : 'solar:bookmark-linear'}
              className={`size-5 transition-colors ${job.is_saved ? 'text-ds-accent' : 'text-ds-text-muted group-hover:text-ds-text-secondary'}`}
            />
          </button>
        </div>
      </div>

      {/* Meta Row: Experience & Location */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-normal font-dm-sans text-ds-text-secondary min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <Icon icon="solar:bag-2-linear" className="size-4 text-ds-text-secondary shrink-0" />
            <span>{job.experience || '0-2Yrs'}</span>
          </div>

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

        {salaryText && (
          <div className="text-ds-text-primary text-base sm:text-lg font-bold font-dm-sans sm:text-right">
            {salaryText}
          </div>
        )}
      </div>

      {/* Bottom Actions Row */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-ds-border/60">
        <span className="text-ds-text-muted text-xs font-normal font-dm-sans">
          {job.posted_at || 'Recently posted'}
        </span>

        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApply?.(job.id, e);
            }}
            className="px-5 py-1.5 sm:py-2 bg-ds-accent hover:bg-ds-accent/90 text-white rounded-full text-xs sm:text-sm font-medium font-dm-sans transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            Apply now
          </button>
        </div>
      </div>
    </div>
  );
});

SearchJobCard.displayName = 'SearchJobCard';

export default SearchJobCard;
