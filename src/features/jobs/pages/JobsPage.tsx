import React, { use } from 'react';
import { useJobs } from '../hooks/useJobs';
import RecommendedJobCard from '../components/RecommendedJobCard';
import JobList from '../components/JobList';
import JobFilters from '../components/JobFilters';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import MyListingsDashboard from '../components/my-listings/MyListingsDashboard';

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
    applyToJob,
    withdrawJob,
    respondToOffer,
    applicationStats
  } = useJobs('Explore', initialSearch);

  // Filter recommended jobs for the horizontal carousel
  const recommendedJobs = jobs.filter(j => j.is_recommended);

  // Hidden scrollbar logic: show on scroll and hover for 3 seconds
  const [showScrollbar, setShowScrollbar] = React.useState(false);
  const scrollbarTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerScrollbar = () => {
    setShowScrollbar(true);
    if (scrollbarTimeoutRef.current) {
      clearTimeout(scrollbarTimeoutRef.current);
    }
    scrollbarTimeoutRef.current = setTimeout(() => {
      setShowScrollbar(false);
    }, 3000);
  };

  React.useEffect(() => {
    return () => {
      if (scrollbarTimeoutRef.current) {
        clearTimeout(scrollbarTimeoutRef.current);
      }
    };
  }, []);

  // Tabs layout specification
  const tabs = [
    { id: 'Explore', label: 'Explore' },
    { id: 'My applications', label: 'My applications' },
    { id: 'Offers', label: 'Offers' },
    { id: 'Saved', label: 'Saved' }
  ];

  if (activeTab === 'My listings') {
    return (
      <div className="w-full md:w-[1024px] min-h-screen bg-white pt-[20px] pb-6 px-4 md:px-8 flex flex-col gap-[20px]">
        <MyListingsDashboard onBack={() => setActiveTab('Explore')} />
      </div>
    );
  }

  return (
    <div className="w-full md:w-[1024px] min-h-screen bg-white pt-[20px] pb-6 px-4 md:px-8 flex flex-col gap-[20px]">

      {/* Hero Banner */}
      {activeTab === 'Explore' && (
        <div className="w-[960px] px-8 py-6 bg-indigo-50 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-100 inline-flex flex-col justify-center items-start overflow-hidden">
          <div className="self-stretch pb-2 flex flex-col justify-start items-start">
            <div className="self-stretch flex flex-col justify-start items-start">
              <div className="self-stretch justify-center text-indigo-500 text-3xl font-semibold font-['Poppins'] leading-10">Your next career move,<br/>made simple.</div>
            </div>
          </div>
        </div>
      )}

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
                    ? 'bg-indigo-55 outline-indigo-50 text-indigo-500 shadow-sm bg-indigo-50'
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
          <div className="flex justify-start items-center">
            <h3 className="text-black text-lg font-semibold font-['Poppins'] leading-6">
              AI recommended jobs
            </h3>
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

      {/* Tab content conditional rendering */}
      {activeTab === 'My applications' ? (
        <div className="w-full flex flex-col gap-[20px]">
          {/* Stats Cards Row */}
          <div className="w-full flex flex-col sm:flex-row gap-4">
            {/* Card 1: Total Applied */}
            <div className="flex-1 p-6 bg-white rounded-[24px] outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-center items-start gap-1 shadow-[0px_4px_24px_rgba(99,102,241,0.02)]">
              <div className="text-[#6366F1] text-3xl font-semibold font-['Poppins'] leading-10">
                {applicationStats.totalApplied}
              </div>
              <div className="text-gray-500 text-sm font-normal font-['Poppins']">Total Applied</div>
            </div>
            {/* Card 2: Shortlisted */}
            <div className="flex-1 p-6 bg-white rounded-[24px] outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-center items-start gap-1 shadow-[0px_4px_24px_rgba(99,102,241,0.02)]">
              <div className="text-[#6366F1] text-3xl font-semibold font-['Poppins'] leading-10">
                {applicationStats.shortlisted}
              </div>
              <div className="text-gray-500 text-sm font-normal font-['Poppins']">Shortlisted</div>
            </div>
          </div>

          {/* Sub-header row */}
          <div className="w-full flex flex-row justify-between items-center pt-2">
            <span className="text-gray-700 text-sm font-normal font-['Poppins']">
              Tracking 14 active job applications across your network.
            </span>
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors flex items-center justify-center">
              <Icon icon="lucide:sliders-horizontal" className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Applications list */}
          <div className="w-full flex flex-col mt-2">
            {jobs.length === 0 ? (
              <div className="w-full py-16 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-[#6366F1]">
                  <Icon icon="lucide:briefcase" className="w-8 h-8" />
                </div>
                <h4 className="text-black text-lg font-semibold font-['Poppins']">No applications yet</h4>
                <p className="text-gray-500 text-sm font-['Poppins'] max-w-xs text-center">
                  You haven\'t applied to any jobs yet. Check the Explore tab to find and apply to matching roles!
                </p>
                <button
                  onClick={() => setActiveTab('Explore')}
                  className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-[24px] text-sm font-semibold font-['Poppins'] transition-all"
                >
                  Explore Jobs
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col border-t border-slate-100">
                {jobs.map((job) => {
                  // Render company logo
                  const renderCompanyLogo = () => {
                    if (job.company_logo === 'coreloom') {
                      return (
                        <div className="w-11 h-11 rounded-full bg-[#E0E7FF] flex items-center justify-center overflow-hidden border border-indigo-100">
                          <Icon icon="solar:globus-linear" className="w-6 h-6 text-[#6366F1]" />
                        </div>
                      );
                    }
                    if (job.company_logo === 'prismforge') {
                      return (
                        <div className="w-11 h-11 rounded-full bg-[#FFE4E6] flex items-center justify-center overflow-hidden border border-rose-100">
                          <Icon icon="solar:fire-linear" className="w-6 h-6 text-rose-500" />
                        </div>
                      );
                    }
                    if (job.company_logo === 'mindstack') {
                      return (
                        <div className="w-11 h-11 rounded-full bg-[#ECFDF5] flex items-center justify-center overflow-hidden border border-emerald-100">
                          <Icon icon="solar:atom-linear" className="w-6 h-6 text-emerald-500" />
                        </div>
                      );
                    }
                    if (job.company_logo === 'sphere') {
                      return (
                        <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
                        </div>
                      );
                    }
                    return (
                      <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0">
                        <Icon icon="lucide:briefcase" className="w-5 h-5 text-indigo-500" />
                      </div>
                    );
                  };

                  const statusColorClass = (status: string = '') => {
                    switch (status.toLowerCase()) {
                      case 'shortlisted':
                        return 'text-emerald-500 font-semibold';
                      case 'applied':
                        return 'text-indigo-500 font-semibold';
                      case 'declined':
                        return 'text-rose-500 font-semibold';
                      case 'in review':
                        return 'text-amber-500 font-semibold';
                      default:
                        return 'text-gray-700 font-semibold';
                    }
                  };

                  return (
                    <div
                      key={job.id}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="w-full py-4 border-b border-slate-100 flex flex-row items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors px-2 rounded-2xl"
                    >
                      {/* Left: Logo + Info */}
                      <div className="flex flex-row items-center gap-4 flex-1 min-w-[200px]">
                        {renderCompanyLogo()}
                        <div className="flex flex-col min-w-0">
                          <span className="text-black text-sm font-semibold font-['Poppins'] truncate">{job.title}</span>
                          <span className="text-gray-500 text-xs font-normal font-['Poppins'] truncate">{job.company}</span>
                        </div>
                      </div>

                      {/* Middle-left: Applied date */}
                      <div className="flex-1 min-w-[120px] text-gray-500 text-sm font-normal font-['Poppins'] hidden sm:block">
                        {job.applied_date_display || `Applied ${job.posted_at}`}
                      </div>

                      {/* Middle-right: Status */}
                      <div className="flex-1 min-w-[100px] flex items-center justify-start">
                        <span className={`text-sm font-semibold font-['Poppins'] ${statusColorClass(job.application_status)}`}>
                          {job.application_status || 'Applied'}
                        </span>
                      </div>

                      {/* Right: Actions */}
                      <div className="w-[160px] flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                        {job.is_available === false ? (
                          <span className="text-rose-500 text-xs font-medium font-['Poppins'] text-right leading-tight">
                            This job is no<br/>longer available
                          </span>
                        ) : job.application_status === 'Declined' ? (
                          <div className="w-6 h-6" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              withdrawJob(job.id);
                            }}
                            className="flex flex-row justify-center items-center px-4 py-1.5 border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded-[24px] bg-white transition-all duration-200 active:scale-95 text-xs font-medium font-['Poppins'] shadow-sm"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'Offers' ? (
        <div className="w-full flex flex-col gap-[20px]">
          {/* Header */}
          <div className="flex justify-start items-center">
            <h3 className="text-black text-xl font-bold font-['Poppins'] leading-8">
              Official Job Offers
            </h3>
          </div>

          {/* Offers list */}
          <div className="w-full flex flex-col gap-6">
            {jobs.length === 0 ? (
              <div className="w-full py-16 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-[#6366F1]">
                  <Icon icon="solar:letter-linear" className="w-8 h-8" />
                </div>
                <h4 className="text-black text-lg font-semibold font-['Poppins']">No active offers</h4>
                <p className="text-gray-500 text-sm font-['Poppins'] max-w-xs text-center">
                  You don\'t have any job offers right now. Keep applying to matching roles to get scouted by recruiters!
                </p>
                <button
                  onClick={() => setActiveTab('Explore')}
                  className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-[24px] text-sm font-semibold font-['Poppins'] transition-all"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              jobs.map((job) => {
                const expiryColorClass = job.offer_expiry_color === 'orange' ? 'text-amber-500' : 'text-gray-400';
                
                return (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="w-full p-6 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50/100 flex flex-col gap-4 shadow-[0px_4px_24px_rgba(99,102,241,0.02)] cursor-pointer hover:outline-indigo-200 hover:shadow-[0px_8px_30px_rgba(99,102,241,0.06)] transition-all duration-300"
                  >
                    {/* Top row: Offer Info & Actions */}
                    <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Left: Job Title, Company, Location, Expiry Tag */}
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-black text-base font-semibold font-['Poppins']">{job.title}</h4>
                          {job.offer_expiry_text && (
                            <span className={`text-xs font-medium font-['Poppins'] ${expiryColorClass}`}>
                              {job.offer_expiry_text}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-sm font-normal font-['Poppins']">
                          {job.company}
                        </div>
                        <div className="text-gray-400 text-xs font-medium font-['Poppins']">
                          {job.location}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => respondToOffer(job.id, 'decline')}
                          className="px-5 py-2 border border-indigo-200 hover:border-red-200 text-indigo-500 hover:text-red-500 rounded-[24px] bg-white text-sm font-semibold font-['Poppins'] transition-all active:scale-95 shadow-sm"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => respondToOffer(job.id, 'accept')}
                          className="px-5 py-2 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-[24px] text-sm font-semibold font-['Poppins'] transition-all active:scale-95 shadow-sm"
                        >
                          Accept
                        </button>
                      </div>
                    </div>

                    {/* Recruiter Message Box */}
                    {job.recruiter_name && (
                      <div className="w-full p-4 bg-slate-50 rounded-2xl border-l-4 border-[#6366F1] flex flex-row items-start gap-3 mt-1">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 bg-indigo-50 flex items-center justify-center">
                          <Icon icon="solar:user-bold" className="w-5 h-5 text-indigo-400" />
                        </div>
                        {/* Details */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <div className="flex flex-col">
                            <span className="text-[#6366F1] text-xs font-bold font-['Poppins'] uppercase tracking-wider">
                              {job.recruiter_name}
                            </span>
                            <span className="text-indigo-400 text-[10px] font-semibold font-['Poppins'] uppercase tracking-wider">
                              {job.recruiter_title}
                            </span>
                          </div>
                          <p className="text-gray-600 text-xs font-normal font-['Poppins'] leading-relaxed whitespace-pre-line">
                            {job.recruiter_message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : activeTab === 'Saved' ? (
        <div className="w-full flex flex-col gap-[20px]">
          {/* Saved Jobs List container */}
          <div
            onScroll={triggerScrollbar}
            onMouseEnter={triggerScrollbar}
            onMouseMove={triggerScrollbar}
            className={`w-full h-[560px] overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent transition-all duration-300 ${
              showScrollbar
                ? "[scrollbar-color:rgba(209,213,219,0.8)_transparent] dark:[scrollbar-color:rgba(55,65,81,0.8)_transparent] [&::-webkit-scrollbar-thumb]:bg-gray-300/80 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb]:bg-[#374151]/80"
                : "[scrollbar-color:transparent_transparent] [&::-webkit-scrollbar-thumb]:bg-transparent"
            }`}
          >
            {jobs.length === 0 ? (
              <div className="w-full py-16 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-[#6366F1]">
                  <Icon icon="solar:bookmark-linear" className="w-8 h-8" />
                </div>
                <h4 className="text-black text-lg font-semibold font-['Poppins']">No saved jobs</h4>
                <p className="text-gray-500 text-sm font-['Poppins'] max-w-xs text-center">
                  You haven\'t saved any jobs yet. Browse jobs and bookmark them to view them here!
                </p>
                <button
                  onClick={() => setActiveTab('Explore')}
                  className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-[24px] text-sm font-semibold font-['Poppins'] transition-all"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      ) : (
        /* Original All Jobs View for Explore tab */
        <div className="w-full flex flex-col gap-[20px]">
          <h3 className="text-black text-lg font-semibold font-['Poppins'] leading-6">
            {activeTab === 'Explore' ? 'All jobs' : `${activeTab} jobs`}
          </h3>

          <JobFilters
            filters={filters}
            onFilterChange={setFilterValue}
            onClearFilters={() => {
              setFilterValue('job_type', '');
              setFilterValue('work_mode', '');
              setFilterValue('experience', '');
              setFilterValue('salary_range', '');
              setFilterValue('date_posted', '');
              setFilterValue('industry', '');
              setFilterValue('location_type', '');
            }}
          />

          {/* Job List container */}
          <div
            onScroll={triggerScrollbar}
            onMouseEnter={triggerScrollbar}
            onMouseMove={triggerScrollbar}
            className={`w-full h-[560px] overflow-y-auto pr-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent transition-all duration-300 ${
              showScrollbar
                ? "[scrollbar-color:rgba(209,213,219,0.8)_transparent] dark:[scrollbar-color:rgba(55,65,81,0.8)_transparent] [&::-webkit-scrollbar-thumb]:bg-gray-300/80 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb]:bg-[#374151]/80"
                : "[scrollbar-color:transparent_transparent] [&::-webkit-scrollbar-thumb]:bg-transparent"
            }`}
          >
            {jobs.length === 0 ? (
              <div className="w-full py-16 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-[#6366F1]">
                  <Icon icon={activeTab === 'Saved' ? 'solar:bookmark-linear' : 'lucide:briefcase'} className="w-8 h-8" />
                </div>
                <h4 className="text-black text-lg font-semibold font-['Poppins']">
                  {activeTab === 'Saved' ? 'No saved jobs' : 'No jobs found'}
                </h4>
                <p className="text-gray-500 text-sm font-['Poppins'] max-w-xs text-center">
                  {activeTab === 'Saved'
                    ? "You haven\'t saved any jobs yet. Browse jobs and bookmark them to view them here!"
                    : "No jobs match your current filters. Try adjusting them or clearing filters to see more listings."}
                </p>
                {activeTab === 'Saved' ? (
                  <button
                    onClick={() => setActiveTab('Explore')}
                    className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-[24px] text-sm font-semibold font-['Poppins'] transition-all"
                  >
                    Browse Jobs
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setFilterValue('job_type', '');
                      setFilterValue('work_mode', '');
                      setFilterValue('experience', '');
                      setFilterValue('salary_range', '');
                      setFilterValue('date_posted', '');
                      setFilterValue('industry', '');
                      setFilterValue('location_type', '');
                    }}
                    className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white rounded-[24px] text-sm font-semibold font-['Poppins'] transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
