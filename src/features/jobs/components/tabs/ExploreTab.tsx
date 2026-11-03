import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Job, JobsFilter } from '../../types/jobs.types';
import RecommendedJobCard from '../cards/RecommendedJobCard';
import RecommendedJobCardSkeleton from '../skeletons/RecommendedJobCardSkeleton';
import JobList from '../parts/JobList';
import JobFilters from '../drawers/JobFilters';
import { BriefcaseIcon } from '@/components/icons';
import { DragScrollContainer } from '@/shared/commonComponents/DragScrollContainer';

interface ExploreTabProps {
  jobs: Job[];
  recommendedJobs: Job[];
  exploreSections?: {
    featured: Job[];
    best_matches: Job[];
    from_network: Job[];
    recently_viewed: Job[];
  };
  isLoading: boolean;
  isRecommendationsLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  filters: JobsFilter;
  setFilterValue: (key: keyof JobsFilter, value: string) => void;
  setMultipleFilters?: (filters: Partial<JobsFilter>) => void;
  toggleSave: (jobId: string, e: React.MouseEvent) => void;
  onApplyClick: (jobId: string) => void;
  onWithdrawClick: (jobId: string) => void;
  onOfferAccept: (id: string) => void;
  onOfferDecline: (id: string) => void;
}

export const ExploreTab: React.FC<ExploreTabProps> = ({
  jobs,
  recommendedJobs,
  exploreSections,
  isLoading,
  isRecommendationsLoading,
  isFetchingMore,
  hasMore,
  loadMore,
  filters,
  setFilterValue,
  setMultipleFilters,
  toggleSave,
  onApplyClick,
  onWithdrawClick,
  onOfferAccept,
  onOfferDecline,
}) => {
  const router = useRouter();

  // Distribute recommended jobs across the 4 Figma sections (no fake/dummy data)
  // 1) Featured opportunities
  // 2) Best matches for you
  // 3) From your network
  // 4) Recently viewed
  const allAvailable = recommendedJobs.length > 0 ? recommendedJobs : jobs;

  if (allAvailable.length === 0 && !isLoading && !isRecommendationsLoading) {
    return (
      <div className="w-full max-w-[800px] py-28 flex flex-col justify-center items-center gap-2 select-none animate-in fade-in duration-200">
        {/* IconFrame: 64x64px, padding 12px, bg #1A1A20 (--ds-surface-1), rounded-full */}
        <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
          <BriefcaseIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
        </div>

        {/* Text Container */}
        <div className="flex flex-col justify-start items-center gap-2 text-center">
          <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
            No jobs available yet
          </h3>
          <p className="max-w-sm text-ds-text-secondary text-sm font-normal font-dm-sans leading-5">
            New jobs will appear here when they become available.
          </p>
        </div>
      </div>
    );
  }

  const featuredJobs = useMemo(
    () => (exploreSections?.featured ?? allAvailable).slice(0, 5),
    [exploreSections?.featured, allAvailable]
  );
  const bestMatches = useMemo(
    () => (exploreSections?.best_matches ?? (allAvailable.length > 5 ? allAvailable.slice(5, 10) : allAvailable)).slice(0, 5),
    [exploreSections?.best_matches, allAvailable]
  );
  const fromNetwork = useMemo(
    () => (exploreSections?.from_network ?? (allAvailable.length > 10 ? allAvailable.slice(10, 15) : allAvailable)).slice(0, 5),
    [exploreSections?.from_network, allAvailable]
  );

  const recentlyViewed = useMemo(
    () => (exploreSections?.recently_viewed ?? (allAvailable.length > 15 ? allAvailable.slice(15, 20) : allAvailable)).slice(0, 5),
    [exploreSections?.recently_viewed, allAvailable]
  );

  const handleFilterRedirect = (newFilters: Partial<JobsFilter>) => {
    const hasAny = Object.values(newFilters).some(
      (val) => Boolean(val && (Array.isArray(val) ? val.length > 0 : String(val).trim()))
    );
    if (!hasAny) {
      return;
    }

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val) {
        if (Array.isArray(val)) {
          params.set(key, val.join(','));
        } else {
          params.set(key, String(val));
        }
      }
    });
    router.push(`/jobs/search?${params.toString()}`);
  };

  const handleSingleFilterRedirect = (key: keyof JobsFilter, value: string) => {
    const params = new URLSearchParams();
    if (value) {
      params.set(key, value);
    }
    router.push(`/jobs/search?${params.toString()}`);
  };

  const renderSection = (
    title: string,
    categoryKey: 'featured' | 'best-matches' | 'from-network' | 'recently-viewed',
    sectionJobs: Job[]
  ) => {
    if (!isRecommendationsLoading && sectionJobs.length === 0) return null;

    return (
      <div className="w-full max-w-[800px] flex flex-col gap-5">
        {/* Frame 2609722 Header: h-6 flex justify-between items-center gap-2 */}
        <div className="w-full h-6 flex items-center justify-between gap-2">
          <h2 className="text-ds-text-primary text-base font-medium font-dm-sans leading-6">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('jobs_scroll_page_Explore', window.scrollY.toString());
              router.push(`/jobs/explore/${categoryKey}`);
            }}
            className="text-ds-accent hover:underline text-xs font-medium font-dm-sans leading-4 transition-colors cursor-pointer"
          >
            See all
          </button>
        </div>

        {/* Frame 2609820 Horizontal Carousel: gap-5 (20px), h-[192px] */}
        <DragScrollContainer className="w-full">
          {isRecommendationsLoading ? (
            [1, 2, 3].map((n) => <RecommendedJobCardSkeleton key={n} />)
          ) : (
            sectionJobs.map((job) => (
              <RecommendedJobCard
                key={`${categoryKey}-${job.id}`}
                job={job}
                onClick={(j) => router.push(`/jobs/${j.id}`)}
                onSave={toggleSave}
              />
            ))
          )}
        </DragScrollContainer>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-10">
      {/* Frame 2609821: 4 Horizontal Carousels from Figma Image */}
      {renderSection('Featured opportunities', 'featured', featuredJobs)}
      {renderSection('Best matches for you', 'best-matches', bestMatches)}
      {renderSection('From your network', 'from-network', fromNetwork)}
      {renderSection('Recently viewed', 'recently-viewed', recentlyViewed)}

      {/* Sub-filters & Vertical Job Feed List (20px gap from tab box to first item) */}
      <div id="job-feed-list" className="w-full flex flex-col gap-5">
        <JobFilters
          filters={filters}
          onFilterChange={setFilterValue}
          onMultipleFilterChange={handleFilterRedirect}
          onClearFilters={() => {
            setFilterValue("job_type", "");
            setFilterValue("work_mode", "");
            setFilterValue("experience", "");
            setFilterValue("salary_range", "");
            setFilterValue("date_posted", "");
            setFilterValue("industry", "");
          }}
        />

        <JobList
          jobs={jobs}
          isLoading={isLoading}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
          loadMore={loadMore}
          onSave={toggleSave}
          onApply={(id) => onApplyClick(id)}
          onWithdraw={(id) => onWithdrawClick(id)}
          onSelect={(j) => router.push(`/jobs/${j.id}`)}
          onAccept={(id) => onOfferAccept(id)}
          onDecline={(id) => onOfferDecline(id)}
        />
      </div>
    </div>
  );
};

export default ExploreTab;

