"use client";

import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Suspense } from "react";
import { JobSearchPage } from "@/features/jobs/pages/JobSearchPage";
import { MemoryRouter } from "@/components/layout/MemoryRouter";

export default function JobSearchRoute({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const { isCompany, activeProfile } = useActiveProfile();

  if (isCompany && activeProfile?.id) {
    return (
      <Suspense fallback={<div>Loading Jobs...</div>}>
        <MemoryRouter section="jobs" />
        <JobSearchPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div>Loading Jobs...</div>}>
      <MemoryRouter section="jobs" />
      <JobSearchPage />
    </Suspense>
  );
}
