'use client';

import { Icon } from '@iconify/react';

interface ErrorStateProps {
  title?:    string;
  subtitle?: string;
  onRetry?:  () => void;
}

export function ErrorState({
  title    = 'Unable to Load',
  subtitle = 'Something went wrong while loading your connections.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-5 text-center animate-in fade-in"
      role="alert"
      aria-live="assertive"
    >
      {/* Info / warning circle icon */}
      <Icon icon="material-symbols-light:info-outline" className="w-20 h-20 text-muted-foreground mb-4" aria-hidden="true" />

      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed">{subtitle}</p>

      {onRetry && (
        <button
          className="inline-flex items-center justify-center h-10 w-[100px] rounded-[24px] text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_1px_2px_rgba(99,102,241,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 mt-6"
          onClick={onRetry}
          aria-label="Retry loading connections"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
