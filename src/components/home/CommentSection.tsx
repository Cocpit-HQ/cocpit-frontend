import React, { useState } from 'react';
import { Comment as CommentType } from '@/types/entities';
import CommentList from './CommentList';

interface CommentSectionProps {
  comments: CommentType[];
  isDark?: boolean;
  onAddComment: (commentText: string) => void;
}

export default function CommentSection({ comments, isDark = false, onAddComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className={`p-4 md:p-6 ${isDark ? 'bg-[#1f2534]' : 'bg-gray-50'}`}>
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
            className={`w-full p-2 border rounded-lg focus:outline-none focus:border-[#5B7CFF] ${
              isDark
                ? 'bg-[#2d3548] text-white placeholder-gray-400 border-[#2d3548]'
                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
            }`}
            rows={2}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#5B7CFF] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90"
            >
              Post
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="md:max-h-96 overflow-y-auto">
        <CommentList comments={comments} isDark={isDark} />
      </div>
    </div>
  );
}
