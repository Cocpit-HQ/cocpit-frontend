'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import PublicProfile from '@/features/publicProfile';
import { useMyProfile } from '@/hooks/use-my-profile';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: myProfile } = useMyProfile();
  const { isCompany } = useActiveProfile();
  const userId = params.userId as string;

  const currentUserId = (session?.user as any)?.id || myProfile?.user?.id;
  const currentUserSlug = myProfile?.user?.account_name || (session?.user as any)?.username;

  // Only redirect to personal /profile if the user is in personal mode (!isCompany).
  // When switched to a company, the viewing actor is the Company, so any user
  // (including the logged-in user or other team members) is viewed as a normal public profile.
  const isMe = !isCompany && Boolean(
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
