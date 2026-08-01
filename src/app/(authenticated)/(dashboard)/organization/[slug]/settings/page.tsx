import { redirect } from 'next/navigation';

export default async function OrganizationSettingsRoute({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  redirect(`/organization/${resolvedParams.slug}/settings/account`);
}
