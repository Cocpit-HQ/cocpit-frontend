import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as channelService from '../services/channel.service';

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => channelService.deleteArticle(id),
    onSuccess: () => {
      toast.success('Article deleted.');
      queryClient.invalidateQueries({ queryKey: ['channel', 'articles'] });
    },
    onError: () => {
      toast.error('Failed to delete article.');
    },
  });
};
