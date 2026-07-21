'use client';

import React from 'react';
import { RouteGuard } from '@/features/access-denied';

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission="TEAMS" requireCompany>
      {children}
    </RouteGuard>
  );
}
