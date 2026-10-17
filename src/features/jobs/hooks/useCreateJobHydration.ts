import { useEffect, useRef, useState } from 'react';
import { JobListing } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { useJobStore } from '@/store/job.store';

interface UseCreateJobHydrationOptions {
  /** If an initialListing is provided (editing mode), hydration is skipped */
  initialListing?: JobListing | null;
}

/**
 * Hydrates the Create Job wizard store from the API when the page is refreshed.
 *
 * Detects the refresh scenario: jobId exists in URL, step is 'details' or 'preview',
 * but the Zustand store's accumulatedDetails is empty. Fetches the saved draft from the
 * database and populates the store so all form fields are restored.
 *
 * @returns `isHydrating` — true while the API call is in flight
 */
export function useCreateJobHydration({ initialListing }: UseCreateJobHydrationOptions) {
  const [isHydrating, setIsHydrating] = useState(() => {
    if (initialListing) return false;
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const urlJobId = params.get('jobId');
    const urlStep = params.get('step');
    if (!urlJobId || !['details', 'preview'].includes(urlStep || '')) return false;
    
    // Check if store already has data (meaning we just navigated forward, not a fresh reload)
    const storeState = useJobStore.getState();
    if (storeState.createJobDetails && Object.keys(storeState.createJobDetails).length > 0) return false;

    // We have a jobId and are on details/preview, AND store is empty — hydration IS needed
    return true;
  });
  const hasHydrated = useRef(false);

  const {
    createJobTitle: title,
    setCreateJobTitle: setTitle,
    createJobId: jobId,
    setCreateJobId: setJobId,
    createJobDetails: accumulatedDetails,
    setCreateJobDetails: setAccumulatedDetails,
  } = useJobStore();

  useEffect(() => {
    if (hasHydrated.current || initialListing) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlJobId = params.get('jobId');
    const urlStep = params.get('step');

    // Only hydrate on details/preview steps when we have a jobId but no accumulated data
    if (!urlJobId || !['details', 'preview'].includes(urlStep || '')) {
      setIsHydrating(false);
      return;
    }
    
    if (accumulatedDetails && Object.keys(accumulatedDetails).length > 0) {
      setIsHydrating(false);
      return;
    }

    hasHydrated.current = true;
    setIsHydrating(true);

    jobsService.getJobDetail(urlJobId)
      .then((jobData: any) => {
        if (jobData) {
          // Populate title
          if (jobData.title && !title) {
            setTitle(jobData.title);
          }
          // Build accumulated details from raw API response
          const restored: Partial<JobListing> = {
            id: urlJobId,
            title: jobData.title || '',
            company: jobData.company_name || '',
            location: jobData.location || '',
            description: jobData.description || '',
            experience: jobData.experience_level || '',
            experience_min: jobData.experience_min,
            experience_max: jobData.experience_max,
            work_type: jobData.job_type || 'Full time',
            work_mode: jobData.work_mode || 'Hybrid',
            salary_min: jobData.salary_min,
            salary_max: jobData.salary_max,
            salary_currency: jobData.salary_currency || 'USD',
          };
          setAccumulatedDetails(restored);
          setJobId(urlJobId);
        }
      })
      .catch((err: any) => {
        console.error('Failed to hydrate job draft from API:', err);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, [initialListing, title, accumulatedDetails, jobId, setTitle, setJobId, setAccumulatedDetails]);

  return { isHydrating };
}
