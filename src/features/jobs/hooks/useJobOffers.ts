import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JobOffer } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useJobStore } from '@/store/job.store';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const JOB_OFFERS_QUERY_KEY = ['jobOffers'] as const;

export const useJobOffers = () => {
  const queryClient = useQueryClient();
  const { activeProfile } = useActiveProfile();
  const isCompanyMode = activeProfile?.type === 'COMPANY';

  // ─── 1. QUERY ───────────────────────────────────────────────────────────────
  // Fetches & caches job offers. staleTime = 2 min means switching tabs and
  // returning will NOT fire a new API call — the cache is returned instantly.
  const { data: offers = [], isLoading } = useQuery<JobOffer[]>({
    queryKey: JOB_OFFERS_QUERY_KEY,
    queryFn: async () => {
      const res = await jobsService.getJobOffers();
      if (res?.success) return res.data as JobOffer[];
      throw new Error('Failed to load offers');
    },
    enabled: !isCompanyMode, // skip fetch entirely in company mode
    staleTime: 1000 * 60 * 2, // 2-minute cache window
  });

  // ─── 2. ACCEPT MUTATION ──────────────────────────────────────────────────────
  // Uses optimistic update: UI changes instantly, then syncs with server.
  // If server fails, the UI automatically rolls back to the previous state.
  const acceptMutation = useMutation({
    mutationFn: (id: string) => jobsService.acceptJobOffer(id),
    onMutate: async (id) => {
      // Cancel any in-flight refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: JOB_OFFERS_QUERY_KEY });
      // Snapshot previous value for rollback
      const previousOffers = queryClient.getQueryData<JobOffer[]>(JOB_OFFERS_QUERY_KEY);
      // Optimistically update cache
      queryClient.setQueryData<JobOffer[]>(JOB_OFFERS_QUERY_KEY, (old = []) =>
        old.map(o => o.id === id ? { ...o, status: 'accepted' as const } : o)
      );
      return { previousOffers }; // returned as context to onError
    },
    onError: (_err, _id, context) => {
      // Rollback to snapshot on failure
      if (context?.previousOffers) {
        queryClient.setQueryData(JOB_OFFERS_QUERY_KEY, context.previousOffers);
      }
      toast.error('Failed to accept offer.');
    },
    onSuccess: async (_res, id) => {
      useJobStore.getState().setOfferResponse(id, 'accept');
      toast.success('Offer accepted!');
    },
    // Always re-sync from server after mutation settles (success or error)
    onSettled: () => queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEY }),
  });

  // ─── 3. DECLINE MUTATION ─────────────────────────────────────────────────────
  const declineMutation = useMutation({
    mutationFn: (id: string) => jobsService.declineJobOffer(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: JOB_OFFERS_QUERY_KEY });
      const previousOffers = queryClient.getQueryData<JobOffer[]>(JOB_OFFERS_QUERY_KEY);
      queryClient.setQueryData<JobOffer[]>(JOB_OFFERS_QUERY_KEY, (old = []) =>
        old.map(o => o.id === id ? { ...o, status: 'declined' as const } : o)
      );
      return { previousOffers };
    },
    onError: (_err, _id, context) => {
      if (context?.previousOffers) {
        queryClient.setQueryData(JOB_OFFERS_QUERY_KEY, context.previousOffers);
      }
      toast.error('Failed to decline offer.');
    },
    onSuccess: (_res, id) => {
      useJobStore.getState().setOfferResponse(id, 'decline');
      toast.success('Offer declined.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEY }),
  });

  return {
    offers,
    isLoading,
    handleAccept: (id: string) => acceptMutation.mutate(id),
    handleDecline: (id: string) => declineMutation.mutate(id),
    refetch: () => queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEY }),
  };
};
