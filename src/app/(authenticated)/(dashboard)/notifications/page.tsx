'use client';

import React, { Suspense } from 'react';
import { NotificationsPage } from '@/features/notification';

export default function NotificationsRoute() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-ds-bg" />}>
      <NotificationsPage />
    </Suspense>
  );
}
