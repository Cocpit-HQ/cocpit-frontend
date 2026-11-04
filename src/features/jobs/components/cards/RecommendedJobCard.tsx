import React from 'react';
import { Job } from '../../types/jobs.types';
import { Icon } from '@iconify/react';
import { Icon as CustomIcon, BriefcaseIcon } from '@/components/icons';
import Avatar from '@/components/shared/Avatar';
import { formatSalaryRange, cleanSalary } from '../../utils/currency.utils';
import { formatCardLocation } from '../../utils/location.utils';

interface RecommendedJobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  onSave?: (jobId: string, e: React.MouseEvent) => void;
}

export const RecommendedJobCard: React.FC<RecommendedJobCardProps> = React.memo(({ job, onClick, onSave }) => {
  // Top % badge calculation temporarily commented out
  // const percentMatch = job.recommended_badge?.match(/\d+/);
  // const strongerThanPercent = 100 - (percentMatch ? parseInt(percentMatch[0], 10) : 10);
  const salaryText = cleanSalary(
    job.salary_display ||
    formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency) ||
    (job.salary_min && job.salary_max ? `${job.salary_min}–${job.salary_max}` : job.salary_min || job.salary_max)
  );
  const workMode = job.work_mode || '';
  const locationText = formatCardLocation(job.location, workMode);
  const companyOrPosterName = job.org_id
    ? (job.company || job.recruiter_name)
    : (job.recruiter_name || job.company);

  return (
    <div
      onClick={() => onClick?.(job)}
      className="w-64 sm:w-[300px] h-[192px] p-3 bg-ds-bg rounded-2xl border border-ds-border flex flex-col items-start gap-3 shrink-0 cursor-pointer select-none"
    >
      {/* Frame 2609818: Top row (w: 276px, h: 40px, gap: 12px) */}
      <div className="w-full h-10 flex items-start justify-between gap-3">
        {/* Frame 2609815: Company Logo (40px x 40px, rounded: 8px, bg: #1A1A20) */}
        <Avatar
          src={job.org_id ? job.company_logo : (job.recruiter_avatar || job.company_logo)}
          name={companyOrPosterName}
          isCompany={Boolean(job.org_id)}
          className="size-10"
          fallbackIcon={<BriefcaseIcon className="w-[60%] h-[60%] text-ds-text-primary shrink-0" />}
        />

        {/* Right side: Save icon (Frame 2609818 order 1) */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* save icon (20px x 20px, #FFECE6) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave?.(job.id, e);
            }}
            className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors active:scale-95 cursor-pointer shrink-0"
            aria-label="Save job"
          >
            <CustomIcon
              name={job.is_saved ? "save-filled" : "save"}
              size={20}
              className={`w-5 h-5 transition-colors ${job.is_saved ? 'text-ds-accent' : 'text-ds-text-primary'}`}
            />
          </button>
        </div>
      </div>

      {/* Frame 2609814: Title & Company (flex-col, gap: 4px, h: 48px) */}
      <div className="w-full flex flex-col items-start gap-1 min-w-0">
        <h3 className="w-full text-ds-text-primary text-base font-medium font-dm-sans leading-6 truncate">
          {job.title}
        </h3>
        {companyOrPosterName && (
          <span className="w-full text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate">
            {companyOrPosterName}
          </span>
        )}
      </div>

      {/* Frame 2609816: Work mode & Location (w: 145px, h: 20px, gap: 8px) */}
      {(workMode || locationText) && (
        <div className="h-5 flex items-center gap-2 text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 min-w-0">
          {/* location icon (16px x 16px, #B8ADA8) */}
          <Icon icon="solar:map-point-linear" className="size-4 text-ds-text-secondary shrink-0" />
          {workMode && <span className="shrink-0">{workMode}</span>}
          {workMode && locationText && (
            /* Ellipse 12 (4px x 4px, #726B67, 8px gap left and right) */
            <span className="size-1 rounded-full bg-ds-text-muted shrink-0" />
          )}
          {locationText && <span className="truncate">{locationText}</span>}
        </div>
      )}

      {/* Frame 2609819: Salary & Posted time (flex-row, justify-between, items-end, gap: 12px, h: 24px) */}
      {(salaryText || job.posted_at) && (
        <div className={`w-full h-6 flex items-end ${salaryText && job.posted_at ? 'justify-between' : salaryText ? 'justify-start' : 'justify-end'} gap-3 mt-auto`}>
          {salaryText && (
            <span className="text-ds-text-primary text-[18px] font-bold font-dm-sans leading-6 truncate">
              {salaryText}
            </span>
          )}
          {job.posted_at && (
            <span className="text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 shrink-0">
              {job.posted_at}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

export default RecommendedJobCard;
