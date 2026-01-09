'use client';

import { useParams } from 'next/navigation';
import PublicPostsPage from '@/components/profile/PublicPostsPage';

export default function UserPublicPostsPage() {
  const params = useParams();
  const id = params.id as string;

  return <PublicPostsPage userId={id} />;
}
