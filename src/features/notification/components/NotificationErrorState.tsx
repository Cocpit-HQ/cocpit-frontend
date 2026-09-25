import React from 'react';
import { InfoIcon } from '@/components/icons';

interface NotificationErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const NotificationErrorState: React.FC<NotificationErrorStateProps> = ({
  title = 'Unable to load notification',
  description = 'Something went wrong. Please check your connection and try again',
  onRetry,
  retryText = 'Retry',
}) => {
  return (
    <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center select-none py-12">
      {/* IconFrame — 56×56, bg-ds-surface-1, rounded-full */}
      <div className="mb-6 shrink-0 flex items-center justify-center w-14 h-14 bg-ds-surface-1 rounded-full">
        <InfoIcon size={32} className="text-ds-text-muted" />
      </div>

      {/* Heading */}
      <h3 className="ds-text-body-2 font-['DM_Sans'] text-ds-text-primary m-0 mb-1 p-0">
        {title}
      </h3>

      {/* Subtitle */}
      <p className="ds-text-secondary font-['DM_Sans'] text-ds-text-secondary max-w-[360px] m-0 p-0">
        {description}
      </p>

      {/* Retry Button — 36px height, bg-ds-accent */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 h-[36px] px-6 rounded-full bg-ds-accent text-white ds-text-secondary-1 font-['DM_Sans'] hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          {retryText}
        </button>
      )}
    </div>
  );
};

export default NotificationErrorState;
