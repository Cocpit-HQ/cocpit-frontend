import { useState, useEffect, useCallback } from 'react';
import { Job } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';

export const useJobDetail = (jobId: string) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    setIsLoading(true);
    try {
      const res = await jobsService.getJobById(jobId);
      if (res) {
        // Sync in-memory state — OR with API values so we never downgrade
        // (in-memory lists are only populated for the current session;
        //  API-returned hasApplied / isSaved are the source of truth on load)
        const savedIds = jobsService.getSavedJobIds();
        const appliedIds = jobsService.getAppliedJobIds();
        const respondedOffers = jobsService.getRespondedOffers();
        const followedCompanies = jobsService.getFollowedCompanies();

        // Keep API value as baseline; in-memory can only upgrade, never downgrade
        res.is_saved = res.is_saved || savedIds.includes(res.id);
        res.is_applied = res.is_applied || appliedIds.includes(res.id);

        // Seed in-memory applied list so session stays consistent
        if (res.is_applied && !appliedIds.includes(res.id)) {
          jobsService.seedAppliedId(res.id);
        }

        // Handle offer statuses
        if (res.is_offer) {
          const offerResponse = respondedOffers[res.id];
          if (offerResponse) {
            res.application_status = offerResponse === 'accept' ? 'Accepted' : 'Declined';
          }
        }

        // Handle followed status for company
        res.is_followed = res.is_followed || followedCompanies.includes(res.company);
      }
      setJob(res);
    } catch (err) {
      console.error('Failed to load job details:', err);
      toast.error('Failed to load job details.');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [jobId, fetchJob]);

  const toggleSave = useCallback(async () => {
    if (!job) return;
    try {
      await jobsService.saveJob(job.id);
      const savedIds = jobsService.getSavedJobIds();
      const isSaved = savedIds.includes(job.id);

      setJob(prev => prev ? { ...prev, is_saved: isSaved } : null);
      toast.success(isSaved ? 'Job saved successfully' : 'Job removed from saved list');
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error('Failed to update save status.');
    }
  }, [job]);

  const applyToJob = useCallback(async (resumeUrlOrName?: string, uploadedFile?: File | null, resumeId?: string | null, coverLetter?: string) => {
    if (!job) return;
    try {
      const appliedIds = jobsService.getAppliedJobIds();
      if (appliedIds.includes(job.id)) {
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

      setJob(prev => prev ? { ...prev, is_applied: true } : null);
      toast.success('Successfully applied to the job!');
    } catch (error) {
      console.error('Failed to apply to job:', error);
      toast.error('Failed to submit application.');
    }
  }, [job]);

  const withdrawJob = useCallback(async () => {
    if (!job) return;
    try {
      await jobsService.withdrawApplication(job.id);

      setJob(prev => prev ? { ...prev, is_applied: false } : null);
      toast.success('Application withdrawn successfully.');
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      toast.error('Failed to withdraw application.');
    }
  }, [job]);

  const respondToOffer = useCallback(async (action: 'accept' | 'decline') => {
    if (!job) return;
    try {
      await jobsService.respondToOffer(job.offer_id || job.id, action);

      setJob(prev => prev ? { 
        ...prev, 
        application_status: action === 'accept' ? 'Accepted' : 'Declined' 
      } : null);
      
      toast.success(action === 'accept' ? 'Offer accepted!' : 'Offer declined.');
    } catch (error) {
      console.error('Failed to respond to offer:', error);
      toast.error('Failed to respond to offer.');
    }
  }, [job]);

  const toggleFollow = useCallback(async () => {
    if (!job) return;
    try {
      const followedCompanies = jobsService.getFollowedCompanies();
      let isFollowed = false;
      let newFollowed: string[] = [];

      if (followedCompanies.includes(job.company)) {
        newFollowed = followedCompanies.filter((name: string) => name !== job.company);
        isFollowed = false;
      } else {
        newFollowed = [...followedCompanies, job.company];
        isFollowed = true;
      }

      jobsService.setFollowedCompanies(newFollowed);

      setJob(prev => prev ? { ...prev, is_followed: isFollowed } : null);
      toast.success(isFollowed ? `Following ${job.company}` : `Unfollowed ${job.company}`);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      toast.error('Failed to update follow status.');
    }
  }, [job]);

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
