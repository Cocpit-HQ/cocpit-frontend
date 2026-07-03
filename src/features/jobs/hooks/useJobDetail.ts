import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Job } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useJobStore } from '@/store/job.store';

export const useJobDetail = (jobId: string) => {
  const [rawJob, setRawJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeJobIdRef = useRef<string | null>(null);

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
      const offerResponse = respondedOffers[processed.id];
      if (offerResponse) {
        processed.application_status = offerResponse === 'accept' ? 'Accepted' : 'Declined';
      }
    }

    // Handle followed status for company
    processed.is_followed = processed.is_followed || followedCompanies.has(processed.company);
    return processed;
  }, [rawJob, savedJobIds, appliedJobIds, respondedOffers, followedCompanies]);

  // Seed the store with initial values from the API
  useEffect(() => {
    if (!rawJob) return;

    // Seed store if API says applied but store doesn't have it
    if (rawJob.is_applied && !appliedJobIds.has(rawJob.id)) {
      addAppliedId(rawJob.id);
    }
    
    // Seed store if API says saved but store doesn't have it
    if (rawJob.is_saved && !savedJobIds.has(rawJob.id)) {
      addSavedId(rawJob.id);
    }

    // Seed store if API says followed but store doesn't have it
    if (rawJob.is_followed && !followedCompanies.has(rawJob.company)) {
      toggleFollowCompany(rawJob.company);
    }
  }, [rawJob, appliedJobIds, savedJobIds, followedCompanies, addAppliedId, addSavedId, toggleFollowCompany]);

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

      await jobsService.applyJob(job.id, formData, jsonBody);
      addAppliedId(job.id);
      toast.success('Successfully applied to the job!');
    } catch (error) {
      console.error('Failed to apply to job:', error);
      toast.error('Failed to submit application.');
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
    try {
      await jobsService.respondToOffer(job.offer_id || job.id, action);
      setOfferResponse(job.offer_id || job.id, action);
      toast.success(action === 'accept' ? 'Offer accepted!' : 'Offer declined.');
    } catch (error) {
      console.error('Failed to respond to offer:', error);
      toast.error('Failed to respond to offer.');
    }
  }, [job, setOfferResponse]);

  const toggleFollow = useCallback(async () => {
    if (!job) return;
    try {
      const isCurrentlyFollowed = followedCompanies.has(job.company);

      if (job.org_id) {
        await jobsService.toggleFollowEntity(job.org_id, 'org', isCurrentlyFollowed);
      } else if (job.recruiter_id) {
        await jobsService.toggleFollowEntity(job.recruiter_id, 'user', isCurrentlyFollowed);
      } else {
        throw new Error("No organization or recruiter ID to follow.");
      }

      toggleFollowCompany(job.company);
      toast.success(!isCurrentlyFollowed ? `Following ${job.company}` : `Unfollowed ${job.company}`);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      toast.error('Failed to update follow status.');
    }
  }, [job, followedCompanies, toggleFollowCompany]);

  return {
    job,
    isLoading,
    toggleSave,
    applyToJob,
    withdrawJob,
    respondToOffer,
    toggleFollow,
    refetch: () => fetchJob()
  };
};
