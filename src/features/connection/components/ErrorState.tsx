'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Unable to Load',
  subtitle = 'Something went wrong while loading your connections.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-5 text-center animate-in fade-in font-dm-sans select-none"
      role="alert"
      aria-live="assertive"
    >
      <Icon
        icon="material-symbols-light:info-outline"
        className="w-16 h-16 text-ds-error mb-4 stroke-1"
        aria-hidden="true"
      />

      <h3 className="text-[16px] font-medium text-ds-text-primary mb-1">{title}</h3>
      <p className="text-[13px] text-ds-text-secondary max-w-[320px] leading-relaxed">
        {subtitle}
      </p>

      {onRetry && (
        <button
          type="button"
          className="inline-flex items-center justify-center h-[36px] px-5 py-1.5 rounded-full bg-ds-accent text-ds-text-primary font-dm-sans font-medium text-[14px] hover:opacity-90 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ds-accent cursor-pointer mt-5"
          onClick={onRetry}
          aria-label="Retry loading connections"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
export default ErrorState;
