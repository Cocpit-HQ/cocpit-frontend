import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as channelService from '../../services/channel.service';
import { toast } from 'sonner';

export function usePublicChannelThoughts(articleId: string | undefined, isSubscribed: boolean) {
  const queryClient = useQueryClient();

  const { data: thoughts = [], isLoading, error } = useQuery({
    queryKey: ['channel-public-thoughts', articleId],
    queryFn: () => (articleId ? channelService.getThoughts(articleId) : Promise.resolve([])),
    enabled: !!articleId && isSubscribed,
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: ({ text, authorName, authorAvatarUrl, parentId }: { text: string; authorName: string; authorAvatarUrl: string; parentId?: string }) =>
      channelService.addThought(articleId as string, text, authorName, authorAvatarUrl, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-public-thoughts', articleId] });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || "Failed to post thought";
      toast.error(errMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => channelService.deleteThought(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-public-thoughts', articleId] });
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message || err.message || "Failed to delete thought";
      toast.error(errMsg);
    },
  });

  const addThought = (text: string, authorName: string, authorAvatarUrl: string, parentId?: string) => {
    if (!articleId) return;
    addMutation.mutate({ text, authorName, authorAvatarUrl, parentId });
  };

  const deleteThought = (id: string) => {
    deleteMutation.mutate(id);
  };

  return {
    thoughts: isSubscribed ? thoughts : [],
    isLoading: isSubscribed ? (isLoading || addMutation.isPending || deleteMutation.isPending) : false,
    error,
    addThought,
    deleteThought,
  };
}

