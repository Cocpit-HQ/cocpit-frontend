"use client";

import { use } from "react";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ExploreCategoryPage } from "@/features/jobs/pages/ExploreCategoryPage";
import { MemoryRouter } from "@/components/layout/MemoryRouter";

interface PageProps {
  params: Promise<{ category: string }>;
}

const VALID_SLUGS = ["featured", "best-matches", "from-network", "recently-viewed"];

export default function ExploreCategoryRoute({ params }: PageProps) {
  const { category } = use(params);

  if (!category || !VALID_SLUGS.includes(category)) {
    return notFound();
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-ds-text-secondary font-dm-sans text-sm">Loading opportunities...</div>}>
      <MemoryRouter section="jobs" />
      <ExploreCategoryPage category={category} />
    </Suspense>
  );
}

