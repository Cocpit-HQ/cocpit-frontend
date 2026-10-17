import { CompanyAccountSettingsPage } from '@/features/settings';

export default async function OrganizationSettingsRoute({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <CompanyAccountSettingsPage />;
}
