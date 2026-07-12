import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as channelService from '../services/channel.service';
import { ArticleInput } from '../services/channel.service';

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: ArticleInput }) =>
      channelService.createArticle(channelId, input),
    onSuccess: (article) => {
      toast.success(article.status === 'published' ? 'Article published!' : 'Draft saved.');
      queryClient.invalidateQueries({ queryKey: ['channel', 'articles'] });
    },
    onError: () => {
      toast.error('Failed to save article.');
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ArticleInput> }) =>
      channelService.updateArticle(id, input),
    onSuccess: (article) => {
      toast.success(article.status === 'published' ? 'Article published!' : 'Draft saved.');
      queryClient.invalidateQueries({ queryKey: ['channel', 'articles'] });
      queryClient.invalidateQueries({ queryKey: ['channel', 'article', article.id] });
    },
    onError: () => {
      toast.error('Failed to save article.');
    },
  });
};
