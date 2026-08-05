import React from 'react';
import { SettingsLayout } from '@/features/settings/components';

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
