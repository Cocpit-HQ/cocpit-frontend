'use client';

import { useParams } from 'next/navigation';
import PublicProfile from '@/features/publicProfile';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  // Render the self-contained PublicProfile component, passing the user ID.
  // The PublicProfile component will handle its own data fetching, loading, and error states.
  return <PublicProfile userId={userId} />;
}
