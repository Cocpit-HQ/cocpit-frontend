import { useState, useEffect, useCallback, useRef } from 'react';
import { Job, JobsFilter } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useJobStore } from '@/store/job.store';
import { useSession } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';

export const useJobs = (initialTab: string = 'Explore', initialSearch: string = '', initialLocation: string = '') => {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const {
    activeTab,
    setActiveTab,
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
    addSavedIds,
    addAppliedIds,
  } = useJobStore(
    useShallow((state) => ({
      activeTab: state.activeTab,
      setActiveTab: state.setActiveTab,
      filters: state.filters,
      setFilterValue: state.setFilterValue,
      setMultipleFilters: state.setMultipleFilters,
      applicationStats: state.applicationStats,
      setApplicationStats: state.setApplicationStats,
      savedJobIds: state.savedJobIds,
      appliedJobIds: state.appliedJobIds,
      addSavedId: state.addSavedId,
      removeSavedId: state.removeSavedId,
      addAppliedId: state.addAppliedId,
      removeAppliedId: state.removeAppliedId,
      addSavedIds: state.addSavedIds,
      addAppliedIds: state.addAppliedIds,
    }))
  );

  const [jobsByTab, setJobsByTab] = useState<Record<string, Job[]>>({
    Explore: [],
    'My applications': [],
    Offers: [],
    Saved: [],
  });
  const lastFiltersRef = useRef<Record<string, JobsFilter>>({});
  const jobs = jobsByTab[activeTab] || [];

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    if (initialSearch || initialLocation) {
      setMultipleFilters({ search: initialSearch, location: initialLocation });
    }
  }, [initialSearch, initialLocation, setMultipleFilters]);

  // Fetch initial list of jobs based on filters and activeTab
  const fetchJobs = useCallback(async (isLoadMore: boolean = false) => {
    const currentFiltersStr = JSON.stringify(filters);
    const lastFiltersStr = JSON.stringify(lastFiltersRef.current[activeTab] || {});
    const filtersChanged = currentFiltersStr !== lastFiltersStr;

    // Save current filters as last filters
    if (!isLoadMore) {
      lastFiltersRef.current[activeTab] = { ...filters };
    }

    const hasCachedData = (jobsByTab[activeTab] || []).length > 0 && !filtersChanged;

    if (isLoadMore) {
      setIsFetchingMore(true);
    } else {
      if (filtersChanged) {
        setJobsByTab(prev => ({
          ...prev,
          [activeTab]: []
        }));
      }
      if (!hasCachedData) {
        setIsLoading(true);
      }
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

        const updatedAppliedIds = new Set(appliedJobIds);
        const savedIdsToSync: string[] = [];
        const appliedIdsToSync: string[] = [];

        // Sync saved job IDs into store
        newJobs.forEach(j => {
          if (!savedJobIds.has(j.id)) {
            savedIdsToSync.push(j.id);
          }
          if (j.is_applied) {
            updatedAppliedIds.add(j.id);
            if (!appliedJobIds.has(j.id)) {
              appliedIdsToSync.push(j.id);
            }
          }
        });

        if (savedIdsToSync.length > 0) addSavedIds(savedIdsToSync);
        if (appliedIdsToSync.length > 0) addAppliedIds(appliedIdsToSync);

        newJobs = newJobs.map(j => ({
          ...j,
          is_saved: true,
          is_applied: updatedAppliedIds.has(j.id)
        }));
      } else {
        const activeCursor = isLoadMore ? cursor : undefined;
        const res = await jobsService.getJobs(filters, activeCursor, activeTab === 'Explore');

        if (activeTab === 'Explore') {
          console.log("Selected Filters:", filters);
          console.log("Jobs Response:", res.data);
          
          if (!isLoadMore) {
            setIsRecommendationsLoading(true);
            jobsService.getRecommendations()
              .then(recJobs => {
                setRecommendedJobs(recJobs.map(rj => ({
                  ...rj,
                  is_saved: savedJobIds.has(rj.id),
                  is_applied: appliedJobIds.has(rj.id)
                })));
              })
              .catch(err => console.error("Failed to load recommended jobs", err))
              .finally(() => setIsRecommendationsLoading(false));
          }
        }

        newJobs = res.data;
        setCursor(res.nextCursor || undefined);
        setHasMore(res.hasMore);

        const updatedSavedIds = new Set(savedJobIds);
        const updatedAppliedIds = new Set(appliedJobIds);
        const savedIdsToSync: string[] = [];
        const appliedIdsToSync: string[] = [];

        // Sync saved and applied job IDs into the store from backend values
        newJobs.forEach(j => {
          if (j.is_saved) {
            updatedSavedIds.add(j.id);
            if (!savedJobIds.has(j.id)) {
              savedIdsToSync.push(j.id);
            }
          }
          if (j.is_applied) {
            updatedAppliedIds.add(j.id);
            if (!appliedJobIds.has(j.id)) {
              appliedIdsToSync.push(j.id);
            }
          }
        });

        if (savedIdsToSync.length > 0) addSavedIds(savedIdsToSync);
        if (appliedIdsToSync.length > 0) addAppliedIds(appliedIdsToSync);

        newJobs = newJobs.map(j => ({
          ...j,
          is_saved: updatedSavedIds.has(j.id),
          is_applied: updatedAppliedIds.has(j.id)
        }));
      }

      setJobsByTab(prev => {
        const currentTabList = prev[activeTab] || [];
        const nextList = isLoadMore ? [...currentTabList, ...newJobs] : newJobs;
        const seen = new Set();
        const deduplicatedList = nextList.filter(j => {
          if (seen.has(j.id)) return false;
          seen.add(j.id);
          return true;
        });
        return {
          ...prev,
          [activeTab]: deduplicatedList
        };
      });
    } catch (err) {
      console.error('Failed to load jobs:', err);
      toast.error('Failed to load jobs list.');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [filters, activeTab, cursor, savedJobIds, appliedJobIds, addSavedIds, addAppliedIds, setApplicationStats, jobsByTab]);

  // Trigger fetch when filters, tab, or token change
  useEffect(() => {
    fetchJobs(false);
  }, [filters, activeTab, token]);

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

      setJobsByTab(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(tab => {
          next[tab] = next[tab].map(j => j.id === jobId ? { ...j, is_saved: updatedSaved } : j);
        });
        return next;
      });

      setRecommendedJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_saved: updatedSaved } : j));
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

      setJobsByTab(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(tab => {
          next[tab] = next[tab].map(j => j.id === jobId ? { ...j, is_applied: true } : j);
        });
        return next;
      });

      setRecommendedJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_applied: true } : j));
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

      setJobsByTab(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(tab => {
          if (tab === 'My applications') {
            next[tab] = next[tab].filter(j => j.id !== jobId);
          } else {
            next[tab] = next[tab].map(j => j.id === jobId ? { ...j, application_status: 'Withdrawn', is_applied: false } : j);
          }
        });
        return next;
      });
      setRecommendedJobs(prev => prev.map(j => j.id === jobId ? { ...j, application_status: 'Withdrawn', is_applied: false } : j));
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
      setJobsByTab(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(tab => {
          next[tab] = next[tab].filter(j => j.id !== offerId);
        });
        return next;
      });
      toast.success(action === 'accept' ? 'Offer accepted successfully!' : 'Offer declined successfully');
    } catch (error) {
      console.error('Failed to respond to offer:', error);
      toast.error('Failed to respond to offer.');
    }
  }, []);

  return {
    jobs,
    recommendedJobs,
    isLoading,
    isRecommendationsLoading,
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
