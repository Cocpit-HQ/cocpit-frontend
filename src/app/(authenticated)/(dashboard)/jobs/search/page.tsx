"use client";

import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Suspense } from "react";
import { JobSearchPage } from "@/features/jobs/pages/JobSearchPage";
import { MemoryRouter } from "@/components/layout/MemoryRouter";
import JobSearchSkeleton from "@/features/jobs/components/skeletons/JobSearchSkeleton";

export default function JobSearchRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { isCompany, activeProfile } = useActiveProfile();

  if (isCompany && activeProfile?.id) {
    return (
      <Suspense fallback={<JobSearchSkeleton />}>
        <MemoryRouter section="jobs" />
        <JobSearchPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<JobSearchSkeleton />}>
      <MemoryRouter section="jobs" />
      <JobSearchPage />
    </Suspense>
  );
}
