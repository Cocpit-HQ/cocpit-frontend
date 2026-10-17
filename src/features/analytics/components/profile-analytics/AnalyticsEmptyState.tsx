import React from 'react';
import { Icon } from '@iconify/react';

interface AnalyticsEmptyStateProps {
  title?: string;
  message?: string;
}

export const AnalyticsEmptyState = ({ 
  title = "No data available", 
  message = "There is not enough data for this period yet. Check back later as your profile gains traction." 
}: AnalyticsEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-gray-50 border border-gray-100 rounded-[24px] mt-6 p-6">
      <div className="w-[64px] h-[64px] bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
        <Icon icon="lucide:bar-chart-2" className="w-[32px] h-[32px]" />
      </div>
      <h3 className="text-[18px] font-medium text-gray-900 font-['Poppins'] mb-2">{title}</h3>
      <p className="text-[14px] text-gray-500 font-['Poppins'] text-center max-w-[400px]">
        {message}
      </p>
    </div>
  );
};
