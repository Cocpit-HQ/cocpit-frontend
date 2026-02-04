import React, { useState } from 'react';
import { Comment as CommentType } from '@/types/entities';
import CommentList from './CommentList';
import CommentInput from './CommentInput';

interface CommentSectionProps {
  comments: CommentType[];
  isDark?: boolean;
  onAddComment: (commentText: string, replyToId?: string | number) => void;
  onDeleteComment?: (commentId: string | number) => void;
  currentUserId?: string;
  isPostOwner?: boolean;
  postId?: string | number;
}

export default function CommentSection({ comments, onAddComment, onDeleteComment, currentUserId, isPostOwner, postId }: CommentSectionProps) {
  // State for tracking who we are replying to
  const [replyingTo, setReplyingTo] = useState<{ name: string; id: string | number; account_name?: string } | null>(null);

  const handleReply = (authorName: string, commentId: string | number, accountName?: string) => {
    setReplyingTo({ name: authorName, id: commentId, account_name: accountName });
    // Scroll to input? Not strictly needed if sticky or close, but good UX.
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <div className="flex flex-col md:max-h-[250px] bg-background md:bg-muted/30 relative">

      {/* Scrollable Comments List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2 pb-6 scrollbar-hide">
        {comments.length === 0 ? (
          <div className="text-center py-2 text-muted-foreground text-sm">
            No comments yet. Be the first to say something!
          </div>
        ) : (
          <CommentList
            comments={comments}
            onDelete={onDeleteComment}
            currentUserId={currentUserId}
            onReply={handleReply}
            isPostOwner={isPostOwner}
            postId={postId}
          />
        )}
      </div>

      {/* Input Area (Sticky on Desktop within container) */}
      <div className="p-3 md:p-4 border-t border-border bg-card z-10 sticky bottom-0">
        <CommentInput
          onAddComment={(text) => onAddComment(text, replyingTo?.id)}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          // Ideally pass current user avatar here if available (prop drilling)
          currentUserAvatar="/assets/pngegg.png"
        />
      </div>
    </div>
  );
}
