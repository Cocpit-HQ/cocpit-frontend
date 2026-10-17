'use client';

import React from "react";
import { RouteGuard } from '@/features/access-denied';

export default function JobsRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard permission={["POST_JOBS", "VIEW_APPLICANTS"]} matchAny>
      {children}
    </RouteGuard>
  );
}
