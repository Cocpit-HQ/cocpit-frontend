'use client';

import React, { useState } from 'react';
import { Comment as CommentType } from '@/types/entities';
import CommentList from './CommentList';
import CommentInput from './CommentInput';
import CommentListSkeleton from './CommentSkeleton';
import { ReportModal } from '@/components/shared/ReportModal';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface CommentSectionViewProps {
  comments: CommentType[];
  onAddComment: (text: string, replyToId?: string | number, onOptimistic?: () => void, onFailure?: () => void) => void;
  onDeleteComment: (commentId: string | number, onSuccess?: () => void) => void;
  currentUserId?: string;
  isLoading?: boolean;
  isPostOwner?: boolean;
  postId: string | number;
  onEditComment?: (commentId: string | number, newText: string) => void;
  onHideComment: (commentId: string | number) => void;
  handleReportComment: (commentId: string | number) => void;
  onUndoComment?: (commentId: string | number) => void;
  isSidebar?: boolean;
}

export default function CommentSectionView({
  comments,
  onAddComment,
  onDeleteComment,
  currentUserId,
  isLoading,
  isPostOwner,
  postId,
  onEditComment,
  onHideComment,
  handleReportComment,
  onUndoComment,
  isSidebar
}: CommentSectionViewProps) {
  const { activeProfile } = useActiveProfile();
  // Local UI State only
  const [replyingTo, setReplyingTo] = useState<{ name: string; id: string | number; account_name?: string } | null>(null);
  const [reportTargetId, setReportTargetId] = useState<string | number | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string | number, text: string } | null>(null);

  const handleReply = (authorName: string, commentId: string | number, accountName?: string) => {
    setEditingComment(null);
    setReplyingTo({ name: authorName, id: commentId, account_name: accountName });
  };

  const handleEditInitiate = (commentId: string | number, text: string) => {
    setReplyingTo(null);
    setEditingComment({ id: commentId, text });
  };

  const handleCancelAll = () => {
    setReplyingTo(null);
    setEditingComment(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <div 
      className={`flex flex-col min-h-0 bg-ds-bg relative font-dmsans comment-section ${isSidebar ? 'flex-1 w-full' : 'md:max-h-[450px]'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-2 bg-ds-bg z-10 sticky top-0">
        <CommentInput
          onAddComment={(text) => {
            if (editingComment) {
              onEditComment?.(editingComment.id, text);
            } else {
              /* ORIGINAL: onAddComment(text, replyingTo?.id); */
              onAddComment(text);
            }
            handleCancelAll();
          }}
          /* ORIGINAL: replyingTo={replyingTo} */
          /* ORIGINAL: onCancelReply={handleCancelAll} */
          editingComment={editingComment}
          onCancelEdit={handleCancelAll}
          currentUserAvatar={activeProfile?.avatar_url || "/assets/pngegg.png"}
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pt-1 pb-6 scrollbar-hide">
        {isLoading && !comments.length ? (
          <CommentListSkeleton />
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-ds-text-muted ds-text-secondary">
            No comments yet. Be the first to say something!
          </div>
        ) : (
          <CommentList
            comments={comments}
            onDelete={onDeleteComment}
            onEdit={handleEditInitiate}
            currentUserId={currentUserId}
            onReply={handleReply}
            onReport={setReportTargetId}
            onHide={onHideComment}
            onUndo={onUndoComment}
            isPostOwner={isPostOwner}
            postId={postId}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            onAddComment={onAddComment}
            currentUserAvatar={activeProfile?.avatar_url || "/assets/pngegg.png"}
            showAllInitially={isSidebar}
          />
        )}
      </div>

      {reportTargetId !== null && (
        <ReportModal
          isOpen={reportTargetId !== null}
          onClose={() => setReportTargetId(null)}
          onSuccess={() => {
            handleReportComment(reportTargetId);
            setReportTargetId(null);
          }}
          targetType="COMMENT"
          targetId={reportTargetId.toString()}
        />
      )}
    </div>
  );
}
