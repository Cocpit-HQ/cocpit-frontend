"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { LeftArrowIcon } from "@/components/icons";
import { X } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Job } from "../types/jobs.types";
import { JobCard } from "../components/cards/JobCard";
import JobCardSkeleton from "../components/skeletons/JobCardSkeleton";
import { ApplyJobModal } from "../components/modals/ApplyJobModal";
import { getExploreSectionPaginated } from "../services/jobs.service";
import { useJobs } from "../hooks/useJobs";
import { useJobStore } from "@/store/job.store";

interface ExploreCategoryPageProps {
  category: string;
}

const CATEGORY_CONFIG: Record<string, {
  title: string;
  description: string;
  emptyTitle: string;
  emptyMessage: string;
  emptyCtaText: string;
  emptyCtaHref: string;
  emptyIcon: string;
}> = {
  featured: {
    title: "Featured opportunities",
    description: "High-quality, complete job listings from verified employers and top recruiters.",
    emptyTitle: "No featured opportunities right now",
    emptyMessage: "Fresh, verified jobs are being curated. Check back soon or browse all active openings.",
    emptyCtaText: "Browse all jobs",
    emptyCtaHref: "/jobs/search",
    emptyIcon: "solar:star-fall-minimalistic-2-linear",
  },
  "best-matches": {
    title: "Best matches for you",
    description: "Opportunities ranked by how closely they match your profile skills, experience, title, and work mode.",
    emptyTitle: "No matches found yet",
    emptyMessage: "Add your top skills, job title, and past experience to receive tailored recommendations.",
    emptyCtaText: "Update profile",
    emptyCtaHref: "/profile/edit",
    emptyIcon: "solar:magic-stick-3-linear",
  },
  "from-network": {
    title: "From your network",
    description: "Jobs posted by your connections or at companies where people in your professional network work.",
    emptyTitle: "No network jobs found",
    emptyMessage: "Connect with colleagues, peers, and alumni to discover opportunities at companies where they work.",
    emptyCtaText: "Grow your network",
    emptyCtaHref: "/network",
    emptyIcon: "solar:users-group-two-rounded-linear",
  },
  "recently-viewed": {
    title: "Recently viewed",
    description: "Jobs you have previously opened and explored across the platform.",
    emptyTitle: "No recently viewed jobs",
    emptyMessage: "As you open and review job listings, your history will automatically appear here.",
    emptyCtaText: "Explore opportunities",
    emptyCtaHref: "/jobs",
    emptyIcon: "solar:history-linear",
  },
};

