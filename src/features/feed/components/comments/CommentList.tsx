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

  // ✅ CORRECTED: Use parent_id, not heuristics
  const { rootComments, replyMap } = useMemo(() => {
    const replyMap = new Map<string | number, CommentType[]>();

    // Group by parent_id (O(N))
    comments.forEach(comment => {
      if (comment.parent_id) {
        if (!replyMap.has(comment.parent_id)) {
          replyMap.set(comment.parent_id, []);
        }
        replyMap.get(comment.parent_id)!.push(comment);
      }
    });

    const rootComments = comments
      .filter(c => !c.parent_id)
      .sort((a, b) => {
        // 1. Pinned comments first
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;

        // 2. If both are pinned, sort by pinned_at DESC (newest pin at top)
        if (a.is_pinned && b.is_pinned) {
          return new Date(b.pinned_at || b.created_at).getTime() - new Date(a.pinned_at || a.created_at).getTime();
        }

        // 3. Otherwise sort by created_at DESC (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    // Sort replies chronologically (ASC) for readability
    replyMap.forEach((replies) => {
      replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return { rootComments, replyMap };
  }, [comments]);


  // Scroll to comment logic
  const searchParams = useSearchParams();
  const targetCommentId = searchParams.get('commentId');

  useEffect(() => {
    if (targetCommentId && comments.length > 0) {
      // Slight delay to ensure rendering
      setTimeout(() => {
        const element = document.getElementById(`comment-${targetCommentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-blue-50/50', 'dark:bg-blue-900/20');
          setTimeout(() => {
            element.classList.remove('bg-blue-50/50', 'dark:bg-blue-900/20');
          }, 2000);
        }
      }, 500);
    }
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
