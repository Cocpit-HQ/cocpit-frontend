import React from 'react';
import { RouteGuard } from '@/features/access-denied';

export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  // Personal profile channel discovery page.
  // Companies are denied access to this route.
  return (
    <RouteGuard permission="" requirePersonal>
      {children}
    </RouteGuard>
  );
}
