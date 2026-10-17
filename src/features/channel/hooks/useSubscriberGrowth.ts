import { useQuery } from '@tanstack/react-query';
import * as channelService from '../services/channel.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useSubscriberGrowth = () => {
  const { activeProfile } = useActiveProfile();
  const orgId = activeProfile?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['channel', 'growth', orgId],
    queryFn: () => channelService.getSubscriberGrowth(orgId!),
    staleTime: 1000 * 60 * 5,
    enabled: !!orgId,
  });

  return {
    growth: data ?? [],
    isLoading,
  };
};
