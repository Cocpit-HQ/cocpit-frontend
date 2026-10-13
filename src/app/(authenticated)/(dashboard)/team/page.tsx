import { Suspense } from 'react';
import { ManageTeamPage } from '@/features/org-team';

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <ManageTeamPage />
    </Suspense>
  );
}
