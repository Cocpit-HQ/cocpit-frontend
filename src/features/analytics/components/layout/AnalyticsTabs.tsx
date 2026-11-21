import React from 'react';
import { useAnalyticsStore } from '../../store/analytics.store';
import { ANALYTICS_MAIN_TABS } from '../../constants/analytics.constants';
import { UnderlineTabs } from '@/components/ui/UnderlineTabs';

export type AnalyticsTabType = 'career-trajectory' | 'profile-analytics';

export function AnalyticsTabs() {
  const { mainTab: activeTab, setMainTab: onTabChange } = useAnalyticsStore();

  return (
    <UnderlineTabs
      tabs={ANALYTICS_MAIN_TABS}
      activeTab={activeTab}
      onChange={(id) => onTabChange(id as AnalyticsTabType)}
      className="max-w-[846.67px]"
      size="md"
    />
  );
}
