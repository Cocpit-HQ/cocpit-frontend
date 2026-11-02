"use client";

import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Suspense } from "react";
import { JobsPage } from "@/features/jobs/pages/JobsPage";
import { MemoryRouter } from "@/components/layout/MemoryRouter";
import { FeatureGuard } from "@/components/feature-flags";
import JobsPageSkeleton from "@/features/jobs/components/skeletons/JobsPageSkeleton";

export default function JobsRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { isCompany, activeProfile } = useActiveProfile();

  return (
    <FeatureGuard featureKey="enableJobsBoard" moduleName="Jobs & Careers">
      <Suspense fallback={<JobsPageSkeleton />}>
        <MemoryRouter section="jobs" />
        <JobsPage searchParams={searchParams} isCompanyMode={isCompany && Boolean(activeProfile?.id)} />
      </Suspense>
    </FeatureGuard>
  );
}
