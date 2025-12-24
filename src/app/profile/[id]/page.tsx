import { users } from '@/lib/data/users';
import PublicProfile from '@/components/profile/PublicProfile';
import { notFound } from 'next/navigation';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = users.find(u => u.id === id);

  if (!user) {
    notFound();
  }

  return <PublicProfile user={user} />;
}
