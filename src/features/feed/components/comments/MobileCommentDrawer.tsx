'use client';

import React from 'react';
import { Drawer } from 'vaul';
import { MessageCircle, X } from 'lucide-react';
import { useComments } from '../../hooks/use-comments';
import CommentSectionView from './CommentSectionView';

interface MobileCommentDrawerProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  incrementCommentCount?: () => void;
  decrementCommentCount?: () => void;
}

export default function MobileCommentDrawer({ postId, isOpen, onClose, incrementCommentCount, decrementCommentCount }: MobileCommentDrawerProps) {
  const { 
    comments, isLoading, handleAddComment, handleDeleteComment, currentUserId 
  } = useComments(postId);

  // Named handlers for consistency with CommentSection.tsx
  const handleAdd = (text: string, replyToId?: string | number) => {
    handleAddComment(text, replyToId, incrementCommentCount, decrementCommentCount);
  };

  const handleDelete = (commentId: string | number) => {
    handleDeleteComment(commentId, decrementCommentCount);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[99]" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[20px] h-[90vh] mt-24 fixed bottom-0 left-0 right-0 z-[100] outline-none">
          <div className="p-4 bg-background border-b border-border flex items-center justify-between rounded-t-[20px]">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-4 absolute top-3 left-1/2 -translate-x-1/2" />
            <Drawer.Title className="flex items-center gap-2 mt-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold">Comments</span>
              <span className="text-sm text-muted-foreground font-normal">({comments.length})</span>
            </Drawer.Title>
            <Drawer.Description className="sr-only">
              View and participate in the discussion for this post.
            </Drawer.Description>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors mt-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-muted/5">
            {/* CommentSectionView owns its own loading spinner — no outer guard needed */}
            <CommentSectionView
              postId={postId}
              comments={comments}
              isLoading={isLoading}
              onAddComment={handleAdd}
              onDeleteComment={handleDelete}
              currentUserId={currentUserId}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}