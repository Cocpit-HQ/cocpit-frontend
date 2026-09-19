"use client";

import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Suspense } from "react";
import { JobsPage } from "@/features/jobs/pages/JobsPage";
import { MemoryRouter } from "@/components/layout/MemoryRouter";
import { FeatureGuard } from "@/components/feature-flags";

export default function JobsRoute({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const { isCompany, activeProfile } = useActiveProfile();

  return (
    <FeatureGuard featureKey="enableJobsBoard" moduleName="Jobs & Careers">
      <Suspense fallback={<div>Loading Jobs...</div>}>
        <MemoryRouter section="jobs" />
        <JobsPage searchParams={searchParams} isCompanyMode={isCompany && Boolean(activeProfile?.id)} />
      </Suspense>
    </FeatureGuard>
  );
}
