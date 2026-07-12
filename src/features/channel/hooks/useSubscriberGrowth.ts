import { useQuery } from '@tanstack/react-query';
import * as channelService from '../services/channel.service';

export const useSubscriberGrowth = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['channel', 'growth'],
    queryFn: () => channelService.getSubscriberGrowth(),
    staleTime: 1000 * 60 * 5,
  });

  return {
    growth: data ?? [],
    isLoading,
  };
};
