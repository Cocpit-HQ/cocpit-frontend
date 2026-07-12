import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as channelService from '../services/channel.service';

export const useChannelThoughts = (articleId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['channel', 'thoughts', articleId],
    queryFn: () => channelService.getThoughts(articleId as string),
    enabled: !!articleId,
  });

  const addThought = useMutation({
    mutationFn: ({ text, authorName, authorAvatarUrl }: { text: string; authorName: string; authorAvatarUrl: string }) =>
      channelService.addThought(articleId as string, text, authorName, authorAvatarUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', 'thoughts', articleId] });
    },
  });

  const deleteThought = useMutation({
    mutationFn: (id: string) => channelService.deleteThought(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', 'thoughts', articleId] });
    },
  });

  return {
    thoughts: data ?? [],
    isLoading,
    addThought,
    deleteThought,
  };
};
