import { redirect } from "next/navigation";

export default async function OrganizationSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    redirect(`/organization/${slug}/dashboard?tab=settings`);
}
