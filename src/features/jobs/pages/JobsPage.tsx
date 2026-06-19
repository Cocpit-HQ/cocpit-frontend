import React, { use } from 'react';
import { useJobs } from '../hooks/useJobs';
import RecommendedJobCard from '../components/RecommendedJobCard';
import JobList from '../components/JobList';
import JobFilters from '../components/JobFilters';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

interface JobsPageProps {
  searchParams?: any;
}

export const JobsPage: React.FC<JobsPageProps> = ({ searchParams }) => {
  const router = useRouter();
  
  // Safely unwrap searchParams if it is a Promise (Next.js 15+)
  let resolvedParams: any = null;
  if (searchParams) {
    if (typeof searchParams.then === 'function') {
      resolvedParams = use(searchParams);
    } else {
      resolvedParams = searchParams;
    }
  }
  
  const initialSearch = typeof resolvedParams?.search === 'string' ? resolvedParams.search : '';

  const {
    jobs,
    isLoading,
    isFetchingMore,
    hasMore,
    loadMore,
    activeTab,
    setActiveTab,
    filters,
    setFilterValue,
    toggleSave,
    applyToJob
  } = useJobs('Explore', initialSearch);

  // Filter recommended jobs for the horizontal carousel
  const recommendedJobs = jobs.filter(j => j.is_recommended);

  // Tabs layout specification
  const tabs = [
    { id: 'Explore', label: 'Explore' },
    { id: 'My applications', label: 'My applications' },
    { id: 'Offers', label: 'Offers' },
    { id: 'Saved', label: 'Saved' }
  ];

  return (
    <div className="w-[960px] min-h-screen bg-white pt-[20px] pb-6 px-4 md:px-8 flex flex-col gap-[20px]">

      {/* Hero Banner */}
      <div className="self-stretch px-8 py-6 bg-indigo-50 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-100 flex flex-col justify-center items-start overflow-hidden">
        <div className="self-stretch pb-2 flex flex-col justify-start items-start">
          <div className="self-stretch flex flex-col justify-start items-start">
            <h2 className="self-stretch justify-center text-indigo-500 text-3xl font-semibold font-['Poppins'] leading-10">
              Your next career move,<br />made simple.
            </h2>
          </div>
        </div>
      </div>

      {/* Tabs navigation row */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[20px] border-b border-indigo-50/50 pb-2">
        <div className="flex flex-wrap justify-start items-center gap-3">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-10 px-5 py-1.5 rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-indigo-50 outline-indigo-50 text-indigo-500 shadow-sm'
                    : 'bg-white outline-indigo-400/50 hover:outline-indigo-400 text-indigo-400/80 hover:text-indigo-400'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* My listings tab link */}
        <button
          onClick={() => setActiveTab('My listings')}
          className={`h-10 px-5 py-1.5 rounded-3xl outline outline-1 outline-offset-[-1px] flex justify-center items-center gap-2 text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 ${
            activeTab === 'My listings'
              ? 'bg-indigo-50 outline-indigo-50 text-indigo-500'
              : 'bg-white outline-indigo-400/50 hover:outline-indigo-400 text-indigo-400/80 hover:text-indigo-400'
          }`}
        >
          <span>My listings</span>
          <Icon icon="lucide:chevron-right" className="w-4 h-4" />
        </button>
      </div>

      {/* AI Recommended Jobs - Only show under Explore tab and if recommendations exist */}
      {activeTab === 'Explore' && recommendedJobs.length > 0 && (
        <div className="w-full flex flex-col gap-[20px]">
          <div className="flex justify-between items-center">
            <h3 className="text-black text-lg font-semibold font-['Poppins'] leading-6">
              AI recommended jobs
            </h3>
            <span className="text-xs font-semibold text-indigo-500 flex items-center gap-1">
              <Icon icon="lucide:sparkles" className="w-3.5 h-3.5" />
              <span>Tailored for you</span>
            </span>
          </div>
          
          {/* Recommended jobs container */}
          <div className="w-[960px] h-56 flex flex-row justify-start items-start gap-4">
            {recommendedJobs.map(job => (
              <RecommendedJobCard
                key={job.id}
                job={job}
                onClick={(j) => router.push(`/jobs/${j.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Jobs listing header & filters */}
      <div className="w-full flex flex-col gap-[20px]">
        <h3 className="text-black text-lg font-semibold font-['Poppins'] leading-6">
          {activeTab === 'Explore' ? 'All jobs' : `${activeTab} jobs`}
        </h3>

        {/* Filters bar */}
        <JobFilters
          filters={filters}
          onFilterChange={setFilterValue}
          onClearFilters={() => {
            setFilterValue('job_type', '');
            setFilterValue('work_mode', '');
            setFilterValue('experience', '');
            setFilterValue('salary_range', '');
          }}
        />

        {/* Job List container */}
        <div className="w-full">
          <JobList
            jobs={jobs}
            isLoading={isLoading}
            isFetchingMore={isFetchingMore}
            hasMore={hasMore}
            loadMore={loadMore}
            onSave={toggleSave}
            onApply={applyToJob}
            onSelect={(j) => router.push(`/jobs/${j.id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
