import React from 'react';
import { SettingsLayout } from '@/features/settings/components';
import { RouteGuard } from '@/features/access-denied';

export default function SettingsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard requirePersonal>
      <SettingsLayout>{children}</SettingsLayout>
    </RouteGuard>
  );
}
