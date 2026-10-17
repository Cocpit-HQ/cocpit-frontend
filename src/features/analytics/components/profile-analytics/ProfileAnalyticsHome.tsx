import React from 'react';
import { OverviewTab } from './OverviewTab';
import { ContentTab } from './ContentTab';
import { AudienceTab } from './AudienceTab';
import { OpportunitiesTab } from './OpportunitiesTab';
import { useAnalyticsStore, ProfileSubTab } from '@/store/analytics.store';

export function ProfileAnalyticsHome() {
  const { profileSubTab, setProfileSubTab } = useAnalyticsStore();

  const tabs: ProfileSubTab[] = ['Overview', 'Content', 'Audience', 'Opportunities'];

  return (
    <div className="w-full">
      {/* Sub Navigation */}
      <div className="flex flex-row items-start gap-4 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setProfileSubTab(tab)}
            className={`flex flex-row justify-center items-center px-4 py-2 h-[36px] text-[14px] font-['Poppins'] whitespace-nowrap transition-colors box-border ${
              profileSubTab === tab
                ? 'font-semibold text-[#6366F1] border-b border-[#6366F1] drop-shadow-[0_1px_4px_rgba(99,102,241,0.08)]'
                : 'font-normal text-black rounded-[24px] hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {profileSubTab === 'Overview' && <OverviewTab />}
      {profileSubTab === 'Content' && <ContentTab />}
      {profileSubTab === 'Audience' && <AudienceTab />}
      {profileSubTab === 'Opportunities' && <OpportunitiesTab />}
    </div>
  );
}
