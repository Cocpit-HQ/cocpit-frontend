import React from 'react';
import { Icon } from '@iconify/react';

interface AnalyticsErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const AnalyticsErrorState = ({ message = "Failed to load analytics data.", onRetry }: AnalyticsErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[300px] bg-red-50/50 border border-red-100 rounded-[24px] mt-6 p-6">
      <div className="w-[64px] h-[64px] bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
        <Icon icon="lucide:alert-circle" className="w-[32px] h-[32px]" />
      </div>
      <h3 className="text-[18px] font-medium text-gray-900 font-['Poppins'] mb-2">Something went wrong</h3>
      <p className="text-[14px] text-gray-500 font-['Poppins'] text-center mb-6">
        {message}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-white border border-gray-200 shadow-sm rounded-full text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors font-['Poppins']"
        >
          Try again
        </button>
      )}
    </div>
  );
};
