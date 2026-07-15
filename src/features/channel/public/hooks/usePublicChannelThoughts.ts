import { useState } from 'react';
import { DUMMY_CHANNEL_THOUGHTS } from '../data/dummy-public-channel-data';
import { ChannelThought } from '../../types/channel.types';

export function usePublicChannelThoughts(articleId: string | undefined) {
  const [thoughts, setThoughts] = useState<ChannelThought[]>(
    articleId ? DUMMY_CHANNEL_THOUGHTS[articleId] ?? [] : []
  );

  const addThought = (text: string, authorName: string, authorAvatarUrl: string) => {
    if (!articleId) return;
    const thought: ChannelThought = {
      id: `thought-${Date.now()}`,
      articleId,
      authorName,
      authorAvatarUrl,
      text,
      createdAt: new Date().toISOString(),
    };
    setThoughts((prev) => [thought, ...prev]);
  };

  const deleteThought = (id: string) => {
    setThoughts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    thoughts,
    isLoading: false,
    addThought,
    deleteThought,
  };
}
