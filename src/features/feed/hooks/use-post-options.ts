import { useState } from 'react';
import { toast } from 'sonner';
import { feedApi } from '../api/feed.api';
import { FeedPostProps } from '../types';
import { useFeed } from '@/hooks/use-feed';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useUIStore } from '@/store/ui.store';

export const usePostOptions = (props: FeedPostProps, updatePostInFeed: (id: any, data: any) => void, menuKeyOverride?: string) => {
  const { id, visibility: initialVisibility = 'public', onDelete, onToggleVisibility, isCompanyPost, authorId } = props;
  // Pass false to avoid mounting redundant active infinite query observers on every post
  const { deletePost } = useFeed(false);
  // const { deletePost } = useFeed();
  const { activeProfile, isCompany } = useActiveProfile();

  const menuKey = menuKeyOverride || (id ? `post-${id}` : 'post-options');
  const showOptions = useUIStore((state) => state.activeOpenMenuId === menuKey);
  const setShowOptions = (open: boolean | ((prev: boolean) => boolean)) => {
    const currentOpen = useUIStore.getState().activeOpenMenuId === menuKey;
    const nextOpen = typeof open === 'function' ? open(currentOpen) : open;
    if (nextOpen) {
      document.dispatchEvent(new CustomEvent('closeAllPostMenus'));
    }
    useUIStore.getState().setActiveOpenMenuId(nextOpen ? menuKey : null);
  };
  const [optionsPos, setOptionsPos] = useState<{ top: number; right: number } | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleToggleVisibility = async () => {
    const newVisibility = initialVisibility === 'public' ? 'private' : 'public';

    // Optimistic update
    updatePostInFeed(id, { visibility: newVisibility });
    if (onToggleVisibility) onToggleVisibility(id.toString());

    try {
      const companyId = isCompany && isCompanyPost && activeProfile?.id
        ? activeProfile.id.toString()
        : undefined;
      await feedApi.updatePost(id.toString(), { visibility: newVisibility, companyId });
      toast.info(`Post is now ${newVisibility}`);
    } catch (e) {
      console.error("Failed to toggle visibility", e);
      toast.error("Failed to update visibility");
      // Revert
      updatePostInFeed(id, { visibility: initialVisibility });
    }
    setShowOptions(false);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
    setShowOptions(false);
  };

  const confirmDelete = async () => {
    // Pass companyId when the post belongs to a company the user manages
    const companyId = isCompany && isCompanyPost && activeProfile?.id
      ? activeProfile.id.toString()
      : undefined;
    // Always call the API to actually delete the post
    await deletePost(id.toString(), companyId);
    // Also invoke the parent callback if provided (e.g. for profile-page list updates)
    // Avoid double-calling if parent passed deletePost itself
    if (onDelete && onDelete !== deletePost) {
      onDelete(id.toString());
    }
    setIsDeleteDialogOpen(false);
  };

  return {
    showOptions,
    setShowOptions,
    optionsPos,
    setOptionsPos,
    isReportModalOpen,
    setIsReportModalOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleToggleVisibility,
    handleDelete,
    confirmDelete
  };
};
