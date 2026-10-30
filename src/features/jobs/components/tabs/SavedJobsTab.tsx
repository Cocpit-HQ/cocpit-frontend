import React from 'react';
import { useRouter } from 'next/navigation';
import { Job } from '../../types/jobs.types';
import JobCardSkeleton from '../skeletons/JobCardSkeleton';
import JobList from '../parts/JobList';
import { Icon } from '@iconify/react';
import { BriefcaseIcon } from '@/components/icons';

interface SavedJobsTabProps {
  jobs: Job[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  toggleSave: (jobId: string, e: React.MouseEvent) => void;
  onApplyClick: (jobId: string) => void;
  onWithdrawClick: (jobId: string) => void;
  onOfferAccept: (id: string) => void;
  onOfferDecline: (id: string) => void;
}

export const SavedJobsTab: React.FC<SavedJobsTabProps> = ({
  jobs,
  isLoading,
  isFetchingMore,
  hasMore,
  loadMore,
  toggleSave,
  onApplyClick,
  onWithdrawClick,
  onOfferAccept,
  onOfferDecline,
}) => {
  const router = useRouter();

  return (
    <div className="w-full max-w-[800px] flex flex-col gap-5 font-dm-sans">
      <div className="w-full">
        {isLoading ? (
          <div className="w-full flex flex-col gap-5 py-4">
            {[1, 2, 3].map((n) => (
              <JobCardSkeleton key={n} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="w-full max-w-[800px] py-28 flex flex-col justify-center items-center gap-2 select-none animate-in fade-in duration-200">
            {/* IconFrame: 64x64px, padding 12px, bg #1A1A20 (--ds-surface-1), rounded-full */}
            <div className="w-16 h-16 p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
              <BriefcaseIcon size={40} className="w-10 h-10 text-ds-text-muted shrink-0" fill="currentColor" />
            </div>

            {/* Text Container */}
            <div className="flex flex-col justify-start items-center gap-2 text-center">
              <h3 className="text-ds-text-primary text-base font-semibold font-dm-sans leading-6">
                No Save jobs yet
              </h3>
              <p className="max-w-sm text-ds-text-secondary text-sm font-normal font-dm-sans leading-5">
                New saved jobs will appear here when you save them
              </p>
            </div>
          </div>
        ) : (
          <JobList
            jobs={jobs}
            isSavedTab={true}
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
        )}
      </div>
    </div>
  );
};

export default SavedJobsTab;
