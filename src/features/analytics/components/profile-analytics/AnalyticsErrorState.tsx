import React from 'react';
import { Icon } from '@/components/icons';

interface AnalyticsErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const AnalyticsErrorState = ({ message = "Failed to load analytics data.", onRetry }: AnalyticsErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-ds-surface-1 border border-ds-error/30 rounded-[24px] mt-6 p-6 shadow-sm">
      <div className="w-[64px] h-[64px] bg-ds-error/10 text-ds-error border border-ds-error/20 rounded-full flex items-center justify-center mb-4">
        <Icon name="alert-circle" className="w-[32px] h-[32px]" />
      </div>
      <h3 className="text-[18px] font-medium text-ds-text-primary font-['DM_Sans'] mb-2">Something went wrong</h3>
      <p className="text-[14px] text-ds-text-secondary font-['DM_Sans'] text-center mb-6">
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-ds-surface-2 border border-ds-border shadow-sm rounded-full text-[14px] font-medium text-ds-text-primary hover:bg-ds-surface-1 transition-colors font-['DM_Sans']"
        >
          Try again
        </button>
      )}
    </div>
  );
};
