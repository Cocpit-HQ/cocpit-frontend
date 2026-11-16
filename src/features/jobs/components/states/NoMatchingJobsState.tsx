import React from 'react';
import { BriefcaseIcon } from '@/components/icons';

interface NoMatchingJobsStateProps {
  onClearFilters?: () => void;
  title?: string;
  subtitle?: string;
  showClearButton?: boolean;
}

export const NoMatchingJobsState: React.FC<NoMatchingJobsStateProps> = ({
  onClearFilters,
  title = "No matching jobs found",
  subtitle = "We couldn't find jobs matching your selected filters",
  showClearButton = true,
}) => {
  return (
    <div className="w-full max-w-[800px] pt-14 pb-28 flex flex-col justify-center items-center gap-2 select-none animate-in fade-in duration-200">
      {/* Icon Frame: 64x64px (w-16 h-16), p-3, rounded-full, bg-ds-surface-1 */}
      <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
        <BriefcaseIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
      </div>

      {/* Title */}
      <h3 className="text-center justify-center text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
        {title}
      </h3>

      {/* Subtitle */}
      <p className="w-80 text-center justify-center text-ds-text-secondary text-sm font-normal font-dm-sans leading-5">
        {subtitle}
      </p>

      {/* Clear all filters action pill button */}
      {showClearButton && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="w-[132px] h-9 px-3 py-1.5 bg-ds-surface-1 hover:bg-ds-surface-2 rounded-[100px] inline-flex justify-center items-center gap-2.5 text-ds-text-primary transition-colors cursor-pointer select-none border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent shrink-0"
        >
          <span className="w-[108px] h-6 text-center text-ds-text-primary text-base font-medium font-dm-sans leading-6 whitespace-nowrap">
            Clear all filters
          </span>
        </button>
      )}
    </div>
  );
};

export default NoMatchingJobsState;

