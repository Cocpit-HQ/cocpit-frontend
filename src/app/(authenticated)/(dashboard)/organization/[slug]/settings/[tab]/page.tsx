import { redirect } from 'next/navigation';
import { 
  AccountSettingsPage,
  ActivitySettingsPage,
  AppearanceSettingsPage,
  BlockedSettingsPage,
  LegalSettingsPage,
  NotificationSettingsPage,
  PrivacySettingsPage,
  ReportsSettingsPage,
  SavedSettingsPage,
  SupportSettingsPage,
  ManagePasswordPage,
  ManageEmailPage,
  ManagePhonePage,
  CompanyAccountSettingsPage,
  CompanyNotificationSettingsPage,
  CompanyPrivacySettingsPage
} from '@/features/settings';
import { FeatureGuard } from '@/components/feature-flags';

export default async function OrganizationSettingsTabPage({ params }: { params: Promise<{ slug: string, tab: string }> }) {
  const resolvedParams = await params;
  const tab = resolvedParams.tab;

  switch (tab) {
    case 'account':
      return <CompanyAccountSettingsPage />;
    case 'appearance':
      return <AppearanceSettingsPage />;
    case 'notifications':
      return (
        <FeatureGuard featureKey="enableOrgNotificationsModule" moduleName="Company Notifications">
          <CompanyNotificationSettingsPage />
        </FeatureGuard>
      );
    case 'privacy':
      return <CompanyPrivacySettingsPage />;
    case 'security':
      redirect(`/organization/${resolvedParams.slug}/settings/privacy`);
    case 'saved':
      return <SavedSettingsPage />;
    case 'activity':
      return <ActivitySettingsPage />;
    case 'reports':
      return <ReportsSettingsPage />;
    case 'blocked':
      return <BlockedSettingsPage />;
    case 'support':
      return <SupportSettingsPage />;
    case 'legal':
      return <LegalSettingsPage />;
    case 'account-password':
    case 'account-add-password':
      redirect(`/organization/${resolvedParams.slug}/settings/account`);
    case 'account-email':
      return <ManageEmailPage />;
    case 'account-phone':
      return <ManagePhonePage />;
    default:
      redirect(`/organization/${resolvedParams.slug}/settings/account`);
  }
}
