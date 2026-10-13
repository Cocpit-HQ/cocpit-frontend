// TODO: Migrate to React Query (useQuery) when comment caching/deduplication is needed.
// Current architecture: manual fetch lifecycle with optimistic updates.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getComments, addComment, deleteComment, updateComment, hideComment, unhideComment } from '@/services/api/posts';
import { Comment as CommentType } from '@/types/entities';
import { mapBackendCommentToFrontend } from '@/lib/mappers/feed.mapper';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { showToast as toast } from '@/shared/commonComponents/GlobalToast';
import { CommentActionSnackbar } from '../components/comments/CommentActionSnackbar';
import { usePostSync } from './use-post-sync';
import { useSearchParams } from 'next/navigation';

export interface UseCommentsReturn {
  comments: CommentType[];
  isLoading: boolean;
  fetchComments: () => Promise<void>;
  handleAddComment: (text: string, parent_id?: string | number, onOptimisticAdd?: () => void, onFailure?: () => void) => Promise<boolean>;
  handleDeleteComment: (commentId: string | number, onSuccess?: () => void) => void;
  handleUpdateComment: (commentId: string | number, newText: string) => Promise<boolean>;
  handleHideComment: (commentId: string | number) => void;
  handleReportComment: (commentId: string | number) => void;
  handleUndo: (commentId: string | number) => void;
  currentUserId: string | undefined;
}

