'use client';

import React, { useState } from 'react';
import { Comment as CommentType } from '@/types/entities';
import CommentList from './CommentList';
import CommentInput from './CommentInput';
import { ReportModal } from '@/components/shared/ReportModal';

interface CommentSectionViewProps {
  comments: CommentType[];
  onAddComment: (text: string, replyToId?: string | number, onOptimistic?: () => void, onFailure?: () => void) => void;
  onDeleteComment: (commentId: string | number, onSuccess?: () => void) => void;
  currentUserId?: string;
  isLoading?: boolean;
  isPostOwner?: boolean;
  postId: string | number;
}

export default function CommentSectionView({
  comments,
  onAddComment,
  onDeleteComment,
  currentUserId,
  isLoading,
  isPostOwner,
  postId
}: CommentSectionViewProps) {
  // Local UI State only
  const [replyingTo, setReplyingTo] = useState<{ name: string; id: string | number; account_name?: string } | null>(null);
  const [reportTargetId, setReportTargetId] = useState<string | number | null>(null);

  const handleReply = (authorName: string, commentId: string | number, accountName?: string) => {
    setReplyingTo({ name: authorName, id: commentId, account_name: accountName });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 md:max-h-[350px] bg-background md:bg-muted/30 relative">
      <div className="flex-1 overflow-y-auto min-h-0 p-2 pb-6 scrollbar-hide">
        {isLoading && !comments.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No comments yet. Be the first to say something!
          </div>
        ) : (
          <CommentList
            comments={comments}
            onDelete={onDeleteComment}
            currentUserId={currentUserId}
            onReply={handleReply}
            onReport={setReportTargetId}
            isPostOwner={isPostOwner}
            postId={postId}
          />
        )}
      </div>

      <div className="p-3 md:p-4 border-t border-border bg-card z-10 sticky bottom-0">
        <CommentInput
          onAddComment={(text) => {
            onAddComment(text, replyingTo?.id);
            handleCancelReply();
          }}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          currentUserAvatar="/assets/pngegg.png"
        />
      </div>

      {reportTargetId && (
        <ReportModal
          isOpen={!!reportTargetId}
          onClose={() => setReportTargetId(null)}
          targetType="COMMENT"
          targetId={reportTargetId.toString()}
        />
      )}
    </div>
  );
}
