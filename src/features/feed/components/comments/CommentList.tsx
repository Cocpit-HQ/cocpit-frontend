import React, { useMemo, useEffect, useState } from 'react';
import { Comment as CommentType } from '@/types/entities';
import Comment from './Comment';
import ReplyGroup from './ReplyGroup';
import CommentInput from './CommentInput';
import { useSearchParams } from 'next/navigation';

interface CommentListProps {
  comments: CommentType[];
  isDark?: boolean;
  onReply?: (authorName: string, commentId: string | number, accountName?: string) => void;
  onDelete?: (commentId: string | number) => void;
  onEdit?: (commentId: string | number, currentText: string) => void;
  currentUserId?: string;
  isPostOwner?: boolean;
  postId?: string | number;
  onReport?: (commentId: string | number) => void;
  onHide?: (commentId: string | number) => void;
  onUndo?: (commentId: string | number) => void;
  replyingTo?: { name: string; id: string | number; account_name?: string } | null;
  onCancelReply?: () => void;
  onAddComment?: (text: string, replyToId?: string | number) => void;
  currentUserAvatar?: string;
  showAllInitially?: boolean;
  hideCancelButton?: boolean;
}

// ORIGINAL: export default function CommentList({ comments, onReply, onDelete, onEdit, currentUserId, isPostOwner, postId, onReport, onHide }: CommentListProps) {
export default function CommentList({ 
  comments, 
  onReply, 
  onDelete, 
  onEdit, 
  currentUserId, 
  isPostOwner, 
  postId, 
  onReport, 
  onHide,
  onUndo,
  replyingTo,
  onCancelReply,
  onAddComment,
  currentUserAvatar,
  showAllInitially = false,
  hideCancelButton = false
}: CommentListProps) {
  const [showAllComments, setShowAllComments] = useState(showAllInitially);

  const searchParams = useSearchParams();
  const targetCommentId = searchParams.get('commentId');

  // ✅ CORRECTED: Use parent_id, not heuristics & deduplicate by comment ID
  const { rootComments, replyMap } = useMemo(() => {
    const uniqueMap = new Map<string, CommentType>();
    comments.forEach(c => {
      if (!c || c.id === undefined || c.id === null) return;
      const key = c.id.toString();
      const existing = uniqueMap.get(key);
      if (!existing || (!c.isPending && existing.isPending)) {
        uniqueMap.set(key, c);
      }
    });
    const uniqueComments = Array.from(uniqueMap.values());

    const replyMap = new Map<string | number, CommentType[]>();

    // Group by parent_id (O(N))
    uniqueComments.forEach(comment => {
      if (comment.parent_id) {
        if (!replyMap.has(comment.parent_id)) {
          replyMap.set(comment.parent_id, []);
        }
        replyMap.get(comment.parent_id)!.push(comment);
      }
    });

    // The backend guarantees the array is sorted correctly (including target threads and pins)
    const rootComments = uniqueComments.filter(c => !c.parent_id);

    // Sort replies chronologically (ASC) for readability
    replyMap.forEach((replies) => {
      replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return { rootComments, replyMap };
  }, [comments, targetCommentId]);


  // Scroll to comment logic
  useEffect(() => {
    if (!targetCommentId || comments.length === 0) return;

    // Clear any existing timeouts to prevent race conditions on re-render
    const timer = setTimeout(() => {
      const elementId = `comment-${targetCommentId}`;
      const element = document.getElementById(elementId);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Use extremely visible inline styles
        element.style.transition = 'all 0.5s ease-in-out';
        element.style.backgroundColor = 'var(--ds-surface-2)'; // highlight pulse
        element.style.borderRadius = '12px';
        element.style.padding = '12px';
        element.style.margin = '0 -12px';
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          element.style.backgroundColor = 'transparent';
        }, 3000);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [targetCommentId, comments]); // Re-run when comments load

  const visibleRootComments = showAllComments
    ? rootComments
    : rootComments.slice(0, 3);

  return (
    /* ORIGINAL: <div className="space-y-4 pb-4 font-poppins"> */
    <div className="flex flex-col gap-3 pb-2 font-dmsans">
      {visibleRootComments.map((root, index) => (
        <React.Fragment key={root.id}>
          <Comment
            comment={root}
            onReply={onReply}
            onDelete={onDelete}
            onEdit={onEdit}
            currentUserId={currentUserId}
            variant="root"
            isPostOwner={isPostOwner}
            postId={postId}
            onReport={onReport}
            onHide={onHide}
            onUndo={onUndo}
          />
          {replyingTo?.id === root.id && (
            <div className="pl-[32px]">
              <CommentInput
                variant="reply"
                onAddComment={(text) => onAddComment?.(text, root.id)}
                replyingTo={replyingTo}
                onCancelReply={onCancelReply}
                currentUserAvatar={currentUserAvatar}
                autoFocus={true}
                hideCancelButton={hideCancelButton}
              />
            </div>
          )}
          {/* Render Replies if any */}
          {replyMap.has(root.id) && !root.actionState && (
            <ReplyGroup
              replies={replyMap.get(root.id)!}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              currentUserId={currentUserId}
              isDark={false}
              isPostOwner={isPostOwner}
              postId={postId}
              onReport={onReport}
              onHide={onHide}
              onUndo={onUndo}
              replyingTo={replyingTo}
              onCancelReply={onCancelReply}
              onAddComment={onAddComment}
              currentUserAvatar={currentUserAvatar}
              hideCancelButton={hideCancelButton}
            />
          )}
        </React.Fragment>
      ))}

      {!showAllInitially && !showAllComments && rootComments.length > 3 && (
        <div className="flex justify-center w-full mt-4 pb-4">
          <button
            onClick={() => setShowAllComments(true)}
            className="ds-text-small-1 text-ds-accent cursor-pointer"
          >
            View more
          </button>
        </div>
      )}
      {!showAllInitially && showAllComments && rootComments.length > 3 && (
        <div className="flex justify-center w-full mt-4 pb-4">
          <button
            onClick={() => setShowAllComments(false)}
            className="ds-text-small-1 text-ds-accent cursor-pointer"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
}
