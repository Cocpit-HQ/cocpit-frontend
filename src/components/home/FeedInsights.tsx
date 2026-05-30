"use client";

import Link from "next/link";
import { Bookmark, BriefcaseBusiness, Flame, Plus } from "lucide-react";

const jobMatches = [
  {
    id: "google-swe",
    title: "Software Engineer Intern @ Google",
    meta: "Remote - Fresher",
  },
  {
    id: "startup-uiux",
    title: "UI/UX Designer @ Startup",
    meta: "Hybrid - Pune",
  },
];

export function ApplicantInsightCard() {
  return (
    <section className="feed-card-shell flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Flame className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-foreground">
            You&apos;re in top 20% of applicants in UI/UX
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Add missing skills: Figma, Design Systems
          </p>
        </div>
      </div>
      <Link
        href="/profile/edit"
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add skills
      </Link>
    </section>
  );
}

export function JobMatchesCard() {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-medium text-foreground">Best Matches for You Today</h2>
        <p className="mt-1 text-xs text-muted-foreground">Based on your profile activity.</p>
      </div>

      <div className="space-y-3">
        {jobMatches.map((job) => (
          <Link
            key={job.id}
            href="/jobs"
            className="feed-card-shell flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-foreground">{job.title}</h3>
              <p className="mt-1 truncate text-xs text-muted-foreground">{job.meta}</p>
            </div>
            <Bookmark className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <Link
        href="/jobs"
        className="block rounded-full py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        View more
      </Link>
    </section>
  );
}

export function CompactJobRecommendation() {
  return (
    <section className="feed-card-shell flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-foreground">UI/UX Designer @ Startup</h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">Hybrid - Pune</p>
        </div>
      </div>
      <Bookmark className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </section>
  );
}
