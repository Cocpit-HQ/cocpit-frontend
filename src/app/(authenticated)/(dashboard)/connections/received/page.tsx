import type { Metadata } from 'next';
import { ConnectionPage } from '@/features/connection/ConnectionPage';

export const metadata: Metadata = {
  title: 'Received Requests — Connections — Cocpit',
  description: 'View all your received connection requests on Cocpit.',
};

export default function ConnectionReceivedRoute() {
  return <ConnectionPage view="expanded" />;
}
