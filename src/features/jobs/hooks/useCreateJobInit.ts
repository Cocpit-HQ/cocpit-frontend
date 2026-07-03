import { useEffect } from 'react';
import { JobListing } from '../types/jobs.types';
import { useJobStore } from '@/store/job.store';

type Step = 'verification' | 'role-input' | 'details' | 'preview';

interface UseCreateJobInitOptions {
  initialListing?: JobListing | null;
  isCompanyVerified: boolean;
}

/**
 * Initializes the Create Job wizard state on mount.
 *
 * Reads the URL search parameters (`step`, `jobId`, `title`) to restore the wizard
 * to the correct state after a page refresh. When editing an existing listing
 * (`initialListing`), it pre-populates the store with the listing data instead.
 */
export function useCreateJobInit({ initialListing, isCompanyVerified }: UseCreateJobInitOptions) {
  const {
    createJobTitle: title,
    setCreateJobStep: setStep,
    setCreateJobTitle: setTitle,
    createJobId: jobId,
    setCreateJobId: setJobId,
    setCreateJobDetails: setAccumulatedDetails,
  } = useJobStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlStep = params.get('step') as Step | null;
    const urlJobId = params.get('jobId');

    if (initialListing) {
      setStep('details');
      setJobId(initialListing.id);
      setTitle(initialListing.title || '');
      setAccumulatedDetails(initialListing);
    } else {
      // If there is no step and no jobId in the URL, this is a fresh click on "Create Job"
      // (not a page refresh). We must clear the old persisted session state so they start clean.
      if (!urlStep && !urlJobId) {
        useJobStore.getState().resetCreateJobFlow();
      }

      let resolvedStep: Step = 'verification';
      if (urlStep && ['verification', 'role-input', 'details', 'preview'].includes(urlStep)) {
        resolvedStep = urlStep;
      } else if (isCompanyVerified) {
        resolvedStep = 'role-input';
      }

      // If the company is verified, prevent landing on or going back to verification
      if (isCompanyVerified && resolvedStep === 'verification') {
        resolvedStep = 'role-input';
      }

      setStep(resolvedStep);

      // Restore title from URL if present (survives refresh)
      const urlTitle = params.get('title');
      if (urlTitle) {
        setTitle(urlTitle);
      }

      if (urlJobId && urlJobId !== jobId) {
        setJobId(urlJobId);
      }
    }
  }, [initialListing, isCompanyVerified]);
}