export const useComments = (postId: string, enabled: boolean = true): UseCommentsReturn => {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const { isCompany, activeProfile } = useActiveProfile();
  const searchParams = useSearchParams();
  const targetCommentId = searchParams?.get('commentId') || undefined;

  // Use refs to avoid re-creating fetchComments on every profile change
  const isCompanyRef = useRef(isCompany);
  const activeProfileIdRef = useRef(activeProfile?.id);
  
  interface PendingAction {
    timeoutId: NodeJS.Timeout;
    actionType: 'hidden' | 'deleted' | 'reported';
    execute: () => Promise<void>;
  }
  const pendingActionsRef = useRef<Map<string, PendingAction>>(new Map());

  useEffect(() => {
    isCompanyRef.current = isCompany;
    activeProfileIdRef.current = activeProfile?.id;
  }, [isCompany, activeProfile?.id]);
  
  // Cleanup timeouts on unmount - execute pending actions so deletions/hides aren't lost
  useEffect(() => {
    const pending = pendingActionsRef.current;
    return () => {
      pending.forEach(action => {
        clearTimeout(action.timeoutId);
        action.execute();
      });
      pending.clear();
    };
  }, []);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      setIsLoading(true);
      const companyId = isCompanyRef.current ? activeProfileIdRef.current : undefined;
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
  }, [postId, targetCommentId]);

  useEffect(() => {
    if (enabled) {
      fetchComments();
    }
  }, [fetchComments, enabled]);

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
      queryClient.invalidateQueries({ queryKey: ['activityLogs'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cocpit:activity-updated'));
      }
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

  const handleUndo = useCallback(async (commentId: string | number) => {
    const commentIdStr = commentId.toString();
    const action = pendingActionsRef.current.get(commentIdStr);
    if (action) {
      clearTimeout(action.timeoutId);
      pendingActionsRef.current.delete(commentIdStr);
    }

    // Always optimistically clear the actionState banner and restore the normal comment
    setComments(prev => prev.map(c => {
      if (c.id?.toString() === commentIdStr) {
        const copy = { ...c };
        delete copy.actionState;
        return copy;
      }
      return c;
    }));

    // Ensure backend unhideComment is called in case it was already sent or persisted
    try {
      const companyId = isCompanyRef.current ? activeProfileIdRef.current : undefined;
      await unhideComment(commentIdStr, companyId);
    } catch {
      // Silently ignore if not in backend hidden_comments
    }
  }, []);

  // Listen to custom window event as additional bridge
  useEffect(() => {
    const handleCustomUndo = (e: any) => {
      if (e.detail?.commentId) {
        handleUndo(e.detail.commentId);
      }
    };
    window.addEventListener('undo-comment-action', handleCustomUndo);
    return () => window.removeEventListener('undo-comment-action', handleCustomUndo);
  }, [handleUndo]);

  const handleDeleteComment = useCallback(async (commentId: string | number, onSuccess?: () => void) => {
    const commentIdStr = commentId.toString();

    // Clear any previous pending action for this comment
    const existing = pendingActionsRef.current.get(commentIdStr);
    if (existing) {
      clearTimeout(existing.timeoutId);
    }

    // Optimistically set actionState inline in the comment list
    setComments(prev => prev.map(c => 
      c.id?.toString() === commentIdStr
        ? { ...c, actionState: { type: 'deleted' } }
        : c
    ));

    const execute = async () => {
      // 1. Remove comment from state (and its replies)
      setComments(prev => {
        const target = prev.find(c => c.id?.toString() === commentIdStr);
        let next = prev.filter(c => c.id?.toString() !== commentIdStr && c.parent_id?.toString() !== commentIdStr);
        if (target?.parent_id) {
          const parentIdStr = target.parent_id.toString();
          next = next.map(c => 
            c.id?.toString() === parentIdStr
              ? { ...c, reply_count: Math.max(0, (c.reply_count || 0) - 1) }
              : c
          );
        }
        return next;
      });

      // 2. Call backend API
      try {
        const companyId = isCompanyRef.current ? activeProfileIdRef.current : undefined;
        await deleteComment(commentIdStr, companyId);
        queryClient.invalidateQueries({ queryKey: ['activityLogs'] });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cocpit:activity-updated'));
        }
        onSuccess?.();
      } catch (error) {
        console.error('Failed to delete comment:', error);
        toast.error('Failed to delete comment');
      }
    };

    const timeoutId = setTimeout(async () => {
      pendingActionsRef.current.delete(commentIdStr);
      await execute();
    }, 5000);

    pendingActionsRef.current.set(commentIdStr, { timeoutId, actionType: 'deleted', execute });
  }, []);

  const handleUpdateComment = useCallback(async (commentId: string | number, newText: string) => {
    const prevComments = [...comments];
    const commentIdStr = commentId.toString();
    
    // Optimistic update
    setComments(prev => prev.map(c => c.id?.toString() === commentIdStr ? { ...c, text: newText, is_edited: true, timeAgo: 'Just now' } : c));

    try {
      const companyId = isCompany ? activeProfile?.id : undefined;
      const res = await updateComment(commentIdStr, newText, companyId);
      if (res?.comment) {
        setComments(prev => prev.map(c => 
          c.id?.toString() === commentIdStr
            ? { 
                ...c, 
                text: res.comment.content ?? newText, 
                is_edited: res.comment.is_edited ?? res.comment.isEdited ?? true 
              } 
            : c
        ));
      }
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
    const commentIdStr = commentId.toString();

    // Clear any previous pending action for this comment
    const existing = pendingActionsRef.current.get(commentIdStr);
    if (existing) {
      clearTimeout(existing.timeoutId);
    }

    // Optimistically set actionState inline in the comment list
    setComments(prev => prev.map(c => 
      c.id?.toString() === commentIdStr
        ? { ...c, actionState: { type: 'hidden' } }
        : c
    ));

    const execute = async () => {
      // Remove comment from local list after undo window expires
      setComments(prev => prev.filter(c => c.id?.toString() !== commentIdStr && c.parent_id?.toString() !== commentIdStr));
      try {
        const companyId = isCompanyRef.current ? activeProfileIdRef.current : undefined;
        await hideComment(commentIdStr, companyId);
      } catch (error) {
        console.error('Failed to hide comment:', error);
        toast.error('Failed to hide comment');
      }
    };

    const timeoutId = setTimeout(async () => {
      pendingActionsRef.current.delete(commentIdStr);
      await execute();
    }, 5000);

    pendingActionsRef.current.set(commentIdStr, { timeoutId, actionType: 'hidden', execute });
  }, []);

  const handleReportComment = useCallback((commentId: string | number) => {
    const commentIdStr = commentId.toString();

    // Clear any previous pending action for this comment
    const existing = pendingActionsRef.current.get(commentIdStr);
    if (existing) {
      clearTimeout(existing.timeoutId);
    }

    setComments(prev => {
      const next = [...prev];
      const targetIndex = next.findIndex(c => c.id?.toString() === commentIdStr);
      if (targetIndex !== -1) {
        next[targetIndex] = { 
          ...next[targetIndex], 
          actionState: { type: 'reported' } 
        };
      }
      return next;
    });

    const execute = async () => {
      setComments(prev => prev.filter(c => c.id?.toString() !== commentIdStr && c.parent_id?.toString() !== commentIdStr));
    };

    const timeoutId = setTimeout(async () => {
      pendingActionsRef.current.delete(commentIdStr);
      await execute();
    }, 5000);

    pendingActionsRef.current.set(commentIdStr, { timeoutId, actionType: 'reported', execute });
  }, []);

  // Real-time synchronization
  const onCommentAdded = useCallback((data: { postId: string; comment: any }) => {
    if (!data.comment) return;
    const commentIdStr = (data.comment.comment_id || data.comment.id)?.toString();
    if (!commentIdStr) return;

    const commentAuthorUserId = data.comment.author_id || data.comment.authorId;
    const commentAuthorOrgId = data.comment.author_org_id || data.comment.authorOrgId;
    const currentUserId = session?.user?.id;
    const currentOrgId = isCompany ? activeProfile?.id : undefined;

    const isOurComment = 
      Boolean(currentUserId && commentAuthorUserId === currentUserId) ||
      Boolean(currentOrgId && commentAuthorOrgId === currentOrgId);

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
        // Only increment reply_count if the comment is NOT from the current user
        // (our own comments already had reply_count incremented optimistically)
        if (!isOurComment) {
          updated = updated.map(c =>
            c.id && c.id.toString() === parentIdStr
              ? { ...c, reply_count: (c.reply_count || 0) + 1 }
              : c
          );
        }
      }
      return updated;
    });
  }, [isCompany, activeProfile?.id, session?.user?.id]);

  const onCommentUpdated = useCallback((data: { postId: string; commentId?: string; content?: string; comment?: any; is_edited?: boolean; isEdited?: boolean }) => {
    const targetId = (data.comment?.comment_id || data.comment?.id || data.commentId)?.toString();
    const newContent = data.comment?.content ?? data.content;
    if (!targetId || newContent === undefined) return;

    setComments(prev => prev.map(c => 
      c.id?.toString() === targetId
        ? { 
            ...c, 
            text: newContent, 
            is_edited: data.comment?.is_edited ?? data.comment?.isEdited ?? data.is_edited ?? data.isEdited ?? true 
          }
        : c
    ));
  }, []);

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
      onCommentUpdated,
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
    handleReportComment,
    handleUndo,
    currentUserId: isCompany ? activeProfile?.id : session?.user?.id
  };
};
