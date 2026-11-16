'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { Job } from '@/features/jobs/types/jobs.types';
import { JobCard } from '@/features/jobs/components/cards/JobCard';
import { useJobs } from '@/features/jobs/hooks/useJobs';
import { useJobStore } from '@/store/job.store';
import { Loader2 } from 'lucide-react';

interface SearchJobsViewProps {
  items: Job[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  onClearFilters?: () => void;
  query: string;
  returnTo?: string;
}

export const SearchJobsView: React.FC<SearchJobsViewProps> = ({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onClearFilters,
  query,
  returnTo,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleSave } = useJobs();
  const savedJobIds = useJobStore((state) => state.savedJobIds);
  const addSavedIds = useJobStore((state) => state.addSavedIds);
  const { ref, inView } = useInView({ threshold: 0, rootMargin: '200px' });

  // Synchronize incoming search items' saved states into global job store
  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;
    const initialSaved = items
      .filter((rawJob: any) => Boolean(rawJob.is_saved ?? rawJob.isSaved))
      .map((rawJob: any) => rawJob.id || rawJob.job_id)
      .filter(Boolean);
    if (initialSaved.length > 0) {
      addSavedIds(initialSaved);
    }
  }, [items, addSavedIds]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const currentSearchUrl = useMemo(() => {
    if (returnTo) return returnTo;
    const qStr = searchParams?.toString();
    return qStr ? `/search?${qStr}` : `/search?type=jobs`;
  }, [returnTo, searchParams]);

  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((rawJob: any) => {
      const id = rawJob.id || rawJob.job_id;
      const isSaved = savedJobIds.has(id) || Boolean(rawJob.is_saved ?? rawJob.isSaved);
      return {
        ...rawJob,
        id,
        job_id: id,
        is_saved: isSaved,
        company: rawJob.company || rawJob.company_name || rawJob.company_title || '',
        company_logo: rawJob.company_logo || rawJob.companyLogo || null,
        recruiter_avatar: rawJob.recruiter_avatar || rawJob.recruiterAvatar || null,
        recruiter_name: rawJob.recruiter_name || rawJob.recruiterName || '',
      } as Job;
    });
  }, [items, savedJobIds]);

  if (!isLoading && normalizedItems.length === 0) {
    return (
      <div className="w-full max-w-[720px] mx-auto px-4 py-16 text-center">
        <h3 className="text-ds-text-primary text-base font-medium font-dm-sans mb-1">
          No jobs found matching your criteria
        </h3>
        <p className="text-ds-text-secondary text-sm font-dm-sans mb-4">
          Try adjusting your search terms or clearing some filters.
        </p>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 rounded-full bg-ds-surface-1 border border-ds-border hover:bg-ds-surface-2 text-ds-text-primary text-sm font-medium font-dm-sans transition-colors cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[720px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
      {normalizedItems.map((job) => {
        const jobId = job.id || (job as any).job_id;
        const targetUrl = `/jobs/${jobId}?returnTo=${encodeURIComponent(currentSearchUrl)}`;
        return (
          <JobCard
            key={jobId}
            job={job}
            ctaText="Job details"
            onClick={() => router.push(targetUrl)}
            onApply={(id, e) => {
              e.stopPropagation();
              router.push(targetUrl);
            }}
            onSave={(id) => toggleSave(id, job.is_saved)}
          />
        );
      })}

      <div ref={ref} className="w-full py-4 min-h-[40px] flex justify-center items-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-ds-text-secondary text-sm font-dm-sans">
            <Loader2 className="size-4 animate-spin text-ds-accent" />
            <span>Loading more jobs...</span>
          </div>
        )}
      </div>
    </div>
  );
};
