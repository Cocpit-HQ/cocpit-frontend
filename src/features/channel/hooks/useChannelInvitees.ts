import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as channelService from '../services/channel.service';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export const useChannelInvitees = (search: string) => {
  const { activeProfile } = useActiveProfile();
  const orgId = activeProfile?.id;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['channel', 'invitees', orgId, search],
    queryFn: ({ pageParam = 1 }) => channelService.getInvitees(orgId!, search, pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      // Limit is 50, so if less than 50 items are returned, there are no more pages
      return lastPage.length === 50 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!orgId,
  });

  const invitees = data?.pages.flat() ?? [];

  return {
    invitees,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  };
};

export const useInviteSubscribers = () => {
  const { activeProfile } = useActiveProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userIds: string[]) => {
      const orgId = activeProfile?.id;
      if (!orgId) throw new Error("No active organization");
      return channelService.inviteUsers(orgId, userIds);
    },
    onSuccess: (_data, userIds) => {
      const orgId = activeProfile?.id;
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: ['channel', 'invitees', orgId] });
      }
      toast.success(`Invited ${userIds.length} ${userIds.length === 1 ? 'person' : 'people'}.`);
    },
    onError: (error: any) => {
      const errMsg = error?.response?.data?.message || 'Failed to send invites.';
      toast.error(errMsg);
    },
  });
};
