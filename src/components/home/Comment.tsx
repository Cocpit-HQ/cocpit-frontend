import React from 'react';
import { ThumbsUp } from 'lucide-react';
import { Comment as CommentType } from '@/types/entities';

interface CommentProps {
  comment: CommentType;
  isDark?: boolean; // Optional
  onReply?: (authorName: string) => void;
}

export default function Comment({ comment, onReply }: CommentProps) {
  const { author, text, timeAgo, likes } = comment;

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 overflow-hidden flex-shrink-0">
        <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="rounded-lg p-3 bg-muted">
          <div className="flex items-center justify-between">
            <h4 className="text-foreground text-sm font-semibold">{author.name}</h4>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <p className="text-sm mt-1 text-foreground">{text}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 px-3">
          <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">Like</button>
          <button
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => onReply?.(author.name)}
          >
            Reply
          </button>
          {likes > 0 && <span className="text-xs text-muted-foreground">{likes} likes</span>}
        </div>
      </div>
    </div>
  );
}
