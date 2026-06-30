import { useCallback, useEffect, useState, useMemo } from 'react';
import { Job, JobsFilter } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useJobStore, CachedList } from '@/store/job.store';
import { useSession } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';

export const useJobs = (initialTab: string = 'Explore', initialSearch: string = '', initialLocation: string = '') => {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const {
    activeTab,
    setActiveTab,
    filters,
    setCandidateFilterValue,
    setMultipleFilters,
    explore,
    applications,
    savedJobIds,
    appliedJobIds,
    setExploreList,
    setApplicationsList,
    setApplicationStats,
    addSavedId,
    removeSavedId,
    addAppliedId,
    removeAppliedId,
    addSavedIds,
    addAppliedIds,
    setOfferResponse,
  } = useJobStore(
    useShallow((state) => ({
      activeTab: state.ui.activeCandidateTab,
      setActiveTab: state.setActiveCandidateTab,
      filters: state.filters,
      setCandidateFilterValue: state.setCandidateFilterValue,
      setMultipleFilters: state.setMultipleFilters,
      explore: state.explore,
      applications: state.applications,
      savedJobIds: state.savedJobIds,
      appliedJobIds: state.appliedJobIds,
      setExploreList: state.setExploreList,
      setApplicationsList: state.setApplicationsList,
      setApplicationStats: state.setApplicationStats,
      addSavedId: state.addSavedId,
      removeSavedId: state.removeSavedId,
      addAppliedId: state.addAppliedId,
      removeAppliedId: state.removeAppliedId,
      addSavedIds: state.addSavedIds,
      addAppliedIds: state.addAppliedIds,
      setOfferResponse: state.setOfferResponse,
    }))
  );

  const [rawRecommendations, setRawRecommendations] = useState<Job[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Compute recommendedJobs dynamically so saved/applied indicators update instantly without re-fetching
  const recommendedJobs = useMemo(() => {
    return rawRecommendations.map(rj => ({
      ...rj,
      is_saved: savedJobIds.has(rj.id),
      is_applied: appliedJobIds.has(rj.id)
    }));
  }, [rawRecommendations, savedJobIds, appliedJobIds]);

  // Initialize initial filters
  useEffect(() => {
    if (initialSearch || initialLocation) {
      setMultipleFilters({ search: initialSearch, location: initialLocation });
    }
  }, [initialSearch, initialLocation, setMultipleFilters]);

  // Determine current active list from Zustand
  const getActiveList = useCallback((): CachedList<Job> => {
    if (activeTab === 'Explore') return explore;
    if (activeTab === 'My Applications') return applications.applied;
    if (activeTab === 'Offers') return applications.offers;
    return applications.saved;
  }, [activeTab, explore, applications]);

  const activeList = getActiveList();

  const updateActiveListState = useCallback((updates: Partial<CachedList<Job>>) => {
    if (activeTab === 'Explore') {
      setExploreList(updates);
    } else {
      const key = activeTab === 'My Applications' ? 'applied' : activeTab === 'Offers' ? 'offers' : 'saved';
      setApplicationsList(key, updates);
    }
  }, [activeTab, setExploreList, setApplicationsList]);

  // Fetch initial list of jobs based on filters and activeTab
  const fetchJobs = useCallback(async (isLoadMore: boolean = false, forceRefetch: boolean = false) => {
    const list = getActiveList();
    if (!isLoadMore && !forceRefetch && list.hasFetched && list.jobs.length > 0) {
      return;
    }

    updateActiveListState({ 
      loading: true, 
      error: null,
      ...( (!isLoadMore && forceRefetch) ? { jobs: [], hasFetched: false } : {} )
    });

    try {
      let fetchedJobs: Job[] = [];
      let nextCursor: string | undefined = undefined;
      let hasMore = false;

      const cursor = isLoadMore ? list.nextCursor : undefined;

      const apiFilters: JobsFilter = {
        search: filters.search,
        location: filters.location,
        job_type: filters.job_type || undefined,
        work_mode: filters.work_mode || undefined,
        experience: filters.experience || undefined,
        salary_range: filters.salary_range || undefined,
        date_posted: filters.date_posted || undefined,
        industry: filters.industry || undefined,
      };

      if (activeTab === 'My Applications') {
        fetchedJobs = await jobsService.getMyApplications();
        const stats = await jobsService.getApplicationStats();
        setApplicationStats(stats);
        hasMore = false;
      } else if (activeTab === 'Offers') {
        fetchedJobs = await jobsService.getMyOffers();
        hasMore = false;
      } else if (activeTab === 'Saved') {
        const res = await jobsService.getSavedJobs(apiFilters, cursor);
        fetchedJobs = res.data;
        nextCursor = res.nextCursor || undefined;
        hasMore = res.hasMore;
      } else {
        const res = await jobsService.getJobs(apiFilters, cursor, true);
        fetchedJobs = res.data;
        nextCursor = res.nextCursor || undefined;
        hasMore = res.hasMore;
      }

      const savedIdsToSync: string[] = [];
      const appliedIdsToSync: string[] = [];
      fetchedJobs.forEach(j => {
        if (j.is_saved && !savedJobIds.has(j.id)) savedIdsToSync.push(j.id);
        if (j.is_applied && !appliedJobIds.has(j.id)) appliedIdsToSync.push(j.id);
      });

      if (savedIdsToSync.length > 0) addSavedIds(savedIdsToSync);
      if (appliedIdsToSync.length > 0) addAppliedIds(appliedIdsToSync);

      const enhancedJobs = fetchedJobs.map(j => ({
        ...j,
        is_saved: j.is_saved || savedJobIds.has(j.id),
        is_applied: j.is_applied || appliedJobIds.has(j.id),
      }));

      const nextJobs = isLoadMore ? [...list.jobs, ...enhancedJobs] : enhancedJobs;

      const seen = new Set();
      const deduplicatedList = nextJobs.filter(j => {
        if (seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      });

      updateActiveListState({
        jobs: deduplicatedList,
        nextCursor,
        hasMore,
        loading: false,
        hasFetched: true,
        lastFetched: Date.now(),
      });
    } catch (err: any) {
      console.error('Failed to load jobs:', err);
      updateActiveListState({
        loading: false,
        error: err.message || 'Failed to load jobs',
      });
      toast.error('Failed to load jobs list.');
    }
  }, [activeTab, explore, applications, filters, savedJobIds, appliedJobIds, addSavedIds, addAppliedIds, setApplicationStats, getActiveList, updateActiveListState]);

  useEffect(() => {
    fetchJobs(false, true);
  }, [
    activeTab,
    filters.search,
    filters.location,
    filters.job_type,
    filters.work_mode,
    filters.experience,
    filters.salary_range,
    filters.date_posted,
    filters.industry,
    token
  ]);

  // Fetch recommendations once on load (when token is available and Explore tab is active)
  useEffect(() => {
    if (!token || activeTab !== 'Explore') return;

    setIsRecommendationsLoading(true);
    jobsService.getRecommendations()
      .then(recJobs => {
        setRawRecommendations(recJobs);
      })
      .catch(err => console.error("Failed to load recommended jobs", err))
      .finally(() => setIsRecommendationsLoading(false));
  }, [token, activeTab]);

  const loadMore = useCallback(async () => {
    if (!activeList.hasMore || activeList.loading) return;
    await fetchJobs(true);
  }, [activeList.hasMore, activeList.loading, fetchJobs]);

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

      const updateSavedStatus = (list: CachedList<Job>) => ({
        ...list,
        jobs: list.jobs.map(j => j.id === jobId ? { ...j, is_saved: updatedSaved } : j),
      });

      setExploreList(updateSavedStatus(explore));
      setApplicationsList('applied', updateSavedStatus(applications.applied));
      setApplicationsList('offers', updateSavedStatus(applications.offers));
      
      if (updatedSaved) {
        const targetJob = explore.jobs.find(j => j.id === jobId) || 
                          recommendedJobs.find(j => j.id === jobId) ||
                          applications.applied.jobs.find(j => j.id === jobId) ||
                          applications.offers.jobs.find(j => j.id === jobId);
        if (targetJob) {
          const savedJob = { ...targetJob, is_saved: true };
          setApplicationsList('saved', {
            ...applications.saved,
            jobs: [savedJob, ...applications.saved.jobs],
          });
        }
      } else {
        setApplicationsList('saved', {
          ...applications.saved,
          jobs: applications.saved.jobs.filter(j => j.id !== jobId),
        });
      }

      setRawRecommendations(prev => prev.map(j => j.id === jobId ? { ...j, is_saved: updatedSaved } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, is_saved: updatedSaved } : null);
      }

      toast.success(updatedSaved ? 'Job saved successfully' : 'Job removed from saved list');
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error('Failed to toggle save status.');
    }
  }, [selectedJob, savedJobIds, addSavedId, removeSavedId, explore, applications, setExploreList, setApplicationsList, recommendedJobs]);

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

      const updateAppliedStatus = (list: CachedList<Job>) => ({
        ...list,
        jobs: list.jobs.map(j => j.id === jobId ? { ...j, is_applied: true, application_status: 'Applied' } : j),
      });

      setExploreList(updateAppliedStatus(explore));
      setApplicationsList('saved', updateAppliedStatus(applications.saved));
      setApplicationsList('offers', updateAppliedStatus(applications.offers));

      const targetJob = explore.jobs.find(j => j.id === jobId) || applications.saved.jobs.find(j => j.id === jobId);
      if (targetJob) {
        const appliedJob = { ...targetJob, is_applied: true, application_status: 'Applied' };
        setApplicationsList('applied', {
          ...applications.applied,
          jobs: [appliedJob, ...applications.applied.jobs],
        });
      }

      setRawRecommendations(prev => prev.map(j => j.id === jobId ? { ...j, is_applied: true, application_status: 'Applied' } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, is_applied: true } : null);
      }

      toast.success('Successfully applied to the job!');
    } catch (error: any) {
      console.error('Failed to apply to job:', error);
      const message = error.response?.data?.message || 'Failed to submit application.';
      toast.error(message);
    }
  }, [selectedJob, appliedJobIds, addAppliedId, explore, applications, setExploreList, setApplicationsList]);

  const withdrawJob = useCallback(async (jobId: string) => {
    try {
      await jobsService.withdrawApplication(jobId);
      removeAppliedId(jobId);

      const updateWithdrawnStatus = (list: CachedList<Job>) => ({
        ...list,
        jobs: list.jobs.map(j => j.id === jobId ? { ...j, is_applied: false, application_status: 'Withdrawn' } : j),
      });

      setExploreList(updateWithdrawnStatus(explore));
      setApplicationsList('saved', updateWithdrawnStatus(applications.saved));
      setApplicationsList('offers', updateWithdrawnStatus(applications.offers));

      setApplicationsList('applied', {
        ...applications.applied,
        jobs: applications.applied.jobs.filter(j => j.id !== jobId),
      });

      setRawRecommendations(prev => prev.map(j => j.id === jobId ? { ...j, application_status: 'Withdrawn', is_applied: false } : j));
      
      const stats = await jobsService.getApplicationStats();
      setApplicationStats(stats);
      toast.success('Application withdrawn successfully');
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      toast.error('Failed to withdraw application.');
    }
  }, [removeAppliedId, setApplicationStats, explore, applications, setExploreList, setApplicationsList]);

  const respondToOffer = useCallback(async (offerId: string, action: 'accept' | 'decline') => {
    try {
      await jobsService.respondToOffer(offerId, action);
      setOfferResponse(offerId, action);

      const status = action === 'accept' ? 'Accepted' : 'Declined';
      const updateOfferStatus = (list: CachedList<Job>) => ({
        ...list,
        jobs: list.jobs.map(j => j.id === offerId ? { ...j, application_status: status } : j),
      });

      setExploreList(updateOfferStatus(explore));
      setApplicationsList('applied', updateOfferStatus(applications.applied));
      setApplicationsList('saved', updateOfferStatus(applications.saved));
      setApplicationsList('offers', updateOfferStatus(applications.offers));

      toast.success(action === 'accept' ? 'Offer accepted successfully!' : 'Offer declined successfully');
    } catch (error) {
      console.error('Failed to respond to offer:', error);
      toast.error('Failed to respond to offer.');
    }
  }, [explore, applications, setExploreList, setApplicationsList, setOfferResponse]);

  return {
    jobs: activeList.jobs,
    recommendedJobs,
    isLoading: activeList.loading && !activeList.hasFetched,
    isRecommendationsLoading,
    isFetchingMore: activeList.loading && activeList.hasFetched,
    hasMore: activeList.hasMore,
    loadMore,
    selectedJob,
    selectJob,
    activeTab,
    setActiveTab,
    filters,
    setFilterValue: setCandidateFilterValue,
    setMultipleFilters,
    toggleSave,
    applyToJob,
    withdrawJob,
    respondToOffer,
    applicationStats: applications.stats,
  };
};
