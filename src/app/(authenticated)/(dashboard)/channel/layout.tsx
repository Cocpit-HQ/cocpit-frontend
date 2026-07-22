import React from 'react';
import { RouteGuard } from '@/features/access-denied';

export default function ChannelLayout({ children }: { children: React.ReactNode }) {
  // We can let the client-side RouteGuard check the specific "CHANNELS" permission
  // and require a company profile.
  return (
    <RouteGuard permission="CHANNEL" requireCompany>
      {children}
    </RouteGuard>
  );
}
