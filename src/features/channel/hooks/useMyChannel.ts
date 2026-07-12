import { useQuery } from '@tanstack/react-query';
import * as channelService from '../services/channel.service';

export const useMyChannel = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['channel', 'me'],
    queryFn: () => channelService.getMyChannel(),
    staleTime: 1000 * 60 * 3,
  });

  return {
    channel: data ?? null,
    isLoading,
    refetch,
  };
};
