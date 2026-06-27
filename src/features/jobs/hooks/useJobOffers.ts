import { useState, useEffect, useCallback } from 'react';
import { JobOffer } from '../types/jobs.types';
import * as jobsService from '../services/jobs.service';
import { toast } from 'sonner';
import { useJobStore } from '@/store/job.store';

export const useJobOffers = () => {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await jobsService.getJobOffers();
      if (res && res.success) {
        setOffers(res.data);
      } else {
        toast.error('Failed to load job offers.');
      }
    } catch (err) {
      console.error('Failed to fetch job offers:', err);
      toast.error('Failed to load job offers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleAccept = useCallback(async (id: string) => {
    try {
      const res = await jobsService.acceptJobOffer(id);
      if (res && res.success) {
        useJobStore.getState().setOfferResponse(id, 'accept');
        setOffers(prev =>
          prev.map(o => (o.id === id ? { ...o, status: 'accepted' as const } : o))
        );
        toast.success('Offer accepted successfully!');
      } else {
        toast.error('Failed to accept offer.');
      }
    } catch (err) {
      console.error('Error accepting job offer:', err);
      toast.error('Failed to accept offer.');
    }
  }, []);

  const handleDecline = useCallback(async (id: string) => {
    try {
      const res = await jobsService.declineJobOffer(id);
      if (res && res.success) {
        useJobStore.getState().setOfferResponse(id, 'decline');
        setOffers(prev =>
          prev.map(o => (o.id === id ? { ...o, status: 'declined' as const } : o))
        );
        toast.success('Offer declined.');
      } else {
        toast.error('Failed to decline offer.');
      }
    } catch (err) {
      console.error('Error declining job offer:', err);
      toast.error('Failed to decline offer.');
    }
  }, []);

  return {
    offers,
    isLoading,
    handleAccept,
    handleDecline,
    refetch: fetchOffers
  };
};
