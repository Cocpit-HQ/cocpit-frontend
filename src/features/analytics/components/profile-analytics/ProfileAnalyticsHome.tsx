import React, { useState } from 'react';
import { MOCK_PROFILE_ANALYTICS } from '../../data/mock-data';
import { OverviewTab } from './OverviewTab';
import { ContentTab } from './ContentTab';

import { AudienceTab } from './AudienceTab';
import { OpportunitiesTab } from './OpportunitiesTab';

type SubTab = 'Overview' | 'Content' | 'Audience' | 'Opportunities';

export function ProfileAnalyticsHome() {
  const [activeTab, setActiveTab] = useState<SubTab>('Overview');
  const data = MOCK_PROFILE_ANALYTICS;

  return (
    <div className="w-full">
      {/* Sub Navigation */}
      <div className="flex flex-row items-start gap-4 mb-6 overflow-x-auto scrollbar-hide">
        {(['Overview', 'Content', 'Audience', 'Opportunities'] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-row justify-center items-center px-4 py-2 h-[36px] text-[14px] font-['Poppins'] whitespace-nowrap transition-colors box-border ${
              activeTab === tab
                ? 'font-semibold text-[#6366F1] border-b border-[#6366F1] drop-shadow-[0_1px_4px_rgba(99,102,241,0.08)]'
                : 'font-normal text-black rounded-[24px] hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>


      {/* Tab Content */}
      {activeTab === 'Overview' && <OverviewTab data={data.overview} />}
      {activeTab === 'Content' && <ContentTab data={data.content} />}
      {activeTab === 'Audience' && <AudienceTab data={data.audience} />}
      {activeTab === 'Opportunities' && <OpportunitiesTab data={data.opportunities} />}
    </div>
  );
}
