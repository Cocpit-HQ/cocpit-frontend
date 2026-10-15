import { Suspense } from 'react';
import { ManageTeamPage } from '@/features/org-team';
import RouteGuard from '@/features/access-denied/RouteGuard';

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <RouteGuard permission="TEAMS">
        <ManageTeamPage />
      </RouteGuard>
    </Suspense>
  );
}
