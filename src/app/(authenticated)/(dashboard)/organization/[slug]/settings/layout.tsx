import React from 'react';
import { SettingsLayout } from '@/features/settings/components';
import { RouteGuard } from '@/features/access-denied';

export default function OrganizationSettingsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard permission="SETTINGS" requireCompany>
      <SettingsLayout>{children}</SettingsLayout>
    </RouteGuard>
  );
}
