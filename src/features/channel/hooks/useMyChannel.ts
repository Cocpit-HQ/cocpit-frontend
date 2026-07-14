import { useQuery } from '@tanstack/react-query';
import * as channelService from '../services/channel.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useMyChannel = () => {
  const { activeProfile } = useActiveProfile();
  const orgId = activeProfile?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['channel', 'me', orgId],
    queryFn: () => channelService.getMyChannel(orgId!),
    staleTime: 1000 * 60 * 3,
    enabled: !!orgId,
  });

  return {
    channel: data ?? null,
    isLoading,
    refetch,
  };
};
