import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { JOB_OFFERS_QUERY_KEY } from './useJobOffers';
import { Job, JobOffer } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useJobStore } from '@/store/job.store';

export const useJobDetail = (jobId: string) => {
  const [rawJob, setRawJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const activeJobIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const hasSeededFollowRef = useRef(false);

  const {
    savedJobIds,
    appliedJobIds,
    respondedOffers,
    followedCompanies,
    addSavedId,
    removeSavedId,
    addAppliedId,
    removeAppliedId,
    setOfferResponse,
    toggleFollowCompany
  } = useJobStore();

  const fetchJob = useCallback(async () => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      setIsLoading(true);
      return;
    }
    setIsLoading(true);
    activeJobIdRef.current = jobId;
    try {
      const res = await jobsService.getJobById(jobId);
      if (activeJobIdRef.current === jobId) {
        setRawJob(res);
      }
    } catch (err) {
      console.error('Failed to load job details:', err);
      if (activeJobIdRef.current === jobId) {
        toast.error('Failed to load job details.');
      }
    } finally {
      if (activeJobIdRef.current === jobId) {
        setIsLoading(false);
      }
    }
  }, [jobId]);

  // Handle initial fetch and cancellation
  useEffect(() => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      setIsLoading(true);
      return;
    }
    fetchJob();
    return () => {
      activeJobIdRef.current = null;
    };
  }, [jobId, fetchJob]);

  // Dynamically compute the merged job object
  const job = useMemo(() => {
    if (!rawJob) return null;
    
    const processed = { ...rawJob };
    processed.is_saved = processed.is_saved || savedJobIds.has(processed.id);
    processed.is_applied = processed.is_applied || appliedJobIds.has(processed.id);

    // Handle offer statuses
    if (processed.is_offer) {
      if (processed.offerStatus) {
        processed.application_status = processed.offerStatus.charAt(0).toUpperCase() + processed.offerStatus.slice(1);
      }
      const offerKey = processed.offer_id;
      const offerResponse = (offerKey && respondedOffers[offerKey]) || respondedOffers[processed.id];
      if (offerResponse) {
        const normAction = offerResponse.toLowerCase();
        const isAccept = normAction === 'accept' || normAction === 'accepted';
        processed.offerStatus = isAccept ? 'accepted' : 'declined';
        processed.application_status = isAccept ? 'Accepted' : 'Declined';
      }
    }

    // Handle followed status for company
    processed.is_followed = processed.is_followed || followedCompanies.has(processed.company);
    return processed;
  }, [rawJob, savedJobIds, appliedJobIds, respondedOffers, followedCompanies]);

  // Seed the store with initial values from the API (only once per job load)
  useEffect(() => {
    if (!rawJob) return;

    if (rawJob.is_applied && !appliedJobIds.has(rawJob.id)) {
      addAppliedId(rawJob.id);
    }
    
    if (rawJob.is_saved && !savedJobIds.has(rawJob.id)) {
      addSavedId(rawJob.id);
    }

    if (!hasSeededFollowRef.current && rawJob.is_followed && rawJob.company && !followedCompanies.has(rawJob.company)) {
      hasSeededFollowRef.current = true;
      toggleFollowCompany(rawJob.company);
    }
  }, [rawJob?.id]);

  const toggleSave = useCallback(async () => {
    if (!job) return;
    try {
      const isCurrentlySaved = savedJobIds.has(job.id);
      await jobsService.saveJob(job.id, !isCurrentlySaved);
      
      if (isCurrentlySaved) {
        removeSavedId(job.id);
      } else {
        addSavedId(job.id);
      }
      toast.success(!isCurrentlySaved ? 'Job saved successfully' : 'Job removed from saved list');
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error('Failed to update save status.');
    }
  }, [job, savedJobIds, addSavedId, removeSavedId]);

  const applyToJob = useCallback(async (resumeUrlOrName?: string, uploadedFile?: File | null, resumeId?: string | null, coverLetter?: string) => {
    if (!job) return;
    try {
      if (appliedJobIds.has(job.id)) {
        toast.info('You have already applied to this job.');
        return;
      }

      let formData: FormData | undefined = undefined;
      let jsonBody: any = undefined;
      if (uploadedFile || resumeId || coverLetter) {
        formData = new FormData();
        if (uploadedFile) formData.append('resume', uploadedFile);
        else if (resumeId) {
          formData.append('resume_url', resumeId);
          if (resumeUrlOrName) formData.append('resume_file_name', resumeUrlOrName);
        }
        if (coverLetter) formData.append('cover_note', coverLetter);
      } else if (resumeUrlOrName || resumeId) {
        jsonBody = {
          resume_url: resumeUrlOrName || resumeId,
          resume_file_name: resumeUrlOrName || null,
          cover_note: coverLetter
        };
      }

      const res = await jobsService.applyJob(job.id, formData, jsonBody);
      addAppliedId(job.id);
      toast.success(res?.message || 'Successfully applied to the job!');
    } catch (error) {
      console.error('Failed to apply to job:', error);
      toast.error('Failed to submit application.');
      throw error;
    }
  }, [job, appliedJobIds, addAppliedId]);

  const withdrawJob = useCallback(async () => {
    if (!job) return;
    try {
      await jobsService.withdrawApplication(job.id);
      removeAppliedId(job.id);
      toast.success('Application withdrawn successfully.');
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      toast.error('Failed to withdraw application.');
    }
  }, [job, removeAppliedId]);

  const respondToOffer = useCallback(async (action: 'accept' | 'decline') => {
    if (!job) return;
    const offerId = job.offer_id || job.id;
    const targetStatus = action === 'accept' ? ('accepted' as const) : ('declined' as const);
    const targetAppStatus = action === 'accept' ? 'Accepted' : 'Declined';

    // 1. Optimistically update local Zustand store for all possible keys
    setOfferResponse(job.id, action);
    if (job.offer_id) {
      setOfferResponse(job.offer_id, action);
    }

    // 2. Optimistically update local component state
    setRawJob(prev => prev ? {
      ...prev,
      offerStatus: targetStatus,
      application_status: targetAppStatus
    } : prev);

    // 3. Optimistically update React Query 'jobOffers' cache
    queryClient.setQueryData<JobOffer[]>(JOB_OFFERS_QUERY_KEY, (old = []) =>
      old.map((o) => {
        const raw = o as unknown as Record<string, unknown>;
        return (o.id === offerId || raw.offer_id === offerId || o.id === job.id || raw.job_id === job.id)
          ? { ...o, status: targetStatus }
          : o;
      })
    );

    try {
      await jobsService.respondToOffer(offerId, action);
      toast.success(action === 'accept' ? 'Offer accepted!' : 'Offer declined.');

      // Invalidate queries to sync with backend
      queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (error) {
      console.error('Failed to respond to offer:', error);
      toast.error('Failed to respond to offer.');
      fetchJob();
      queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEY });
    }
  }, [job, jobId, setOfferResponse, queryClient, fetchJob]);

  const toggleFollow = useCallback(async () => {
    if (!job || isFollowLoading) return;

    const targetEntityId = job.org_id || job.recruiter_id;
    if (!targetEntityId) {
      toast.error("Company or recruiter information is unavailable.");
      return;
    }

    const currentlyFollowed = Boolean(job.is_followed);
    const entityType: 'org' | 'user' = job.org_id ? 'org' : 'user';

    setIsFollowLoading(true);
    try {
      await jobsService.toggleFollowEntity(targetEntityId, entityType, currentlyFollowed);

      const nextFollowedState = !currentlyFollowed;

      // 1. Immediately update local job state
      setRawJob((prev) => (prev ? { ...prev, is_followed: nextFollowedState } : null));

      // 2. Sync with global store
      const companyKey = job.company;
      if (companyKey) {
        const inStore = followedCompanies.has(companyKey);
        if (nextFollowedState && !inStore) {
          toggleFollowCompany(companyKey);
        } else if (!nextFollowedState && inStore) {
          toggleFollowCompany(companyKey);
        }
      }

      toast.success(nextFollowedState ? `Following ${job.company || 'company'}` : `Unfollowed ${job.company || 'company'}`);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      toast.error('Failed to update follow status.');
    } finally {
      setIsFollowLoading(false);
    }
  }, [job, isFollowLoading, followedCompanies, toggleFollowCompany]);

  return {
    job,
    isLoading,
    isFollowLoading,
    toggleSave,
    applyToJob,
    withdrawJob,
    respondToOffer,
    toggleFollow,
    refetch: () => fetchJob()
  };
};
