import React from 'react';
import { Comment as CommentType } from '@/types/entities';
import Comment from './Comment';

interface CommentListProps {
  comments: CommentType[];
  isDark?: boolean; // Optional
  onReply?: (authorName: string) => void;
}

export default function CommentList({ comments, onReply }: CommentListProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          onReply={onReply}
        />
      ))}
    </div>
  );
}
