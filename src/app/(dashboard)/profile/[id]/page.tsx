'use client';

import { useParams } from 'next/navigation';
import PublicProfile from '@/components/profile/PublicProfile';

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;

  // Render the self-contained PublicProfile component, passing the user ID.
  // The PublicProfile component will handle its own data fetching, loading, and error states.
  return <PublicProfile userId={id} />;
}
