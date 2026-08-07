import React, { useMemo, useEffect, useState } from 'react';
import { Comment as CommentType } from '@/types/entities';
import Comment from './Comment';
import ReplyGroup from './ReplyGroup';
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
}

export default function CommentList({ comments, onReply, onDelete, onEdit, currentUserId, isPostOwner, postId, onReport, onHide }: CommentListProps) {
  const [showAllComments, setShowAllComments] = useState(false);

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
        element.style.backgroundColor = '#E0E7FF'; // Indigo 100 (Solid, very visible)
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
    <div className="space-y-4 pb-4 font-poppins">
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
          />
          {/* Render Replies if any */}
          {replyMap.has(root.id) && (
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
            />
          )}
        </React.Fragment>
      ))}

      {!showAllComments && rootComments.length > 3 && (
        <div className="flex justify-center w-full mt-4">
          <button
            onClick={() => setShowAllComments(true)}
            className="text-sm font-semibold text-[#6366F1] hover:underline cursor-pointer"
          >
            View more
          </button>
        </div>
      )}
      {showAllComments && rootComments.length > 3 && (
        <div className="flex justify-center w-full mt-4">
          <button
            onClick={() => setShowAllComments(false)}
            className="text-sm font-semibold text-[#6366F1] hover:underline cursor-pointer"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
}
