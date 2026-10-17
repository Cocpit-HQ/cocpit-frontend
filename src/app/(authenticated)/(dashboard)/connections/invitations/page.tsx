import type { Metadata } from 'next';
import { ConnectionPage } from '@/features/connection/ConnectionPage';

export const metadata: Metadata = {
  title: 'Invitations — Connections — Cocpit',
  description: 'View all your page and channel invitations on Cocpit.',
};

export default function ConnectionInvitationsRoute() {
  return <ConnectionPage view="expanded" initialTab="invitations" />;
}
