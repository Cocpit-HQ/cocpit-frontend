import type { Metadata } from 'next';
import { ConnectionPage } from '@/features/connection/ConnectionPage';

export const metadata: Metadata = {
  title: 'Sent Requests — Connections — Cocpit',
  description: 'View all your sent connection requests on Cocpit.',
};

export default function ConnectionSentRoute() {
  return <ConnectionPage view="expanded" initialTab="sent" />;
}
