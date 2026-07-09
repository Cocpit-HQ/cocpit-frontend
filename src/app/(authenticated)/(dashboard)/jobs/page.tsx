"use client";

import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Suspense } from "react";
import { JobsPage } from "@/features/jobs/pages/JobsPage";
import { MemoryRouter } from "@/components/layout/MemoryRouter";

export default function JobsRoute({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const { isCompany, activeProfile } = useActiveProfile();

  if (isCompany && activeProfile?.id) {
    return (
      <Suspense fallback={<div>Loading Jobs...</div>}>
        <MemoryRouter section="jobs" />
        <JobsPage searchParams={searchParams} isCompanyMode={true} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div>Loading Jobs...</div>}>
      <MemoryRouter section="jobs" />
      <JobsPage searchParams={searchParams} />
    </Suspense>
  );
}

