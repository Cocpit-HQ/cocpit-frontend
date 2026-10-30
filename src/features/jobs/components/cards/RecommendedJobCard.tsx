import React from 'react';
import { Job } from '../../types/jobs.types';
import { Icon } from '@iconify/react';
import { Icon as CustomIcon } from '@/components/icons';
import Avatar from '@/components/shared/Avatar';
import { formatSalaryRange, cleanSalary } from '../../utils/currency.utils';

interface RecommendedJobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  onSave?: (jobId: string, e: React.MouseEvent) => void;
}

const getCityOnly = (loc?: string): string => {
  if (!loc) return '';
  if (!loc.includes(',')) return loc.trim();

  const parts = loc.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  // If first part is not a street address / building number
  if (!/^\d+/.test(parts[0]) && !/^(suite|ste|apt|flat|unit|floor|fl|room|rm|no\.)\b/i.test(parts[0])) {
    return parts[0];
  }

  // If first part is a street/building, look for city candidate
  const candidates = parts.filter(
    (p) =>
      !/^\d+/.test(p) &&
      !/road|street|rd\b|st\b|ave\b|avenue|blvd|lane|way|drive|dr\b|building|bldg|floor|fl\b|suite|ste\b|apt\b/i.test(p)
  );

  if (candidates.length > 0) {
    const nonStateCandidates = candidates.filter((c) => !/^[A-Z]{2}(\s+\d+)?$/i.test(c.trim()));
    const best = (nonStateCandidates.length > 0 ? nonStateCandidates[0] : candidates[0])
      .replace(/\b\d{4,}\b/g, '')
      .trim();
    if (best) return best;
  }

  return parts[0];
};

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
  const city = getCityOnly(job.location);

  return (
    <div
      onClick={() => onClick?.(job)}
      className="w-[300px] h-[192px] p-3 bg-ds-bg rounded-2xl border border-ds-border flex flex-col items-start gap-3 shrink-0 cursor-pointer select-none"
    >
      {/* Frame 2609818: Top row (w: 276px, h: 40px, gap: 12px) */}
      <div className="w-full h-10 flex items-start justify-between gap-3">
        {/* Frame 2609815: Company Logo (40px x 40px, rounded: 8px, bg: #1A1A20) */}
        <Avatar
          src={job.company_logo}
          name={job.company}
          isCompany={true}
          className="size-10"
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
        {job.company && (
          <span className="w-full text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 truncate">
            {job.company}
          </span>
        )}
      </div>

      {/* Frame 2609816: Work mode & City (w: 145px, h: 20px, gap: 8px) */}
      {(workMode || city) && (
        <div className="h-5 flex items-center gap-2 text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 min-w-0">
          {/* location icon (16px x 16px, #B8ADA8) */}
          <Icon icon="solar:map-point-linear" className="size-4 text-ds-text-secondary shrink-0" />
          {workMode && <span className="shrink-0">{workMode}</span>}
          {workMode && city && (
            /* Ellipse 12 (4px x 4px, #726B67, 8px gap left and right) */
            <span className="size-1 rounded-full bg-ds-text-muted shrink-0" />
          )}
          {city && <span className="truncate">{city}</span>}
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
