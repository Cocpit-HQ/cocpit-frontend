import React from 'react';
import { SettingsLayout } from '@/features/settings/components';

export default function OrganizationSettingsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
