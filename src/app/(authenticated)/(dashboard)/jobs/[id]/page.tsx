"use client"

import { JobDetailPage } from "@/features/jobs";
import { notFound } from "next/navigation";
import { use } from "react";

export default function JobDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  if (!id) {
    return notFound();
  }

  return <JobDetailPage jobId={id} />;
}
