'use client';

import React from "react";
import { FeatureGuard } from "@/components/feature-flags";

export default function JobsRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGuard featureKey="enableJobsBoard" moduleName="Jobs & Careers">
      {children}
    </FeatureGuard>
  );
}
