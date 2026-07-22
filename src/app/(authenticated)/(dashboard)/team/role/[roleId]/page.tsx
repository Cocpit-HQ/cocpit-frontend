'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { RoleDetailsPage } from '@/features/manage-team';

export default function RoleDetailRoute() {
  const params = useParams();
  const roleId = params?.roleId as string;

  return (
    <Suspense fallback={null}>
      <RoleDetailsPage roleId={roleId} />
    </Suspense>
  );
}
