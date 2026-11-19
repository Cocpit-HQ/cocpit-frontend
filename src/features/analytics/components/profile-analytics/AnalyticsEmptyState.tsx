import React from 'react';
import { Icon } from '@/components/icons';

interface AnalyticsEmptyStateProps {
  title?: string;
  message?: string;
}

export const AnalyticsEmptyState = ({ 
  title = "No data available", 
  message = "There is not enough data for this period yet. Check back later as your profile gains traction." 
}: AnalyticsEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full py-16 px-4 text-center font-['DM_Sans']">
      <div className="flex items-center justify-center mb-4 text-ds-text-muted">
        <Icon name="analytics" className="w-[48px] h-[48px]" />
      </div>
      <h3 className="text-[18px] font-medium text-ds-text-primary mb-2 m-0 leading-[26px]">
        {title}
      </h3>
      <p className="text-[14px] text-ds-text-secondary max-w-[420px] m-0 leading-[20px]">
        {message}
      </p>
    </div>
  );
};
