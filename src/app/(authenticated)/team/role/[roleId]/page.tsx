'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { RoleDetailsPage } from '@/features/org-team';
import RouteGuard from '@/features/access-denied/RouteGuard';

export default function RoleDetailRoute() {
  const params = useParams();
  const roleId = params?.roleId as string;

  return (
    <Suspense fallback={null}>
      <RouteGuard permission="TEAMS">
        <RoleDetailsPage roleId={roleId} />
      </RouteGuard>
    </Suspense>
  );
}
