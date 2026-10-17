import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
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
