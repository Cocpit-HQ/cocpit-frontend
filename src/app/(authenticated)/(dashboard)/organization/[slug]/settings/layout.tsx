import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { RouteGuard } from '@/features/access-denied';
import { FeatureGuard } from '@/components/feature-flags';

export default function OrganizationSettingsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureGuard featureKey="enableOrgSettingsModule" moduleName="Organization Settings">
      <RouteGuard permission="SETTINGS" requireCompany>
        <SettingsLayout>{children}</SettingsLayout>
      </RouteGuard>
    </FeatureGuard>
  );
}
