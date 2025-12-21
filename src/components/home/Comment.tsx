import React from 'react';
import { ThumbsUp, MoreHorizontal } from 'lucide-react';
import { Comment as CommentType } from '@/types/entities';

interface CommentProps {
  comment: CommentType;
  isDark?: boolean;
  onReply?: (authorName: string) => void;
}

export default function Comment({ comment, isDark = false, onReply }: CommentProps) {
  const { author, text, timeAgo, likes } = comment;

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 overflow-hidden flex-shrink-0">
        <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <div className={`rounded-lg p-3 ${isDark ? 'bg-[#2d3548]' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <h4 className={`${isDark ? 'text-white' : 'text-gray-900'} text-sm font-semibold`}>{author.name}</h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{timeAgo}</p>
          </div>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 px-3">
          <button className={`text-xs font-semibold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Like</button>
          <button
            className={`text-xs font-semibold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => onReply?.(author.name)}
          >
            Reply
          </button>
          {likes > 0 && <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{likes} likes</span>}
        </div>
      </div>
    </div>
  );
}
