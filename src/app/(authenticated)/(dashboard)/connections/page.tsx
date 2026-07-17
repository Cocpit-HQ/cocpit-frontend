import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ConnectionPage } from '@/features/connection/ConnectionPage';

export const metadata: Metadata = {
  title: 'Connections — Cocpit',
  description: 'Manage your connection requests and discover people you may know on Cocpit.',
};

export default function ConnectionRoute() {
  return (
    <Suspense fallback={null}>
      <ConnectionPage view="main" />
    </Suspense>
  );
}
