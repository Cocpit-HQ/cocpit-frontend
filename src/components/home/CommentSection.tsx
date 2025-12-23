import React, { useState } from 'react';
import { Comment as CommentType } from '@/types/entities';
import CommentList from './CommentList';

interface CommentSectionProps {
  comments: CommentType[];
  isDark?: boolean; // Optional for compatibility
  onAddComment: (commentText: string) => void;
}

export default function CommentSection({ comments, onAddComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="p-4 md:p-6 bg-muted/30">
      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="flex items-start gap-3 mb-6">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 overflow-hidden flex-shrink-0">
          {/* This would be the current user's avatar */}
          <img src="/assets/pngegg.png" alt="Your avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary bg-card text-foreground placeholder-muted-foreground border-border"
            rows={2}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90"
            >
              Post
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="md:max-h-96 overflow-y-auto">
        <CommentList comments={comments} />
      </div>
    </div>
  );
}
