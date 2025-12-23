import React, { useState, useRef, useEffect } from 'react';
import { Comment as CommentType } from '@/types/entities';
import CommentList from './CommentList';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { X } from 'lucide-react';

interface MobileCommentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: CommentType[];
  isDark?: boolean;
  onAddComment: (commentText: string) => void;
}

export default function MobileCommentDrawer({
  open,
  onOpenChange,
  comments,
  onAddComment,
}: MobileCommentDrawerProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      const commentText = replyingTo
        ? `@${replyingTo} ${newComment.trim()}`
        : newComment.trim();

      onAddComment(commentText);
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const handleReply = (authorName: string) => {
    setReplyingTo(authorName);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col h-[95vh] rounded-t-xl bg-card border-border">
        <DrawerHeader className="flex-shrink-0 border-b border-border p-4">
          <DrawerTitle className="text-center text-base font-semibold text-foreground">
            Comments
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <CommentList
            comments={comments}
            onReply={handleReply}
          />
        </div>

        {/* Fixed Input Section */}
        <div className="flex-shrink-0 border-t border-border bg-card pb-safe">
          {replyingTo && (
            <div className="px-4 py-2 flex items-center justify-between text-xs bg-muted text-muted-foreground">
              <span>Replying to <span className="font-semibold text-primary">@{replyingTo}</span></span>
              <button onClick={cancelReply} className="p-1 hover:bg-muted/80 rounded-full">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-3 flex items-end gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 overflow-hidden flex-shrink-0 mb-1">
              {/* Current user avatar placeholder */}
              <img src="/assets/pngegg.png" alt="Your avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo}...` : "Add a comment..."}
                className="w-full p-3 pr-12 rounded-2xl text-sm resize-none max-h-32 focus:outline-none border bg-muted text-foreground placeholder-muted-foreground border-transparent focus:border-primary"
                rows={1}
                style={{ minHeight: '44px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="absolute right-2 bottom-2 p-1.5 text-primary disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm transition-opacity"
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
