import React from 'react';
import { useJobDetail } from '../hooks/useJobDetail';
import JobDetailHeader from '../components/JobDetailHeader';
import JobDetailBody from '../components/JobDetailBody';
import JobApplyButton from '../components/JobApplyButton';
import { Icon } from '@iconify/react';
import Link from 'next/link';

interface JobDetailPageProps {
  jobId: string;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ jobId }) => {
  const { job, isLoading, toggleSave, applyToJob } = useJobDetail(jobId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-['Poppins']">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm">
          <Icon icon="lucide:alert-circle" className="w-8 h-8" />
        </div>
        <h2 className="text-black text-xl font-bold font-['Poppins']">Job Not Found</h2>
        <p className="text-gray-500 text-sm font-['Poppins'] max-w-sm">
          The job listing you are looking for does not exist or may have been filled or expired.
        </p>
        <Link
          href="/jobs"
          className="mt-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-3xl text-sm font-semibold font-['Poppins'] transition-all flex items-center gap-2"
        >
          <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white py-6 px-4 md:px-8 flex flex-col gap-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Back to Jobs Link */}
      <div className="w-full">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-600 font-semibold text-sm font-['Poppins'] transition-colors"
        >
          <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
      </div>

      {/* Header Info */}
      <JobDetailHeader job={job} />

      {/* Action Buttons bar */}
      <JobApplyButton
        isApplied={!!job.is_applied}
        isSaved={!!job.is_saved}
        onApply={applyToJob}
        onSave={toggleSave}
      />

      {/* Job Details Body */}
      <JobDetailBody job={job} />
    </div>
  );
};

export default JobDetailPage;