export const ExploreCategoryPage: React.FC<ExploreCategoryPageProps> = ({ category }) => {
  const router = useRouter();
  const config = CATEGORY_CONFIG[category] || {
    title: "Job opportunities",
    description: "Explore curated job listings.",
    emptyTitle: "No jobs available",
    emptyMessage: "Check back later for new opportunities.",
    emptyCtaText: "Back to jobs",
    emptyCtaHref: "/jobs",
    emptyIcon: "solar:briefcase-linear",
  };

  const handleBack = () => {
    sessionStorage.setItem("coming_from_job_detail", "true");
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/jobs");
    }
  };

  const handleClose = () => {
    sessionStorage.setItem("coming_from_job_detail", "true");
    router.push("/jobs");
  };

  const handleJobClick = (j: Job) => {
    sessionStorage.setItem(`jobs_explore_scroll_${category}`, window.scrollY.toString());
    sessionStorage.setItem("coming_from_job_detail", "true");
    router.push(`/jobs/${j.id}?returnTo=${encodeURIComponent(`/jobs/explore/${category}`)}`);
  };

  useEffect(() => {
    const comingFromDetail = sessionStorage.getItem("coming_from_job_detail") === "true";
    const savedCategoryScroll = sessionStorage.getItem(`jobs_explore_scroll_${category}`);

    if (comingFromDetail && savedCategoryScroll) {
      const scrollTarget = parseInt(savedCategoryScroll, 10);
      window.scrollTo(0, scrollTarget);
      sessionStorage.removeItem("coming_from_job_detail");
    } else {
      window.scrollTo(0, 0);
    }

    return () => {
      sessionStorage.setItem("coming_from_job_detail", "true");
    };
  }, [category]);

  const [applyingJob, setApplyingJob] = useState<Job | null>(null);

  const { toggleSave, applyToJob, withdrawJob } = useJobs();
  const { savedJobIds, appliedJobIds } = useJobStore();

  // 1. Category Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["jobs", "explore-section", category],
    queryFn: ({ pageParam }) => getExploreSectionPaginated(category, pageParam as string | undefined, 10),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined as string | undefined,
    staleTime: category === "recently-viewed" ? 0 : 1000 * 60 * 3,
    refetchOnMount: category === "recently-viewed" ? "always" : true,
  });

  // 2. Infinite Scroll Observer
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 3. Enhance & Flatten Jobs
  const jobs: Job[] = useMemo(() => {
    const rawJobs = data?.pages.flatMap((page) => page.items) || [];
    const seen = new Set<string>();

    return rawJobs
      .filter((job) => {
        if (!job.id || seen.has(job.id)) return false;
        seen.add(job.id);
        return true;
      })
      .map((job) => ({
        ...job,
        is_saved: job.is_saved || savedJobIds.has(job.id),
        is_applied: job.is_applied || appliedJobIds.has(job.id),
      }));
  }, [data, savedJobIds, appliedJobIds]);

  const totalCount = jobs.length;

  return (
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans relative selection:bg-ds-accent/30 selection:text-ds-text-primary">
      {/* Desktop Fixed Top-Left Back Button (matching JobDetailPage and post detail page) */}
      <button
        onClick={handleBack}
        type="button"
        aria-label="Back"
        className="hidden sm:inline-flex fixed top-[40px] left-[40px] z-50 items-center gap-2 p-0 text-ds-text-primary hover:text-ds-text-secondary text-base font-medium font-dm-sans leading-6 cursor-pointer select-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
        <span>Back</span>
      </button>

      {/* Desktop Fixed Top-Right Close Button */}
      <button
        onClick={handleClose}
        type="button"
        aria-label="Close"
        className="hidden sm:flex fixed top-[40px] right-[40px] z-50 items-center justify-center w-5 h-5 text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Mobile Top Navigation (In-flow so it scrolls up with page and never overlaps cards) */}
      <div className="sm:hidden w-full px-4 pt-4 pb-2 flex items-center justify-between z-30">
        <button
          onClick={handleBack}
          type="button"
          aria-label="Back"
          className="inline-flex items-center gap-2 p-0 text-ds-text-primary text-base font-medium font-dm-sans leading-6 cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          <LeftArrowIcon size={20} className="w-5 h-5 text-ds-text-primary shrink-0" />
          <span>Back</span>
        </button>

        <button
          onClick={handleClose}
          type="button"
          aria-label="Close"
          className="flex items-center justify-center size-8 text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main 800px Centered Column (matching JobDetailPage top-[60px] desktop, pt-2 mobile) */}
      <main className="w-full max-w-[800px] mx-auto pt-2 sm:pt-[60px] pb-28 px-4 sm:px-0 flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-300">
        {/* Category Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold font-dm-sans text-ds-text-primary">
              {config.title}
            </h1>
            {totalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-ds-surface-1 border border-ds-border text-xs font-medium font-dm-sans text-ds-text-secondary">
                {totalCount} {totalCount === 1 ? "job" : "jobs"}
              </span>
            )}
          </div>
          <p className="text-sm font-normal font-dm-sans text-ds-text-secondary max-w-2xl">
            {config.description}
          </p>
        </div>

        {/* Listings Section */}
        <section className="flex flex-col gap-5">
          {isLoading ? (
            <div className="w-full flex flex-col gap-4">
              {[1, 2, 3, 4].map((n) => (
                <JobCardSkeleton key={n} />
              ))}
            </div>
          ) : isError ? (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center gap-4 bg-ds-surface-1 rounded-2xl border border-ds-border">
              <div className="size-12 rounded-full bg-ds-surface-2 border border-ds-border flex items-center justify-center text-red-500">
                <Icon icon="solar:danger-triangle-linear" className="size-6" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm px-4">
                <h3 className="text-ds-text-primary font-semibold text-base font-dm-sans">
                  Failed to load opportunities
                </h3>
                <p className="text-ds-text-secondary text-xs font-normal font-dm-sans">
                  An error occurred while loading this category. Please try again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-full bg-ds-surface-2 hover:bg-ds-border text-ds-text-primary text-xs font-medium font-dm-sans transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center text-center gap-4 bg-ds-surface-1 rounded-2xl border border-ds-border animate-in fade-in duration-200">
              <div className="size-14 rounded-full bg-ds-surface-2 border border-ds-border flex items-center justify-center text-ds-accent">
                <Icon icon={config.emptyIcon} className="size-7" />
              </div>
              <div className="flex flex-col gap-1 max-w-md px-6">
                <h3 className="text-ds-text-primary font-semibold text-base font-dm-sans">
                  {config.emptyTitle}
                </h3>
                <p className="text-ds-text-secondary text-xs font-normal font-dm-sans leading-relaxed">
                  {config.emptyMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(config.emptyCtaHref)}
                className="mt-2 inline-flex items-center justify-center px-5 py-2 rounded-full bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary text-xs font-medium font-dm-sans transition-all cursor-pointer shadow-sm"
              >
                {config.emptyCtaText}
              </button>
            </div>
          ) : (
            <>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={(j) => handleJobClick(j)}
                  onApply={() => setApplyingJob(job)}
                  onSave={(jobId) => toggleSave(jobId)}
                  onWithdraw={(jobId) => withdrawJob(jobId)}
                />
              ))}

              {/* Bottom Sentinel for Cursor Infinite Scroll */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="w-full py-6 flex items-center justify-center">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-ds-text-secondary text-xs font-dm-sans">
                      <Icon icon="solar:spinner-linear" className="size-4 animate-spin text-ds-accent" />
                      <span>Loading more opportunities...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fetchNextPage()}
                      className="text-xs font-medium text-ds-accent hover:underline font-dm-sans cursor-pointer"
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Apply Modal */}
      {applyingJob && (
        <ApplyJobModal
          isOpen={applyingJob !== null}
          onClose={() => setApplyingJob(null)}
          onApply={async (resumeUrl, uploadedFile, resumeId, coverLetter) => {
            if (applyingJob) {
              await applyToJob(
                applyingJob.id,
                resumeUrl,
                uploadedFile,
                resumeId,
                coverLetter
              );
              setApplyingJob(null);
            }
          }}
          jobTitle={applyingJob.title}
        />
      )}
    </div>
  );
};

export default ExploreCategoryPage;
