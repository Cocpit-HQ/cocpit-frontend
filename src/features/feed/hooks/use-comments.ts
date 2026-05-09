// TODO: Migrate to React Query (useQuery) when comment caching/deduplication is needed.
// Current architecture: manual fetch lifecycle with optimistic updates.
import { useState, useEffect, useCallback } from 'react';
import { getComments, addComment, deleteComment, updateComment } from '@/services/api/posts';
import { Comment as CommentType } from '@/types/entities';
import { mapBackendCommentToFrontend } from '@/lib/mappers/feed.mapper';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { toast } from 'sonner';

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const { isCompany, activeProfile } = useActiveProfile();

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      setIsLoading(true);
      const data = await getComments(postId);
      setComments(data.map(mapBackendCommentToFrontend));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = useCallback(async (
    text: string, 
    parent_id?: string | number,
    onOptimisticAdd?: () => void,
    onFailure?: () => void
  ) => {
    // Guard: Resolve a valid actor ID before proceeding.
    // For company actors, use activeProfile.id; for personal, use session.user.id.
    // If neither is available, the user's auth state is not ready — abort cleanly.
    const actorId = isCompany ? activeProfile?.id : session?.user?.id;
    if (!actorId) {
      toast.error('Please sign in to comment');
      return false;
    }

    const tempId = `temp-${Date.now()}`;
    
    // 1️⃣ Construct Optimistic Comment
    const optimisticComment: CommentType = {
      id: tempId,
      text: text,
      parent_id: parent_id ? parent_id.toString() : undefined,
      created_at: new Date().toISOString(),
      timeAgo: 'Just now',
      authorId: actorId, // Always a real UUID — never 'me'
      author: {
        name: isCompany ? activeProfile?.name || 'Company' : session?.user?.name || 'You',
        avatar: isCompany ? activeProfile?.avatar_url || '' : session?.user?.image || '',
        account_name: isCompany ? activeProfile?.slug || '' : '',
        isCompanyPost: isCompany
      },
      like_count: 0,
      is_liked: false,
      is_pinned: false,
      isPending: true // Signals optimistic pending state to the UI
    };

    // 2️⃣ Optimistically update local state
    setComments(prev => [optimisticComment, ...prev]);
    onOptimisticAdd?.();

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      const response = await addComment(postId, text, parent_id, companyId);
      
      if (response && response.comment) {
        const mapped = mapBackendCommentToFrontend(response.comment);
        setComments(prev => prev.map(c => c.id === tempId ? mapped : c));
      } else {
        fetchComments(); // Fallback
      }

      toast.success('Comment added');
      return true;
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
      
      // 3️⃣ Rollback on failure
      setComments(prev => prev.filter(c => c.id !== tempId));
      onFailure?.();
      return false;
    }
  }, [postId, isCompany, activeProfile, session, fetchComments]);

  const handleDeleteComment = useCallback(async (commentId: string | number, onSuccess?: () => void) => {
    const prevComments = [...comments];
    
    // ✅ Optimistic: Remove comment AND its threaded children atomically
    setComments(prev => prev.filter(
      c => c.id !== commentId && c.parent_id !== commentId
    ));

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      await deleteComment(commentId.toString(), companyId);
      toast.success('Comment deleted');
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
      setComments(prevComments); // Revert on failure
      return false;
    }
  }, [comments, isCompany, activeProfile?.id]);

  const handleUpdateComment = useCallback(async (commentId: string | number, newText: string) => {
    const prevComments = [...comments];
    
    // Optimistic update
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, text: newText } : c));

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      await updateComment(commentId.toString(), newText, companyId);
      toast.success('Comment updated');
      return true;
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
      setComments(prevComments); // Revert
      return false;
    }
  }, [comments, isCompany, activeProfile?.id]);

  return {
    comments,
    isLoading,
    fetchComments,
    handleAddComment,
    handleDeleteComment,
    handleUpdateComment,
    currentUserId: isCompany ? activeProfile?.id : session?.user?.id
  };
};
