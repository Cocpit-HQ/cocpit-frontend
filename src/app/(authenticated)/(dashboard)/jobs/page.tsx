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

  const isCompanyStored = typeof window !== "undefined" && (() => {
    try {
      const stored = sessionStorage.getItem("cocpit_active_profile");
      if (stored) {
        return JSON.parse(stored)?.type === "COMPANY";
      }
    } catch (e) {}
    return false;
  })();

  const isCompanyMode = Boolean(isCompany || isCompanyStored || activeProfile?.type === "COMPANY");

  const isMyListingsOrCompany = Boolean(
    isCompanyMode ||
    (typeof window !== "undefined" && (
      window.location.search.includes("My+Listings") ||
      window.location.search.includes("My%20Listings") ||
      window.location.search.includes("tab=My") ||
      window.location.search.includes("view=")
    ))
  );

  return (
    <FeatureGuard featureKey="enableJobsBoard" moduleName="Jobs & Careers">
      <Suspense fallback={isMyListingsOrCompany ? null : <JobsPageSkeleton />}>
        <MemoryRouter section="jobs" />
        <JobsPage searchParams={searchParams} isCompanyMode={isCompanyMode} />
      </Suspense>
    </FeatureGuard>
  );
}
