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
  OrganizationsSettingsPage
} from '@/features/settings';

export default async function SettingsTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const resolvedParams = await params;
  const tab = resolvedParams.tab;

  switch (tab) {
    case 'account':
      return <AccountSettingsPage />;
    case 'appearance':
      return <AppearanceSettingsPage />;
    case 'notifications':
      return <NotificationSettingsPage />;
    case 'privacy':
      return <PrivacySettingsPage />;
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
    case 'organizations':
      return <OrganizationsSettingsPage />;
    // Handle sub-routes manually if they are hit as [tab]
    case 'account-password':
      return <ManagePasswordPage />;
    case 'account-email':
      return <ManageEmailPage />;
    case 'account-phone':
      return <ManagePhonePage />;
    default:
      redirect('/settings/account');
  }
}
