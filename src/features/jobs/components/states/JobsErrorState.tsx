import React from 'react';
import { InfoIcon } from '@/components/icons';

interface JobsErrorStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export const JobsErrorState: React.FC<JobsErrorStateProps> = ({
  title = 'Unable to load jobs',
  message = "We couldn't load Jobs at the moment.",
  className = '',
}) => {
  return (
    <div
      className={`w-full max-w-[800px] px-5 py-28 flex flex-col justify-center items-center gap-6 select-none animate-in fade-in duration-200 ${className}`}
    >
      {/* IconFrame: 64x64px, padding 16px, bg #1A1A20 (--ds-surface-1), rounded-full */}
      <div className="w-16 h-16 p-4 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
        <InfoIcon size={32} className="w-8 h-8 text-ds-text-muted shrink-0" fill="currentColor" />
      </div>

      {/* Text Container: self-stretch flex flex-col items-center gap-2.5 */}
      <div className="self-stretch flex flex-col justify-start items-center gap-2.5 text-center">
        <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
          {title}
        </h3>
        <p className="w-full max-w-sm text-ds-text-secondary text-sm font-normal font-dm-sans leading-5">
          {message}
        </p>
      </div>
    </div>
  );
};

export default JobsErrorState;

