"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import JobSearchSkeleton from "@/features/jobs/components/skeletons/JobSearchSkeleton";

function JobSearchRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("type", "jobs");
    const rawSearch = params.get("search");
    if (rawSearch && !params.get("q")) {
      params.set("q", rawSearch);
      params.delete("search");
    }
    if (!params.get("returnTo")) {
      params.set("returnTo", "/jobs");
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cocpit_search_origin", "/jobs");
    }
    router.replace(`/search?${params.toString()}`);
  }, [router, searchParams]);

  return <JobSearchSkeleton />;
}

export default function JobSearchRoute() {
  return (
    <Suspense fallback={<JobSearchSkeleton />}>
      <JobSearchRedirect />
    </Suspense>
  );
}
