"use client";

import { Suspense } from 'react';
import { ConnectionPage } from '@/features/connection/ConnectionPage';
import { FeatureGuard } from '@/components/feature-flags';

export default function ConnectionRoute() {
  return (
    <FeatureGuard featureKey="enableConnectionsTab" moduleName="Networking & Connections">
      <Suspense fallback={null}>
        <ConnectionPage view="main" />
      </Suspense>
    </FeatureGuard>
  );
}
