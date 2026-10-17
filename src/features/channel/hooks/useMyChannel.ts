import { useQuery } from '@tanstack/react-query';
import * as channelService from '../services/channel.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useMyChannel = () => {
  const { activeProfile } = useActiveProfile();
  const orgId = activeProfile?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['channel', 'me', orgId],
    queryFn: () => channelService.getMyChannel(orgId!),
    staleTime: 1000 * 60 * 3,
    enabled: !!orgId,
    retry: (failureCount, err: any) => {
      // Don't retry on 403
      if (err?.response?.status === 403) return false;
      return failureCount < 2;
    },
  });

  return {
    channel: data ?? null,
    isLoading,
    error,
    refetch,
  };
};
