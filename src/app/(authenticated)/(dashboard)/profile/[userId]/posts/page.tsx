'use client';

import { useParams } from 'next/navigation';
import PublicPostsPage from '@/components/profile/PublicPostsPage';

export default function UserPublicPostsPage() {
  const params = useParams();
  const userId = params.userId as string;

  return <PublicPostsPage userId={userId} />;
}
