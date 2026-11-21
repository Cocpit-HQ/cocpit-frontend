'use client';

import React from "react";
import { FeatureGuard } from "@/components/feature-flags";
import { RouteGuard } from "@/features/access-denied";

export default function JobsRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGuard featureKey="enableJobsBoard" moduleName="Jobs & Careers">
      <RouteGuard permission={["JOBS", "POST_JOBS"]} matchAny>
        {children}
      </RouteGuard>
    </FeatureGuard>
  );
}
