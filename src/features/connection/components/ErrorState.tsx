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
      className="conn-error"
      role="alert"
      aria-live="assertive"
    >
      {/* Info / warning circle icon */}
      <Icon icon="material-symbols-light:info-outline" className="conn-error__icon" aria-hidden="true" />

      <h3 className="conn-error__title">{title}</h3>
      <p  className="conn-error__subtitle">{subtitle}</p>

      {onRetry && (
        <button
          className="conn-btn conn-btn--accept"
          onClick={onRetry}
          aria-label="Retry loading connections"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
