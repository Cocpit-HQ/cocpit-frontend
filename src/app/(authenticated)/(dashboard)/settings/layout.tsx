import React from 'react';
import { SettingsLayout } from '@/features/settings/components';
import { RouteGuard } from '@/features/access-denied';
import { FeatureGuard } from '@/components/feature-flags';

export default function SettingsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard requirePersonal>
      <FeatureGuard featureKey="enableSettingsPage" moduleName="Settings & Privacy">
        <SettingsLayout>{children}</SettingsLayout>
      </FeatureGuard>
    </RouteGuard>
  );
}
