import React, { useEffect } from 'react';
import { Job } from '../../types/jobs.types';
import JobCard from '../cards/JobCard';
import JobCardSkeleton from '../skeletons/JobCardSkeleton';
import { useInView } from 'react-intersection-observer';
import { Icon } from '@iconify/react';

interface JobListProps {
  jobs: Job[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  onSave?: (jobId: string, e: React.MouseEvent) => void;
  onApply?: (jobId: string, e: React.MouseEvent) => void;
  onWithdraw?: (jobId: string, e: React.MouseEvent) => void;
  onSelect?: (job: Job) => void;
  onAccept?: (offerId: string, e: React.MouseEvent) => void;
  onDecline?: (offerId: string, e: React.MouseEvent) => void;
  isSavedTab?: boolean;
}

export const JobList: React.FC<JobListProps> = React.memo(({
  jobs,
  isLoading,
  isFetchingMore,
  hasMore,
  loadMore,
  onSave,
  onApply,
  onWithdraw,
  onSelect,
  onAccept,
  onDecline,
  isSavedTab
}) => {
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasMore && !isFetchingMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isFetchingMore, isLoading, loadMore]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-5 py-4">
        {[1, 2, 3].map(n => (
          <JobCardSkeleton key={n} />
        ))}
      </div>
    );
  }

  if (jobs.length === 0 && !hasMore && !isLoading) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center text-center gap-3 bg-ds-surface-1 rounded-2xl border border-ds-border">
        <div className="size-12 rounded-full bg-ds-surface-2 border border-ds-border flex items-center justify-center text-ds-accent">
          <Icon icon="solar:magnifer-linear" className="size-6" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm px-4">
          <h4 className="text-ds-text-primary font-medium ds-text-body-1 font-dm-sans">No jobs found</h4>
          <p className="text-ds-text-secondary ds-text-small font-normal font-dm-sans">
            We couldn't find any job listings matching your criteria. Try adjusting your search or filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] flex flex-col justify-start items-stretch gap-5 font-dm-sans">
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          isSavedTab={isSavedTab}
          onSave={onSave}
          onApply={onApply}
          onWithdraw={onWithdraw}
          onClick={onSelect}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      ))}

      {/* Infinite scroll loader trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="w-full py-4 flex justify-center items-center">
          {isFetchingMore ? (
            <div className="flex items-center gap-2 text-ds-accent font-medium ds-text-small font-dm-sans">
              <Icon icon="lucide:loader-2" className="size-4 animate-spin" />
              <span>Loading more jobs...</span>
            </div>
          ) : (
            <div className="h-4 w-full" />
          )}
        </div>
      )}
    </div>
  );
});

JobList.displayName = 'JobList';

export default JobList;
