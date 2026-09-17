'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import PublicProfile from '@/features/publicProfile';
import { useMyProfile } from '@/hooks/use-my-profile';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: myProfile } = useMyProfile();
  const userId = params.userId as string;

  const currentUserId = (session?.user as any)?.id || myProfile?.user?.id;
  const currentUserSlug = myProfile?.user?.account_name || (session?.user as any)?.username;

  const isMe = Boolean(
    userId && currentUserId && (
      String(userId).toLowerCase() === String(currentUserId).toLowerCase() ||
      (currentUserSlug && String(userId).toLowerCase() === String(currentUserSlug).toLowerCase())
    )
  );

  useEffect(() => {
    if (isMe) {
      router.replace('/profile');
    }
  }, [isMe, router]);

  if (isMe) {
    return null;
  }

  return <PublicProfile userId={userId} />;
}
