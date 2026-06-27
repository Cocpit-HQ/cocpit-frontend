import { useState, useEffect, useCallback } from 'react';
import { Job } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useJobStore } from '@/store/job.store';

export const useJobDetail = (jobId: string) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!jobId) return;
    setIsLoading(true);
    try {
      const res = await jobsService.getJobById(jobId);
      if (res) {
        // Keep API value as baseline; in-memory/Zustand store can only upgrade
        res.is_saved = res.is_saved || savedJobIds.has(res.id);
        res.is_applied = res.is_applied || appliedJobIds.has(res.id);

        // Seed store if API says applied but store doesn't have it
        if (res.is_applied && !appliedJobIds.has(res.id)) {
          addAppliedId(res.id);
        }
        
        // Seed store if API says saved but store doesn't have it
        if (res.is_saved && !savedJobIds.has(res.id)) {
          addSavedId(res.id);
        }

        // Handle offer statuses
        if (res.is_offer) {
          if (res.offerStatus) {
            res.application_status = res.offerStatus.charAt(0).toUpperCase() + res.offerStatus.slice(1);
          }
          const offerResponse = respondedOffers[res.id];
          if (offerResponse) {
            res.application_status = offerResponse === 'accept' ? 'Accepted' : 'Declined';
          }
        }

        // Handle followed status for company
        res.is_followed = res.is_followed || followedCompanies.has(res.company);
        if (res.is_followed && !followedCompanies.has(res.company)) {
          toggleFollowCompany(res.company);
        }
      }
      setJob(res);
    } catch (err) {
      console.error('Failed to load job details:', err);
      toast.error('Failed to load job details.');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, savedJobIds, appliedJobIds, respondedOffers, followedCompanies, addAppliedId, addSavedId, toggleFollowCompany]);

  useEffect(() => {
    fetchJob();
  }, [jobId, fetchJob]);

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
      const updatedSaved = !isCurrentlySaved;

      setJob(prev => prev ? { ...prev, is_saved: updatedSaved } : null);
      toast.success(updatedSaved ? 'Job saved successfully' : 'Job removed from saved list');
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
        else if (resumeId) formData.append('resume_url', resumeId);
        if (coverLetter) formData.append('cover_note', coverLetter);
      } else if (resumeUrlOrName || resumeId) {
        jsonBody = {
          resume_url: resumeUrlOrName || resumeId,
          cover_note: coverLetter
        };
      }

      await jobsService.applyJob(job.id, formData, jsonBody);
      addAppliedId(job.id);

      setJob(prev => prev ? { ...prev, is_applied: true } : null);
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

      setJob(prev => prev ? { ...prev, is_applied: false } : null);
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

      setJob(prev => prev ? { 
        ...prev, 
        application_status: action === 'accept' ? 'Accepted' : 'Declined' 
      } : null);
      
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
      const nextFollowStatus = !isCurrentlyFollowed;

      if (job.org_id) {
        await jobsService.toggleFollowEntity(job.org_id, 'org', isCurrentlyFollowed);
      } else if (job.recruiter_id) {
        await jobsService.toggleFollowEntity(job.recruiter_id, 'user', isCurrentlyFollowed);
      } else {
        throw new Error("No organization or recruiter ID to follow.");
      }

      toggleFollowCompany(job.company);

      setJob(prev => prev ? { ...prev, is_followed: nextFollowStatus } : null);
      toast.success(nextFollowStatus ? `Following ${job.company}` : `Unfollowed ${job.company}`);
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
    refetch: fetchJob
  };
};
