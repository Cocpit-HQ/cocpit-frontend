import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { OverviewTab } from './OverviewTab';
import { ContentTab } from './ContentTab';
import { AudienceTab } from './AudienceTab';
import { OpportunitiesTab } from './OpportunitiesTab';
import { useAnalyticsStore, ProfileSubTab } from '../../store/analytics.store';
import { PROFILE_SUB_TABS } from '../../constants/analytics.constants';
import { UnderlineTabs, TabItem } from '@/components/ui/UnderlineTabs';

const SUB_TAB_ITEMS: TabItem<ProfileSubTab>[] = PROFILE_SUB_TABS.map((tab) => ({
  id: tab,
  label: tab,
}));

export function ProfileAnalyticsHome() {
  const { profileSubTab, setProfileSubTab } = useAnalyticsStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Sync tab from URL on mount / popstate
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const matched = PROFILE_SUB_TABS.find(
        (t) => t.toLowerCase() === tabParam.toLowerCase()
      );
      if (matched && matched !== profileSubTab) {
        setProfileSubTab(matched);
      }
    }
  }, [searchParams]);

  const handleTabChange = (newTab: ProfileSubTab) => {
    setProfileSubTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    params.delete('view'); // clear sub-view on tab switch
    router.replace(`/analytics?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col items-start w-full max-w-[846.67px] gap-[20px]">
      {/* Page Header */}
      <div className="flex flex-col items-start gap-[4px] w-full">
        <h2 className="text-[16px] font-semibold text-ds-text-primary font-['DM_Sans'] leading-[24px] m-0">
          Profile analytics
        </h2>
        <p className="text-[14px] font-normal text-ds-text-secondary font-['DM_Sans'] leading-[20px] m-0">
          Track your professional narrative and engagement metrics.
        </p>
      </div>

      {/* Sub Navigation */}
      <UnderlineTabs
        tabs={SUB_TAB_ITEMS}
        activeTab={profileSubTab}
        onChange={handleTabChange}
        size="md"
      />

      {/* Tab Content */}
      <div className="w-full">
        {profileSubTab === 'Overview' && <OverviewTab />}
        {profileSubTab === 'Content' && <ContentTab />}
        {profileSubTab === 'Audience' && <AudienceTab />}
        {profileSubTab === 'Opportunities' && <OpportunitiesTab />}
      </div>
    </div>
  );
}
