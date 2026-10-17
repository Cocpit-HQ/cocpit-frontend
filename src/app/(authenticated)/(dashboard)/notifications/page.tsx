'use client';

import React, { Suspense } from 'react';
import { NotificationsPage } from '@/features/notification';
import { FeatureGuard } from '@/components/feature-flags';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export default function NotificationsRoute() {
  const { isCompany } = useActiveProfile();
  const featureKey = isCompany ? "enableOrgNotificationsModule" : "enableNotificationsModule";
  const moduleName = isCompany ? "Organization Notifications" : "Notifications";

  return (
    <FeatureGuard featureKey={featureKey} moduleName={moduleName}>
      <Suspense fallback={<div className="fixed inset-0 bg-ds-bg" />}>
        <NotificationsPage />
      </Suspense>
    </FeatureGuard>
  );
}
