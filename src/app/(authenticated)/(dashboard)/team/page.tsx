"use client";

import { Suspense } from 'react';
import { ManageTeamPage } from '@/features/org-team';
import RouteGuard from '@/features/access-denied/RouteGuard';
import { FeatureGuard } from '@/components/feature-flags';

export default function TeamPage() {
  return (
    <FeatureGuard featureKey="enableTeamsModule" moduleName="Teams">
      <Suspense fallback={null}>
        <RouteGuard permission="TEAMS">
          <ManageTeamPage />
        </RouteGuard>
      </Suspense>
    </FeatureGuard>
  );
}
