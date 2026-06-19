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
      const activeCursor = isLoadMore ? cursor : undefined;
      const res = await jobsService.getJobs(filters, activeCursor);
      
      let newJobs = res.data;

      // Filter locally for tabs if not 'Explore'
      if (activeTab === 'Saved') {
        // Load all saved from local storage / local state
        const savedIds = JSON.parse(localStorage.getItem('saved_job_ids') || '[]');
        newJobs = newJobs.map(j => ({
          ...j,
          is_saved: savedIds.includes(j.id)
        })).filter(j => j.is_saved);
      } else if (activeTab === 'My applications') {
        const appliedIds = JSON.parse(localStorage.getItem('applied_job_ids') || '[]');
        newJobs = newJobs.map(j => ({
          ...j,
          is_applied: appliedIds.includes(j.id)
        })).filter(j => j.is_applied);
      } else {
        // Sync local storage states
        const savedIds = JSON.parse(localStorage.getItem('saved_job_ids') || '[]');
        const appliedIds = JSON.parse(localStorage.getItem('applied_job_ids') || '[]');
        newJobs = newJobs.map(j => ({
          ...j,
          is_saved: savedIds.includes(j.id) || !!j.is_saved,
          is_applied: appliedIds.includes(j.id) || !!j.is_applied
        }));
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

      setCursor(res.nextCursor || undefined);
      setHasMore(res.hasMore);
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
    applyToJob
  };
};
