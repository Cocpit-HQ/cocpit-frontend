import React, { useEffect } from 'react';
import { Job } from '../types/jobs.types';
import JobCard from './JobCard';
import { useInView } from '@/hooks/use-in-view';
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
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  isLoading,
  isFetchingMore,
  hasMore,
  loadMore,
  onSave,
  onApply,
  onWithdraw,
  onSelect
}) => {
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Call loadMore when scrolled to bottom
  useEffect(() => {
    if (inView && hasMore && !isFetchingMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isFetchingMore, isLoading, loadMore]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col gap-4 py-4">
        {[1, 2, 3].map(n => (
          <div key={n} className="w-full h-36 bg-slate-50 animate-pulse rounded-3xl outline outline-1 outline-indigo-50" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center text-center gap-3 bg-slate-50/50 rounded-3xl outline outline-1 outline-indigo-50/50">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
          <Icon icon="lucide:search-slash" className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-black font-semibold text-base font-['Poppins']">No jobs found</h4>
          <p className="text-gray-500 text-xs font-['Poppins'] mt-1 max-w-xs">
            We couldn't find any job listings matching your selection. Try clearing filters or try searching for another role.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-start items-stretch gap-6">
      {jobs.map(job => (
        <JobCard
          key={job.id}
          job={job}
          onSave={onSave}
          onApply={onApply}
          onWithdraw={onWithdraw}
          onClick={onSelect}
        />
      ))}

      {/* Infinite scroll loader trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="w-full py-4 flex justify-center items-center">
          {isFetchingMore ? (
            <div className="flex items-center gap-2 text-indigo-500 font-medium text-xs">
              <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
              <span>Loading more jobs...</span>
            </div>
          ) : (
            <div className="h-4 w-full" />
          )}
        </div>
      )}
    </div>
  );
};

export default JobList;
