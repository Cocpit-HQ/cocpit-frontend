import { useState, useEffect, useCallback, useRef } from 'react';
import { Job, JobsFilter } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useJobStore } from '@/store/job.store';

export const useJobs = (initialTab: string = 'Explore', initialSearch: string = '', initialLocation: string = '') => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { activeTab, setActiveTab } = useJobStore();

  const {
    filters,
    setFilterValue,
    setMultipleFilters,
    applicationStats,
    setApplicationStats,
    savedJobIds,
    appliedJobIds,
    addSavedId,
    removeSavedId,
    addAppliedId,
    removeAppliedId,
  } = useJobStore();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    if (initialSearch || initialLocation) {
      setMultipleFilters({ search: initialSearch, location: initialLocation });
    }
  }, [initialSearch, initialLocation, setMultipleFilters]);

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
      } else if (activeTab === 'Saved') {
        const activeCursor = isLoadMore ? cursor : undefined;
        const res = await jobsService.getSavedJobs(filters, activeCursor);
        newJobs = res.data;
        setCursor(res.nextCursor || undefined);
        setHasMore(res.hasMore);

        // Sync saved job IDs into store
        newJobs.forEach(j => {
          if (!savedJobIds.has(j.id)) {
            addSavedId(j.id);
          }
        });

        newJobs = newJobs.map(j => ({
          ...j,
          is_saved: true,
          is_applied: appliedJobIds.has(j.id)
        }));
      } else {
        const activeCursor = isLoadMore ? cursor : undefined;
        const res = await jobsService.getJobs(filters, activeCursor, activeTab === 'Explore');

        if (activeTab === 'Explore') {
          console.log("Selected Filters:", filters);
          console.log("Jobs Response:", res.data);
        }

        newJobs = res.data;
        setCursor(res.nextCursor || undefined);
        setHasMore(res.hasMore);

        newJobs = newJobs.map(j => ({
          ...j,
          is_saved: savedJobIds.has(j.id),
          is_applied: appliedJobIds.has(j.id)
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
      const isCurrentlySaved = savedJobIds.has(jobId);
      await jobsService.saveJob(jobId, !isCurrentlySaved);

      if (isCurrentlySaved) {
        removeSavedId(jobId);
      } else {
        addSavedId(jobId);
      }
      const updatedSaved = !isCurrentlySaved;

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_saved: updatedSaved } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, is_saved: updatedSaved } : null);
      }

      toast.success(updatedSaved ? 'Job saved successfully' : 'Job removed from saved list');
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error('Failed to toggle save status.');
    }
  }, [selectedJob, savedJobIds, addSavedId, removeSavedId]);

  const applyToJob = useCallback(async (jobId: string, resumeUrlOrName?: string, uploadedFile?: File | null, resumeId?: string | null, coverLetter?: string) => {
    try {
      if (appliedJobIds.has(jobId)) {
        toast.info('You have already applied to this job.');
        return;
      }

      let formData: FormData | undefined = undefined;
      if (uploadedFile || coverLetter || resumeId) {
        formData = new FormData();
        if (uploadedFile) formData.append('resume', uploadedFile);
        else if (resumeId) formData.append('resume_url', resumeId);
        if (coverLetter) formData.append('cover_note', coverLetter);
      }

      await jobsService.applyJob(jobId, formData);
      addAppliedId(jobId);

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_applied: true } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, is_applied: true } : null);
      }

      toast.success('Successfully applied to the job!');
    } catch (error: any) {
      console.error('Failed to apply to job:', error);
      const message = error.response?.data?.message || 'Failed to submit application.';
      toast.error(message);
    }
  }, [selectedJob, appliedJobIds, addAppliedId]);

  const withdrawJob = useCallback(async (jobId: string) => {
    try {
      await jobsService.withdrawApplication(jobId);
      removeAppliedId(jobId);

      setJobs(prev => {
        if (activeTab === 'My applications') {
          return prev.filter(j => j.id !== jobId);
        } else {
          return prev.map(j => j.id === jobId ? { ...j, application_status: 'Withdrawn', is_applied: false } : j);
        }
      });
      const stats = await jobsService.getApplicationStats();
      setApplicationStats(stats);
      toast.success('Application withdrawn successfully');
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      toast.error('Failed to withdraw application.');
    }
  }, [activeTab, removeAppliedId, setApplicationStats]);

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
    setMultipleFilters,
    toggleSave,
    applyToJob,
    withdrawJob,
    respondToOffer,
    applicationStats
  };
};
