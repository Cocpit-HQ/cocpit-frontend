import React, { useEffect } from "react";
import { useJobs } from "../hooks/useJobs";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import SearchJobCard from "../components/SearchJobCard";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import JobCardSkeleton from "../components/skeletons/JobCardSkeleton";
import { useJobStore } from "@/store/job.store";

export const JobSearchPage: React.FC = () => {
  const router = useRouter();
  const { isCompany, activeProfile } = useActiveProfile();
  const isCompanyMode = isCompany && !!activeProfile?.id;

  const urlParams = useSearchParams();
  const urlSearch = urlParams?.get('search') || '';
  const urlLocation = urlParams?.get('location') || '';

  const filters = useJobStore((state) => state.filters);
  const setMultipleFilters = useJobStore((state) => state.setMultipleFilters);

  const {
    jobs,
    isLoading,
    isFetchingMore,
    hasMore,
    loadMore,
    applyToJob,
    toggleSave,
  } = useJobs("Explore", urlSearch, urlLocation);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasMore && !isFetchingMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isFetchingMore, isLoading, loadMore]);

  const handleBack = () => {
    router.back();
  };



  const handleToggleFilter = (chip: string) => {
    if (chip === 'Full time') {
      const current = filters.job_type === 'Full time' ? '' : 'Full time';
      setMultipleFilters({ job_type: current, work_mode: '', experience: '' });
    } else if (chip === 'Remote') {
      const current = filters.work_mode === 'Remote' ? '' : 'Remote';
      setMultipleFilters({ job_type: '', work_mode: current, experience: '' });
    } else if (chip === 'Fresher') {
      const current = filters.experience === 'Fresher' ? '' : 'Fresher';
      setMultipleFilters({ job_type: '', work_mode: '', experience: current });
    }
  };

  return (
    <div className={`relative w-full min-h-screen bg-transparent flex flex-col items-center px-4 md:px-8 py-6`}>
      <div className="w-full max-w-[960px] flex flex-col gap-6">
        
        {/* Header */}
        <div className="w-full flex flex-row items-center gap-4">
          <button
            onClick={handleBack}
            className={`w-12 h-12 box-border p-2 rounded-[100px] border border-[#DADADA] backdrop-blur-[12px] ${isCompanyMode ? 'dark:border-[#2A2D35]' : 'dark:border-[#2E3445]'} bg-transparent flex justify-center items-center hover:bg-slate-50/50 dark:hover:bg-[#2A2D35]/50 transition-colors active:scale-95 flex-shrink-0`}
          >
            <Icon icon="lucide:chevron-left" className={`w-6 h-6 text-gray-500 ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'}`} />
          </button>
          <div className="flex flex-col items-start">
            <div className={`text-center text-[#000000] ${isCompanyMode ? 'dark:text-[#FFFFFF]' : 'dark:text-[#F9FAFB]'} text-[18px] font-medium font-['Poppins'] leading-[26px]`}>
              Search job
            </div>
            <div className={`text-center text-[#6B7280] ${isCompanyMode ? 'dark:text-[#A1A8B3]' : 'dark:text-[#9CA3AF]'} text-[12px] font-normal font-['Poppins'] leading-[16px]`}>
              Find the job you want
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="w-full h-10 flex justify-between items-center">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0 flex-nowrap">
            {['Full time', 'Remote', 'Fresher'].map((chip, i) => {
              const isActive = (chip === 'Full time' && filters.job_type === 'Full time') ||
                               (chip === 'Remote' && filters.work_mode === 'Remote') ||
                               (chip === 'Fresher' && filters.experience === 'Fresher');
              return (
              <button 
                key={i} 
                onClick={() => handleToggleFilter(chip)}
                className={`shrink-0 px-4 py-2 rounded-[24px] border text-sm font-medium transition-all font-['Poppins'] ${
                  isActive
                    ? 'border-indigo-100 dark:border-[#818CF8]/30 bg-indigo-50 dark:bg-[#818CF8]/10 text-indigo-500 dark:text-[#818CF8]'
                    : 'border-transparent text-gray-700 dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2E3445]'
                }`}
              >
                {chip}
              </button>
            )})}
          </div>
          <button className="relative p-2 flex justify-center items-center rounded-full transition-all active:scale-95 hover:bg-gray-100 dark:hover:bg-[#2E3445] flex-shrink-0">
            <Icon icon="iconoir:filter-list" className="w-6 h-6 text-black dark:text-[#F9FAFB]" />
            <div className={`absolute top-1 right-0 w-1.5 h-1.5 bg-[#6366F1] dark:bg-[#818CF8] rounded-full`} />
          </button>
        </div>

        {/* Results */}
        <div className="w-full flex flex-col gap-6 mt-2">
          {isLoading ? (
            <div className="w-full flex flex-col gap-6 py-4">
              {[1, 2, 3].map(n => (
                <JobCardSkeleton key={n} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className={`w-full py-12 flex flex-col items-center justify-center text-center gap-3 bg-white ${isCompanyMode ? 'dark:bg-[#0F1115]' : 'dark:bg-[#1C2340]/50'} rounded-3xl outline outline-1 outline-indigo-50/50 dark:outline-[#2E3445]/50`}>
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-[#818CF8]/10 flex items-center justify-center text-indigo-500 dark:text-[#818CF8]">
                <Icon icon="lucide:search-slash" className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-black dark:text-[#F9FAFB] font-semibold text-base font-['Poppins']">No jobs found</h4>
                <p className="text-gray-500 dark:text-[#9CA3AF] text-xs font-['Poppins'] mt-1 max-w-xs">
                  We couldn't find any job listings matching your selection. Try adjusting your search or filters.
                </p>
              </div>
            </div>
          ) : (
            <>
              {jobs.map(job => (
                <SearchJobCard
                  key={job.id}
                  job={job}
                  onClick={(j) => router.push(`/jobs/${j.id}`)}
                  onApply={(jobId) => applyToJob(jobId)}
                  onSave={(jobId) => toggleSave(jobId)}
                />
              ))}
              
              {/* Infinite scroll loader trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="w-full py-4 flex justify-center items-center">
                  {isFetchingMore ? (
                    <div className="flex items-center gap-2 text-indigo-500 dark:text-[#818CF8] font-medium text-xs">
                      <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                      <span>Loading more jobs...</span>
                    </div>
                  ) : (
                    <div className="h-4 w-full" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
