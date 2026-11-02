import React from 'react';
import { InfoIcon, LeftArrowIcon } from '@/components/icons';

interface JobUnavailableScreenProps {
  onBack?: () => void;
  title?: string;
  description?: string;
}

export const JobUnavailableScreen: React.FC<JobUnavailableScreenProps> = ({
  onBack,
  title = "Job no longer available",
  description = "This job may have been filled, removed, or expired.",
}) => {
  return (
    <div className="w-full min-h-screen relative bg-ds-bg text-ds-text-primary font-dm-sans flex flex-col items-center justify-center p-4 selection:bg-ds-accent/30 selection:text-ds-text-primary">
      {/* Top-Left Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="fixed top-[40px] left-[40px] z-[60] inline-flex items-center gap-2 p-0 text-ds-text-primary cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          <LeftArrowIcon
            size={20}
            className="size-5 text-ds-text-primary shrink-0"
          />
          <span className="text-base font-medium font-dm-sans leading-6">Back</span>
        </button>
      )}

      {/* Center Container */}
      <div className="w-full max-w-[800px] flex flex-col items-center justify-center gap-6 py-28 text-center select-none animate-in fade-in duration-200">
        {/* IconFrame: 64x64px, padding 16px, bg #1A1A20 (--ds-surface-1), rounded-full */}
        <div className="w-16 h-16 p-4 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
          <InfoIcon size={32} className="w-8 h-8 text-ds-text-secondary shrink-0" fill="currentColor" />
        </div>

        {/* Text Container: gap-2.5 */}
        <div className="flex flex-col items-center gap-2.5 max-w-sm">
          <h2 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6 text-center">
            {title}
          </h2>
          <p className="text-ds-text-secondary text-sm font-normal font-dm-sans leading-5 text-center">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobUnavailableScreen;
