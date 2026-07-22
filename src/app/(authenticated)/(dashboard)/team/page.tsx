import { Suspense } from 'react';
import { ManageTeamPage } from '@/features/manage-team';

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <ManageTeamPage />
    </Suspense>
  );
}
