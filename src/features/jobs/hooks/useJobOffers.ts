import { useMemo } from 'react';
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
  const respondedOffers = useJobStore((state) => state.respondedOffers);

  // ─── 1. QUERY ───────────────────────────────────────────────────────────────
  const { data: rawOffers = [], isLoading, isError } = useQuery<JobOffer[]>({
    queryKey: JOB_OFFERS_QUERY_KEY,
    queryFn: async () => {
      const res = await jobsService.getJobOffers();
      if (res?.success) return res.data as JobOffer[];
      throw new Error('Failed to load offers');
    },
    enabled: !isCompanyMode,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  const offers = useMemo(() => {
    return rawOffers.map((o) => {
      const raw = o as unknown as Record<string, unknown>;
      const resp = respondedOffers ? (respondedOffers[o.id] || (raw.offer_id ? respondedOffers[String(raw.offer_id)] : undefined) || (raw.job_id ? respondedOffers[String(raw.job_id)] : undefined)) : undefined;
      if (resp) {
        const norm = resp.toLowerCase();
        const nextStatus = (norm === 'accept' || norm === 'accepted') ? ('accepted' as const) : ('declined' as const);
        return { ...o, status: nextStatus };
      }
      return o;
    });
  }, [rawOffers, respondedOffers]);

  // ─── 2. ACCEPT MUTATION ──────────────────────────────────────────────────────
  const acceptMutation = useMutation({
    mutationFn: (id: string) => jobsService.acceptJobOffer(id),
    onMutate: async (id: string) => {
      // Optimistically record response in Zustand store for instant runtime update across all tabs
      useJobStore.getState().setOfferResponse(id, 'accept');

      // Cancel in-flight refetches
      await queryClient.cancelQueries({ queryKey: JOB_OFFERS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: ['jobs'] });

      // Snapshot previous value for rollback
      const previousOffers = queryClient.getQueryData<JobOffer[]>(JOB_OFFERS_QUERY_KEY);

      // Optimistically update cache
      queryClient.setQueryData<JobOffer[]>(JOB_OFFERS_QUERY_KEY, (old = []) =>
        old.map(o => (o.id === id || (o as any).offer_id === id) ? { ...o, status: 'accepted' as const } : o)
      );
      return { previousOffers, id };
    },
    onError: (_err, _id, context) => {
      if (context?.previousOffers) {
        queryClient.setQueryData(JOB_OFFERS_QUERY_KEY, context.previousOffers);
      }
      toast.error('Failed to accept offer.');
    },
    onSuccess: () => {
      toast.success('Offer accepted!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // ─── 3. DECLINE MUTATION ─────────────────────────────────────────────────────
  const declineMutation = useMutation({
    mutationFn: (id: string) => jobsService.declineJobOffer(id),
    onMutate: async (id: string) => {
      useJobStore.getState().setOfferResponse(id, 'decline');

      await queryClient.cancelQueries({ queryKey: JOB_OFFERS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: ['jobs'] });

      const previousOffers = queryClient.getQueryData<JobOffer[]>(JOB_OFFERS_QUERY_KEY);
      queryClient.setQueryData<JobOffer[]>(JOB_OFFERS_QUERY_KEY, (old = []) =>
        old.map(o => (o.id === id || (o as any).offer_id === id) ? { ...o, status: 'declined' as const } : o)
      );
      return { previousOffers, id };
    },
    onError: (_err, _id, context) => {
      if (context?.previousOffers) {
        queryClient.setQueryData(JOB_OFFERS_QUERY_KEY, context.previousOffers);
      }
      toast.error('Failed to decline offer.');
    },
    onSuccess: () => {
      toast.success('Offer declined.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  return {
    offers,
    isLoading,
    isError,
    handleAccept: (id: string) => acceptMutation.mutate(id),
    handleDecline: (id: string) => declineMutation.mutate(id),
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: JOB_OFFERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  };
};
