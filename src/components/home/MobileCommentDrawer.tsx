import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import CommentList from './CommentList';
import CommentInput from './CommentInput';
import { Comment as CommentType } from '@/types/entities';
import { X } from 'lucide-react';

interface MobileCommentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: CommentType[];
  isDark?: boolean;
  onAddComment: (commentText: string, replyToId?: string | number) => void;
  onDeleteComment?: (commentId: string | number) => void;
  currentUserId?: string;
  isPostOwner?: boolean;
  postId?: string | number;
}

export default function MobileCommentDrawer({
  open,
  onOpenChange,
  comments,
  onAddComment,
  onDeleteComment,
  currentUserId,
  isPostOwner,
  postId
}: MobileCommentDrawerProps) {
  const [replyingTo, setReplyingTo] = useState<{ name: string; id: string | number } | null>(null);

  const handleReply = (authorName: string, commentId: string | number) => {
    setReplyingTo({ name: authorName, id: commentId });
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setReplyingTo(null);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh] flex flex-col rounded-t-[20px]">
        {/* Header */}
        <DrawerHeader className="border-b border-border py-4 flex items-center justify-between shrink-0">
          <DrawerTitle className="text-center w-full text-base font-semibold">
            Comments <span className="text-muted-foreground font-normal">({comments.length})</span>
          </DrawerTitle>
          {/* Absolute close button mostly for visual assurance on mobile web */}
          <DrawerClose className="absolute right-4 top-4 p-2 bg-muted/50 rounded-full" onClick={handleClose}>
            <X className="w-4 h-4" />
          </DrawerClose>
        </DrawerHeader>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <CommentList
            comments={comments}
            onReply={handleReply}
            onDelete={onDeleteComment}
            currentUserId={currentUserId}
            isPostOwner={isPostOwner}
            postId={postId}
          />
          {/* Spacer to ensure last comment isn't hidden by sticky input */}
          <div className="h-4" />
        </div>

        {/* Sticky Input Footer */}
        <div className="p-4 border-t border-border bg-card mt-auto pb-6 md:pb-4">
          <CommentInput
            onAddComment={(text) => onAddComment(text, replyingTo?.id)}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            currentUserAvatar="/assets/pngegg.png"
            autoFocus={false} // Don't auto-focus on open to prevent keyboard jumping immediately
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
