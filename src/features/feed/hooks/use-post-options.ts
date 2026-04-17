import { useState } from 'react';
import { toast } from 'sonner';
import { feedApi } from '../api/feed.api';
import { FeedPostProps } from '../types';

export const usePostOptions = (props: FeedPostProps, updatePostInFeed: (id: any, data: any) => void) => {
  const { id, visibility: initialVisibility = 'public', onDelete, onToggleVisibility } = props;
  
  const [showOptions, setShowOptions] = useState(false);
  const [optionsPos, setOptionsPos] = useState<{ top: number; right: number } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleToggleVisibility = async () => {
    const newVisibility = initialVisibility === 'public' ? 'private' : 'public';

    // Optimistic update
    updatePostInFeed(id, { visibility: newVisibility });
    if (onToggleVisibility) onToggleVisibility(id.toString());

    try {
      await feedApi.updatePost(id.toString(), { visibility: newVisibility });
      toast.info(`Post is now ${newVisibility}`);
    } catch (e) {
      console.error("Failed to toggle visibility", e);
      toast.error("Failed to update visibility");
      // Revert
      updatePostInFeed(id, { visibility: initialVisibility });
    }
    setShowOptions(false);
  };

  const handleDelete = async () => {
    if (onDelete) onDelete(id.toString());
    setShowOptions(false);
  };

  return {
    showOptions,
    setShowOptions,
    optionsPos,
    setOptionsPos,
    isEditModalOpen,
    setIsEditModalOpen,
    isReportModalOpen,
    setIsReportModalOpen,
    handleToggleVisibility,
    handleDelete
  };
};
