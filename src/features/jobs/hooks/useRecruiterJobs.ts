import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useJobStore } from '@/store/job.store';
import * as api from '@/services/api/jobs';
import type { Job } from '@/features/jobs/types/jobs.types';
import type { JobFormData } from '@/types/jobs';
import { toast } from 'sonner';

const mapOldToNewJob = (oldJob: any): Job => {
  return {
    id: oldJob.id,
    title: oldJob.title,
    company: oldJob.company,
    company_logo: oldJob.companyLogo,
    location: oldJob.location,
    job_type: oldJob.type,
    posted_at: oldJob.postedTime,
    applicants: oldJob.applicants,
    salary_display: oldJob.salary,
    description: oldJob.description || '',
    experience: oldJob.experience,
    work_mode: oldJob.workMode,
    is_saved: oldJob.isSaved,
    is_applied: oldJob.hasApplied,
    is_offer: oldJob.isOffer,
    application_status: oldJob.applicationStatus,
    created_at: oldJob.createdAt,
    org_id: oldJob.companyId,
    actively_hiring: oldJob.activelyHiring,
    easy_apply: oldJob.easyApply,
  };
};
export const useRecruiterJobs = (companyId?: string) => {
  const {
    activeTab,
    setActiveTab,
    selectedJobId,
    setSelectedJobId,
    searchKeywords,
    published,
    drafts,
    archived,
    offers,
    setRecruiterList,
    setApplicationsList,
    addRecruiterJob,
    updateRecruiterJob,
    deleteRecruiterJob,
    publishRecruiterDraft,
    setCandidateFilterValue,
  } = useJobStore(
    useShallow((state) => ({
      activeTab: state.ui.activeRecruiterTab,
      setActiveTab: state.setActiveRecruiterTab,
      selectedJobId: state.ui.selectedJobId,
      setSelectedJobId: state.setSelectedJobId,
      searchKeywords: state.filters.search,
      published: state.recruiter.published,
      drafts: state.recruiter.drafts,
      archived: state.recruiter.archived,
      offers: state.applications.offers,
      setRecruiterList: state.setRecruiterList,
      setApplicationsList: state.setApplicationsList,
      addRecruiterJob: state.addRecruiterJob,
      updateRecruiterJob: state.updateRecruiterJob,
      deleteRecruiterJob: state.deleteRecruiterJob,
      publishRecruiterDraft: state.publishRecruiterDraft,
      setCandidateFilterValue: state.setCandidateFilterValue,
    }))
  );

  const setSearchKeywords = (val: string) => setCandidateFilterValue('search', val);

  // Helper to fetch list depending on active tab
  const fetchList = useCallback(async (isLoadMore: boolean = false) => {
    if (!companyId) return;

    let targetListKey: 'published' | 'drafts' | 'archived' | 'offers' = 'published';
    if (activeTab === 'offers') targetListKey = 'offers';
    else if (activeTab === 'dashboard') targetListKey = 'drafts'; 

    // Read current list state fresh from the store to avoid stale closure values
    const storeState = useJobStore.getState();
    const currentList = targetListKey === 'offers'
      ? storeState.applications.offers
      : storeState.recruiter[targetListKey as 'published' | 'drafts' | 'archived'];
    
    // Don't refetch if already fetched, unless doing loadMore
    if (!isLoadMore && currentList.hasFetched && currentList.jobs.length > 0) {
      return;
    }

    // Set loading
    updateListState(targetListKey, { loading: true, error: null });

    try {
      const cursor = isLoadMore ? currentList.nextCursor : undefined;
      const params = {
        search: searchKeywords,
        limit: 10,
        cursor,
      };

      let rawJobs: any[] = [];
      if (activeTab === 'offers') {
        rawJobs = await api.getCompanySentOffers(companyId, params);
      } else {
        rawJobs = await api.getCompanyJobs(companyId, params);
      }

      const fetchedJobs = rawJobs.map(mapOldToNewJob);

      const nextJobs = isLoadMore ? [...currentList.jobs, ...fetchedJobs] : fetchedJobs;
      const hasMore = fetchedJobs.length >= 10;
      
      let nextCursor: string | undefined = undefined;
      if (fetchedJobs.length > 0) {
        const lastItem = fetchedJobs[fetchedJobs.length - 1];
        nextCursor = lastItem.created_at || lastItem.posted_at;
      }

      updateListState(targetListKey, {
        jobs: nextJobs,
        nextCursor,
        hasMore,
        loading: false,
        hasFetched: true,
        lastFetched: Date.now(),
      });
    } catch (err: any) {
      console.error(`Failed to fetch recruiter ${activeTab} jobs:`, err);
      updateListState(targetListKey, {
        loading: false,
        error: err.message || 'Failed to load jobs list',
      });
      toast.error('Failed to load company jobs.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, activeTab, searchKeywords]);

  // Initial fetch trigger
  useEffect(() => {
    fetchList(false);
  }, [fetchList]);



  function updateListState(key: 'published' | 'drafts' | 'archived' | 'offers', updates: any) {
    if (key === 'offers') {
      setApplicationsList('offers', updates);
    } else {
      setRecruiterList(key, updates);
    }
  }

  const loadMore = useCallback(() => {
    fetchList(true);
  }, [fetchList]);

  // Determine which list to return based on active tab
  const getActiveList = () => {
    if (activeTab === 'offers') return offers;
    if (activeTab === 'dashboard') return drafts;
    return published;
  };

  const activeList = getActiveList();

  // Create Job
  const createNewJob = async (jobData: JobFormData) => {
    try {
      await api.createJob(jobData);
      const newJob: Job = {
        id: Math.random().toString(36).substring(7),
        title: jobData.jobTitle,
        company: 'Your Company',
        location: jobData.location,
        job_type: jobData.jobType,
        posted_at: 'Just now',
        applicants: 0,
        salary_display: `${jobData.minSalary}-${jobData.maxSalary}`,
        created_at: new Date().toISOString(),
        description: jobData.jobDescription,
        experience: jobData.experience,
        work_mode: jobData.workMode,
        actively_hiring: jobData.activelyHiring,
        easy_apply: jobData.easyApply,
      };
      const listKey = jobData.activelyHiring ? 'published' : 'drafts';
      addRecruiterJob(listKey, newJob);
      toast.success('Job posted successfully!');
    } catch (err) {
      console.error('Failed to create job:', err);
      toast.error('Failed to post job.');
      throw err;
    }
  };

  // Update Job
  const updateExistingJob = async (jobId: string, jobData: JobFormData) => {
    try {
      await api.updateJob(jobId, jobData);
      const updatedJob: Partial<Job> = {
        id: jobId,
        title: jobData.jobTitle,
        location: jobData.location,
        job_type: jobData.jobType,
        description: jobData.jobDescription,
        experience: jobData.experience,
        work_mode: jobData.workMode,
        actively_hiring: jobData.activelyHiring,
      };
      updateRecruiterJob(updatedJob as Job);
      toast.success('Job updated successfully!');
    } catch (err) {
      console.error('Failed to update job:', err);
      toast.error('Failed to update job.');
      throw err;
    }
  };

  // Delete Job
  const removeJob = async (jobId: string) => {
    try {
      await api.deleteJob(jobId);
      deleteRecruiterJob(jobId);
      toast.success('Job deleted successfully.');
    } catch (err) {
      console.error('Failed to delete job:', err);
      toast.error('Failed to delete job.');
      throw err;
    }
  };

  return {
    activeTab,
    setActiveTab,
    searchKeywords,
    setSearchKeywords,
    isLoading: activeList.loading && !activeList.hasFetched,
    isFetchingNextPage: activeList.loading && activeList.hasFetched,
    hasNextPage: activeList.hasMore,
    fetchNextPage: loadMore,
    jobs: activeList.jobs, 
    myJobs: published.jobs, 
    selectedJobId,
    setSelectedJobId,
    createNewJob,
    updateExistingJob,
    removeJob,
    publishDraft: publishRecruiterDraft,
  };
};
