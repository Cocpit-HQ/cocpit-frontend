"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AnalyticsHeader } from '../components/layout/AnalyticsHeader';
import { AnalyticsTabs } from '../components/layout/AnalyticsTabs';
import { CareerTrajectoryHome } from '../components/career-trajectory/CareerTrajectoryHome';
import { ProfileAnalyticsHome } from '../components/profile-analytics/ProfileAnalyticsHome';
import { useAnalyticsStore } from '../store/analytics.store';
import { FeatureGuard } from "@/components/feature-flags";
import { PageContainer } from '@/components/layout/PageContainer';

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const { mainTab } = useAnalyticsStore();
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Extract first name from session; fall back gracefully
  const fullName: string = (session?.user as any)?.name ?? (session?.user as any)?.firstName ?? '';
  const userName = fullName.split(' ')[0] || 'there';

  return (
    <FeatureGuard featureKey="enableAnalyticsTab" moduleName="Analytics">
      <PageContainer maxWidth="figma-wide">
        <div className="flex flex-col items-start w-full gap-[20px]">
          {/* Header Section */}
          <AnalyticsHeader userName={userName} />

          {/* Top-level Tabs */}
          <AnalyticsTabs />

          {/* Tab Content - Career Trajectory is disabled */}
          <ProfileAnalyticsHome />
        </div>
      </PageContainer>
    </FeatureGuard>
  );
}
