import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Step = 'verification' | 'role-input' | 'details' | 'preview';

/**
 * Syncs the Create Job wizard's step and title state to URL search parameters.
 * - Step changes are pushed immediately.
 * - Title changes are debounced (400ms) to avoid flooding the URL during typing.
 */
export function useCreateJobUrlSync(step: Step, title: string, jobId: string | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const titleSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!searchParams) return;
    
    // GUARD: Do not attempt to sync child parameters until the parent's route transition 
    // to 'create-job' is fully resolved by Next.js. This prevents race conditions where 
    // the child overwrites the parent's pending URL update.
    if (searchParams.get('view') !== 'create-job') return;
    
    // Create a new URLSearchParams instance from the current searchParams
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    // Sync step and jobId immediately, and eagerly sync title at the same time to prevent drops during navigation
    if (step && params.get('step') !== step) {
      params.set('step', step);
      changed = true;
    }
    
    if (jobId && params.get('jobId') !== jobId) {
      params.set('jobId', jobId);
      changed = true;
    } else if (!jobId && params.has('jobId')) {
      params.delete('jobId');
      changed = true;
    }

    if (changed) {
      // Eagerly sync title during a step/jobId transition
      if (!jobId && title && params.get('title') !== title) {
        params.set('title', title);
      } else if ((jobId || !title) && params.has('title')) {
        params.delete('title');
      }
      router.replace(`/jobs?${params.toString()}`);
    }

    // Sync title with debounce to avoid excessive URL pushes while typing (when step is NOT changing)
    if (titleSyncRef.current) clearTimeout(titleSyncRef.current);
    titleSyncRef.current = setTimeout(() => {
      // Re-read from the latest params to ensure we don't overwrite other recent changes
      const currentUrl = new URL(window.location.href);
      const p = new URLSearchParams(currentUrl.search);
      
      let titleChanged = false;
      if (!jobId && title && p.get('title') !== title) {
        p.set('title', title);
        titleChanged = true;
      } else if ((jobId || !title) && p.has('title')) {
        p.delete('title');
        titleChanged = true;
      }
      
      if (titleChanged) {
        router.replace(`/jobs?${p.toString()}`);
      }
    }, 400);

    return () => {
      if (titleSyncRef.current) clearTimeout(titleSyncRef.current);
    };
  }, [step, title, jobId, router, searchParams]);
}
