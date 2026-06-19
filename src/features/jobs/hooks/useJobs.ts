import { useState, useEffect, useCallback } from 'react';
import { Job, JobsFilter } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';

export const useJobs = (initialTab: string = 'Explore', initialSearch: string = '') => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [applicationStats, setApplicationStats] = useState<{ totalApplied: number; shortlisted: number }>({ totalApplied: 0, shortlisted: 0 });
  
  const [filters, setFilters] = useState<JobsFilter>({
    search: initialSearch,
    job_type: '',
    work_mode: '',
    experience: '',
    salary_range: ''
  });

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Fetch initial list of jobs based on filters and activeTab
  const fetchJobs = useCallback(async (isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setIsFetchingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      let newJobs: Job[] = [];

      if (activeTab === 'My applications') {
        newJobs = await jobsService.getMyApplications();
        const stats = await jobsService.getApplicationStats();
        setApplicationStats(stats);
        setCursor(undefined);
        setHasMore(false);
      } else if (activeTab === 'Offers') {
        newJobs = await jobsService.getMyOffers();
        setCursor(undefined);
        setHasMore(false);
      } else {
        const activeCursor = isLoadMore ? cursor : undefined;
        const res = await jobsService.getJobs(filters, activeCursor);
        newJobs = res.data;
        setCursor(res.nextCursor || undefined);
        setHasMore(res.hasMore);

        if (activeTab === 'Saved') {
          if (typeof window !== 'undefined' && !localStorage.getItem('saved_job_ids')) {
            localStorage.setItem('saved_job_ids', JSON.stringify(['1', '2']));
          }
          const savedIds = JSON.parse(localStorage.getItem('saved_job_ids') || '[]');
          newJobs = newJobs.map(j => ({
            ...j,
            is_saved: savedIds.includes(j.id)
          })).filter(j => j.is_saved);
        } else {
          const savedIds = JSON.parse(localStorage.getItem('saved_job_ids') || '[]');
          const appliedIds = JSON.parse(localStorage.getItem('applied_job_ids') || '[]');
          newJobs = newJobs.map(j => ({
            ...j,
            is_saved: savedIds.includes(j.id),
            is_applied: appliedIds.includes(j.id)
          }));
        }
      }

      setJobs(prev => {
        if (isLoadMore) {
          const merged = [...prev, ...newJobs];
          // Deduplicate
          const seen = new Set();
          return merged.filter(j => {
            if (seen.has(j.id)) return false;
            seen.add(j.id);
            return true;
          });
        }
        return newJobs;
      });
    } catch (err) {
      console.error('Failed to load jobs:', err);
      toast.error('Failed to load jobs list.');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [filters, activeTab, cursor]);

  // Trigger fetch when filters or tab change
  useEffect(() => {
    fetchJobs(false);
  }, [filters, activeTab]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || isLoading) return;
    await fetchJobs(true);
  }, [hasMore, isFetchingMore, isLoading, fetchJobs]);

  const selectJob = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  const toggleSave = useCallback(async (jobId: string) => {
    try {
      const savedIds = JSON.parse(localStorage.getItem('saved_job_ids') || '[]');
      let isSaved = false;
      let newSavedIds: string[] = [];

      if (savedIds.includes(jobId)) {
        newSavedIds = savedIds.filter((id: string) => id !== jobId);
        isSaved = false;
      } else {
        newSavedIds = [...savedIds, jobId];
        isSaved = true;
      }

      localStorage.setItem('saved_job_ids', JSON.stringify(newSavedIds));
      await jobsService.saveJob(jobId);

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_saved: isSaved } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, is_saved: isSaved } : null);
      }

      toast.success(isSaved ? 'Job saved successfully' : 'Job removed from saved list');
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error('Failed to toggle save status.');
    }
  }, [selectedJob]);

  const applyToJob = useCallback(async (jobId: string) => {
    try {
      const appliedIds = JSON.parse(localStorage.getItem('applied_job_ids') || '[]');
      if (appliedIds.includes(jobId)) {
        toast.info('You have already applied to this job.');
        return;
      }

      const newAppliedIds = [...appliedIds, jobId];
      localStorage.setItem('applied_job_ids', JSON.stringify(newAppliedIds));
      await jobsService.applyJob(jobId);

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_applied: true } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, is_applied: true } : null);
      }

      toast.success('Successfully applied to the job!');
    } catch (error) {
      console.error('Failed to apply to job:', error);
      toast.error('Failed to submit application.');
    }
  }, [selectedJob]);

  const setFilterValue = useCallback((key: keyof JobsFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const withdrawJob = useCallback(async (jobId: string) => {
    try {
      await jobsService.withdrawApplication(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      const stats = await jobsService.getApplicationStats();
      setApplicationStats(stats);
      toast.success('Application withdrawn successfully');
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      toast.error('Failed to withdraw application.');
    }
  }, []);

  const respondToOffer = useCallback(async (offerId: string, action: 'accept' | 'decline') => {
    try {
      await jobsService.respondToOffer(offerId, action);
      setJobs(prev => prev.filter(j => j.id !== offerId));
      toast.success(action === 'accept' ? 'Offer accepted successfully!' : 'Offer declined successfully');
    } catch (error) {
      console.error('Failed to respond to offer:', error);
      toast.error('Failed to respond to offer.');
    }
  }, []);

  return {
    jobs,
    isLoading,
    isFetchingMore,
    hasMore,
    loadMore,
    selectedJob,
    selectJob,
    activeTab,
    setActiveTab,
    filters,
    setFilterValue,
    toggleSave,
    applyToJob,
    withdrawJob,
    respondToOffer,
    applicationStats
  };
};
