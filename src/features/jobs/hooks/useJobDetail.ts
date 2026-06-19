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
        // Sync local storage states
        const savedIds = JSON.parse(localStorage.getItem('saved_job_ids') || '[]');
        const appliedIds = JSON.parse(localStorage.getItem('applied_job_ids') || '[]');
        res.is_saved = savedIds.includes(res.id);
        res.is_applied = appliedIds.includes(res.id);
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
      const savedIds = JSON.parse(localStorage.getItem('saved_job_ids') || '[]');
      let isSaved = false;
      let newSavedIds: string[] = [];

      if (savedIds.includes(job.id)) {
        newSavedIds = savedIds.filter((id: string) => id !== job.id);
        isSaved = false;
      } else {
        newSavedIds = [...savedIds, job.id];
        isSaved = true;
      }

      localStorage.setItem('saved_job_ids', JSON.stringify(newSavedIds));
      await jobsService.saveJob(job.id);

      setJob(prev => prev ? { ...prev, is_saved: isSaved } : null);
      toast.success(isSaved ? 'Job saved successfully' : 'Job removed from saved list');
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error('Failed to update save status.');
    }
  }, [job]);

  const applyToJob = useCallback(async () => {
    if (!job) return;
    try {
      const appliedIds = JSON.parse(localStorage.getItem('applied_job_ids') || '[]');
      if (appliedIds.includes(job.id)) {
        toast.info('You have already applied to this job.');
        return;
      }

      const newAppliedIds = [...appliedIds, job.id];
      localStorage.setItem('applied_job_ids', JSON.stringify(newAppliedIds));
      await jobsService.applyJob(job.id);

      setJob(prev => prev ? { ...prev, is_applied: true } : null);
      toast.success('Successfully applied to the job!');
    } catch (error) {
      console.error('Failed to apply to job:', error);
      toast.error('Failed to submit application.');
    }
  }, [job]);

  return {
    job,
    isLoading,
    toggleSave,
    applyToJob,
    refetch: fetchJob
  };
};
