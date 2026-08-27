import { useCallback, useEffect, useState, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Job, JobsFilter } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useJobStore } from '@/store/job.store';
import { useSession } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useJobs = (initialTab: string = 'Explore', initialSearch: string = '', initialLocation: string = '') => {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const queryClient = useQueryClient();

  const {
    activeTab,
    setActiveTab,
    filters,
    recruiterFilters,
    setCandidateFilterValue,
    setMultipleFilters,
    savedJobIds,
    appliedJobIds,
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
      recruiterFilters: state.filters.recruiterFilters,
      setCandidateFilterValue: state.setCandidateFilterValue,
      setMultipleFilters: state.setMultipleFilters,
      savedJobIds: state.savedJobIds,
      appliedJobIds: state.appliedJobIds,
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

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Initialize initial filters
  useEffect(() => {
    if (initialSearch || initialLocation) {
      setMultipleFilters({ search: initialSearch, location: initialLocation });
    }
  }, [initialSearch, initialLocation, setMultipleFilters]);

  const { activeProfile } = useActiveProfile();
  const isCompanyMode = activeProfile?.type === 'COMPANY';

  const apiFilters: JobsFilter = useMemo(() => ({
    search: filters.search,
    location: filters.location,
    job_type: filters.job_type || undefined,
    work_mode: filters.work_mode || undefined,
    experience: filters.experience || undefined,
    salary_range: recruiterFilters.salaryRange.length > 0
      ? recruiterFilters.salaryRange
      : (filters.salary_range || undefined),
    date_posted: filters.date_posted || undefined,
    industry: filters.industry || undefined,
  }), [filters, recruiterFilters.salaryRange]);

  // 1. Explore Tab Query (Paginated)
  const {
    data: exploreData,
    fetchNextPage: loadMoreExplore,
    hasNextPage: hasMoreExplore,
    isFetchingNextPage: isFetchingMoreExplore,
    isLoading: isLoadingExplore
  } = useInfiniteQuery({
    queryKey: ['jobs', 'explore', apiFilters],
    queryFn: async ({ pageParam }) => {
      const res = await jobsService.getJobs(apiFilters, pageParam as string | undefined, true);
      const savedSync: string[] = [];
      const appliedSync: string[] = [];
      res.data.forEach((j: Job) => {
        if (j.is_saved) savedSync.push(j.id);
        if (j.is_applied) appliedSync.push(j.id);
      });
      if (savedSync.length > 0) addSavedIds(savedSync);
      if (appliedSync.length > 0) addAppliedIds(appliedSync);
      return res;
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 3,
    enabled: !isCompanyMode && !!token && activeTab === 'Explore',
  });

  // 2. Saved Tab Query (Paginated)
  const {
    data: savedData,
    fetchNextPage: loadMoreSaved,
    hasNextPage: hasMoreSaved,
    isFetchingNextPage: isFetchingMoreSaved,
    isLoading: isLoadingSaved
  } = useInfiniteQuery({
    queryKey: ['jobs', 'saved', apiFilters],
    queryFn: async ({ pageParam }) => {
      const res = await jobsService.getSavedJobs(apiFilters, pageParam as string | undefined);
      return res;
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 3,
    enabled: !isCompanyMode && !!token && activeTab === 'Saved',
  });

  // 3. My Applications Query
  const selectedStatusFilter = filters.selectedStatusFilter || 'All';
  const {
    data: appliedData,
    fetchNextPage: loadMoreApplied,
    hasNextPage: hasMoreApplied,
    isFetchingNextPage: isFetchingMoreApplied,
    isLoading: isLoadingApplied
  } = useInfiniteQuery({
    queryKey: ['jobs', 'applied', selectedStatusFilter],
    queryFn: async ({ pageParam }) => {
      if (!pageParam) {
        jobsService.getApplicationStats().then(stats => setApplicationStats(stats)).catch(console.error);
      }
      return jobsService.getMyApplications(selectedStatusFilter, pageParam as string | undefined);
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 3,
    enabled: !isCompanyMode && !!token && activeTab === 'My Applications',
  });

  // 4. Offers Query
  const {
    data: offersData,
    isLoading: isLoadingOffers
  } = useQuery({
    queryKey: ['jobs', 'offers'],
    queryFn: () => jobsService.getMyOffers(),
    staleTime: 1000 * 60 * 3,
    enabled: !isCompanyMode && !!token && activeTab === 'Offers',
  });

  // 5. Recommendations Query
  const {
    data: rawRecommendations = [],
    isLoading: isRecommendationsLoading
  } = useQuery({
    queryKey: ['jobs', 'recommendations'],
    queryFn: () => jobsService.getRecommendations(),
    staleTime: 1000 * 60 * 10,
    enabled: !isCompanyMode && !!token && activeTab === 'Explore',
  });

  // Dynamically enhance lists with O(1) Zustand lookups
  const enhanceJob = useCallback((job: Job) => ({
    ...job,
    is_saved: job.is_saved || savedJobIds.has(job.id) || savedJobIds.has(job.offer_id || ''),
    is_applied: job.is_applied || appliedJobIds.has(job.id),
  }), [savedJobIds, appliedJobIds]);

  const recommendedJobs = useMemo(() => rawRecommendations.map(enhanceJob), [rawRecommendations, enhanceJob]);

  const activeJobs = useMemo(() => {
    let jobs: Job[] = [];
    if (activeTab === 'Explore') jobs = exploreData?.pages.flatMap(p => p.data).map(enhanceJob) || [];
    else if (activeTab === 'Saved') jobs = savedData?.pages.flatMap(p => p.data).map(enhanceJob) || [];
    else if (activeTab === 'My Applications') jobs = appliedData?.pages.flatMap(p => p.data).map(enhanceJob) || [];
    else if (activeTab === 'Offers') jobs = (offersData || []).map(enhanceJob);
    
    // Deduplicate jobs by ID to prevent React duplicate key errors
    const seen = new Set<string>();
    return jobs.filter(job => {
      if (!job.id) return false;
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });
  }, [activeTab, exploreData, savedData, appliedData, offersData, enhanceJob]);

  const isLoading = 
    (activeTab === 'Explore' && isLoadingExplore) ||
    (activeTab === 'Saved' && isLoadingSaved) ||
    (activeTab === 'My Applications' && isLoadingApplied) ||
    (activeTab === 'Offers' && isLoadingOffers);

  const isFetchingMore = 
    (activeTab === 'Explore' && isFetchingMoreExplore) ||
    (activeTab === 'Saved' && isFetchingMoreSaved) ||
    (activeTab === 'My Applications' && isFetchingMoreApplied);

  const hasMore = 
    (activeTab === 'Explore' && hasMoreExplore) ||
    (activeTab === 'Saved' && hasMoreSaved) ||
    (activeTab === 'My Applications' && hasMoreApplied) || false;

  const loadMore = useCallback(() => {
    if (activeTab === 'Explore' && hasMoreExplore) loadMoreExplore();
    if (activeTab === 'Saved' && hasMoreSaved) loadMoreSaved();
    if (activeTab === 'My Applications' && hasMoreApplied) loadMoreApplied();
  }, [activeTab, hasMoreExplore, loadMoreExplore, hasMoreSaved, loadMoreSaved, hasMoreApplied, loadMoreApplied]);

  const selectJob = useCallback((job: Job) => {
    setSelectedJob(job);
  }, []);

  // Mutations
  const toggleSaveMutation = useMutation({
    mutationFn: async ({ jobId, shouldSave }: { jobId: string; shouldSave: boolean }) => {
      // shouldSave is captured BEFORE onMutate toggles the store — avoids race condition
      await jobsService.saveJob(jobId, shouldSave);
      return { jobId, isSaved: shouldSave };
    },
    onMutate: async ({ jobId, shouldSave }) => {
      if (shouldSave) addSavedId(jobId);
      else removeSavedId(jobId);
      
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, is_saved: shouldSave } : null);
      }
      return { wasSaved: !shouldSave };
    },
    onError: (err, { jobId }, context) => {
      // Roll back: restore previous state
      if (context?.wasSaved) addSavedId(jobId);
      else removeSavedId(jobId);
      toast.error('Failed to toggle save status.');
    },
    onSuccess: (data) => {
      toast.success(data.isSaved ? 'Job saved successfully' : 'Job removed from saved list');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'saved'] });
    }
  });

  const applyMutation = useMutation({
    mutationFn: async ({ jobId, formData }: { jobId: string; formData?: FormData }) => {
      const res = await jobsService.applyJob(jobId, formData);
      return res;
    },
    onMutate: async ({ jobId }) => {
      addAppliedId(jobId);
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, is_applied: true, application_status: 'Applied' } : null);
      }
    },
    onError: (err: any, { jobId }) => {
      removeAppliedId(jobId);
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    },
    onSuccess: (res: any) => {
      toast.success(res?.message || 'Successfully applied to the job!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'applied'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'explore'] });
    }
  });

  const applyToJob = useCallback((jobId: string, resumeUrlOrName?: string, uploadedFile?: File | null, resumeId?: string | null, coverLetter?: string) => {
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
    applyMutation.mutate({ jobId, formData });
  }, [appliedJobIds, applyMutation]);

  const withdrawMutation = useMutation({
    mutationFn: (jobId: string) => jobsService.withdrawApplication(jobId),
    onMutate: async (jobId) => {
      removeAppliedId(jobId);
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, is_applied: false, application_status: 'Withdrawn' } : null);
      }
    },
    onError: (err, jobId) => {
      addAppliedId(jobId);
      toast.error('Failed to withdraw application.');
    },
    onSuccess: () => {
      toast.success('Application withdrawn successfully');
    },
    onSettled: async () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'applied'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'explore'] });
      const stats = await jobsService.getApplicationStats();
      setApplicationStats(stats);
    }
  });

  const respondOfferMutation = useMutation({
    mutationFn: ({ offerId, action }: { offerId: string, action: 'accept' | 'decline' }) => 
      jobsService.respondToOffer(offerId, action),
    onMutate: async ({ offerId, action }) => {
      setOfferResponse(offerId, action);
    },
    onError: () => {
      toast.error('Failed to respond to offer.');
    },
    onSuccess: (data, { action }) => {
      toast.success(action === 'accept' ? 'Offer accepted successfully!' : 'Offer declined successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'offers'] });
    }
  });

  return {
    jobs: activeJobs,
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
    setFilterValue: setCandidateFilterValue,
    setMultipleFilters,
    toggleSave: (jobId: string) => {
      // Capture the current saved state HERE, before onMutate has a chance to flip it
      const shouldSave = !savedJobIds.has(jobId);
      toggleSaveMutation.mutate({ jobId, shouldSave });
    },
    applyToJob,
    withdrawJob: (jobId: string) => withdrawMutation.mutate(jobId),
    respondToOffer: (offerId: string, action: 'accept' | 'decline') => respondOfferMutation.mutate({ offerId, action }),
    applicationStats: useJobStore(state => state.applications.stats),
  };
};
