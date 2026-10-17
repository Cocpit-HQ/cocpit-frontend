import React from 'react';
import { useAnalyticsStore } from '@/store/analytics.store';

export type AnalyticsTabType = 'career-trajectory' | 'profile-analytics';

export function AnalyticsTabs() {
  const { mainTab: activeTab, setMainTab: onTabChange } = useAnalyticsStore();
  
  return (
    <div className="flex flex-row items-start gap-4 h-[40px]">
      <button
        onClick={() => onTabChange('career-trajectory')}
        className={`flex items-center justify-center px-6 h-[40px] rounded-[24px] text-[14px] font-['Poppins'] transition-colors box-border ${
          activeTab === 'career-trajectory'
            ? 'bg-[#EEF2FF] border border-[#EEF2FF] font-medium text-[#6366F1]'
            : 'bg-white border border-[#818CF8] font-normal text-[#818CF8] hover:bg-indigo-50'
        }`}
      >
        Career trajectory
      </button>
      <button
        onClick={() => onTabChange('profile-analytics')}
        className={`flex items-center justify-center px-6 h-[40px] rounded-[24px] text-[14px] font-['Poppins'] transition-colors box-border ${
          activeTab === 'profile-analytics'
            ? 'bg-[#EEF2FF] border border-[#EEF2FF] font-medium text-[#6366F1]'
            : 'bg-white border border-[#818CF8] font-normal text-[#818CF8] hover:bg-indigo-50'
        }`}
      >
        Profile analytics
      </button>
    </div>
  );
}
