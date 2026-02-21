"use client";

import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Suspense } from "react";
import JobsPage from "@/components/jobs/JobsPage";
import CompanyJobsPage from "@/components/jobs/company/CompanyJobsPage";

export default function JobsRoute({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const { isCompany, activeProfile } = useActiveProfile();

  if (isCompany && activeProfile?.id) {
    return (
      <Suspense fallback={<div>Loading Jobs...</div>}>
        <CompanyJobsPage companyId={activeProfile.id} searchParams={searchParams} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div>Loading Jobs...</div>}>
      <JobsPage searchParams={searchParams} />
    </Suspense>
  );
}

