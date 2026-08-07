// TODO: Migrate to React Query (useQuery) when comment caching/deduplication is needed.
// Current architecture: manual fetch lifecycle with optimistic updates.
import { useState, useEffect, useCallback } from 'react';
import { getComments, addComment, deleteComment, updateComment, hideComment } from '@/services/api/posts';
import { Comment as CommentType } from '@/types/entities';
import { mapBackendCommentToFrontend } from '@/lib/mappers/feed.mapper';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { toast } from 'sonner';
import { usePostSync } from './use-post-sync';
import { useSearchParams } from 'next/navigation';

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const { isCompany, activeProfile } = useActiveProfile();
  const searchParams = useSearchParams();
  const targetCommentId = searchParams?.get('commentId') || undefined;

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      setIsLoading(true);
      const companyId = isCompany ? activeProfile?.id : undefined;
      const data = await getComments(postId, companyId, targetCommentId);
      const mapped: CommentType[] = data.map(mapBackendCommentToFrontend);
      const commentMap = new Map<string, CommentType>();
      mapped.forEach((c: CommentType) => {
        if (c && c.id != null) {
          commentMap.set(c.id.toString(), c);
        }
      });
      const uniqueComments: CommentType[] = Array.from(commentMap.values());
      setComments(uniqueComments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId, targetCommentId, isCompany, activeProfile?.id]);

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
    setComments(prev => {
      let updated = [optimisticComment, ...prev];
      if (parent_id) {
        const parentIdStr = parent_id.toString();
        updated = updated.map(c => 
          c.id && c.id.toString() === parentIdStr
            ? { ...c, reply_count: (c.reply_count || 0) + 1 }
            : c
        );
      }
      return updated;
    });
    onOptimisticAdd?.();

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      const response = await addComment(postId, text, parent_id, companyId);
      
      if (response && response.comment) {
        const mapped = mapBackendCommentToFrontend(response.comment);
        setComments(prev => {
          const mappedIdStr = mapped.id ? mapped.id.toString() : '';
          const alreadyExists = prev.some(c => c.id && c.id.toString() === mappedIdStr);
          if (alreadyExists) {
            return prev.filter(c => c.id !== tempId);
          }
          return prev.map(c => c.id === tempId ? mapped : c);
        });
      } else {
        fetchComments(); // Fallback
      }

      toast.success('Comment added');
      return true;
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
      
      // 3️⃣ Rollback on failure
      setComments(prev => {
        let rolledBack = prev.filter(c => c.id !== tempId);
        if (parent_id) {
          const parentIdStr = parent_id.toString();
          rolledBack = rolledBack.map(c => 
            c.id && c.id.toString() === parentIdStr
              ? { ...c, reply_count: Math.max(0, (c.reply_count || 0) - 1) }
              : c
          );
        }
        return rolledBack;
      });
      onFailure?.();
      return false;
    }
  }, [postId, isCompany, activeProfile, session, fetchComments]);

  const handleDeleteComment = useCallback(async (commentId: string | number, onSuccess?: () => void) => {
    const prevComments = [...comments];
    
    // ✅ Optimistic: Remove comment AND its threaded children atomically, and decrement parent's reply_count if it is a reply
    setComments(prev => {
      const targetIdStr = commentId.toString();
      const targetComment = prev.find(c => c.id && c.id.toString() === targetIdStr);
      let filtered = prev.filter(c => c.id !== commentId && c.parent_id !== commentId);
      if (targetComment && targetComment.parent_id) {
        const parentIdStr = targetComment.parent_id.toString();
        filtered = filtered.map(c => 
          c.id && c.id.toString() === parentIdStr
            ? { ...c, reply_count: Math.max(0, (c.reply_count || 0) - 1) }
            : c
        );
      }
      return filtered;
    });

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

  const handleHideComment = useCallback(async (commentId: string | number) => {
    const prevComments = [...comments];
    
    // Optimistic: Remove the hidden comment from the view
    setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      await hideComment(commentId.toString(), companyId);
      toast.success('Comment hidden');
      return true;
    } catch (error) {
      console.error('Failed to hide comment:', error);
      toast.error('Failed to hide comment');
      setComments(prevComments); // Revert on failure
      return false;
    }
  }, [comments, isCompany, activeProfile?.id]);

  // Real-time synchronization
  const onCommentAdded = useCallback((data: { postId: string; comment: any }) => {
    if (!data.comment) return;
    const commentIdStr = (data.comment.comment_id || data.comment.id)?.toString();
    if (!commentIdStr) return;

    const isOurComment = data.comment.author_id === (isCompany ? activeProfile?.id : session?.user?.id);

    setComments(prev => {
      // Prevent duplicate if already in state
      if (prev.some(c => c.id && c.id.toString() === commentIdStr)) {
        return prev;
      }

      const mapped = mapBackendCommentToFrontend(data.comment);

      // If it's our comment and there's a pending temp comment, replace it
      let updated: CommentType[];
      const pendingIndex = prev.findIndex(c => c.isPending && c.text === mapped.text);
      if (isOurComment && pendingIndex !== -1) {
        updated = [...prev];
        updated[pendingIndex] = mapped;
      } else {
        updated = [mapped, ...prev];
      }

      if (data.comment.parent_id) {
        const parentIdStr = data.comment.parent_id.toString();
        updated = updated.map(c =>
          c.id && c.id.toString() === parentIdStr
            ? { ...c, reply_count: (c.reply_count || 0) + 1 }
            : c
        );
      }
      return updated;
    });
  }, [isCompany, activeProfile?.id, session?.user?.id]);

  const onCommentLikeUpdated = useCallback((data: { postId: string; commentId: string; liked: boolean; likeCount: number }) => {
    setComments(prev => prev.map(c => 
      c.id === data.commentId || c.id === Number(data.commentId) 
        ? { ...c, like_count: data.likeCount, is_liked: data.liked } 
        : c
    ));
  }, []);

  usePostSync(
    postId,
    {
      onCommentAdded,
      onCommentLikeUpdated
    },
    false // don't manage room here, let FeedPost handle it
  );

  return {
    comments,
    isLoading,
    fetchComments,
    handleAddComment,
    handleDeleteComment,
    handleUpdateComment,
    handleHideComment,
    currentUserId: isCompany ? activeProfile?.id : session?.user?.id
  };
};
