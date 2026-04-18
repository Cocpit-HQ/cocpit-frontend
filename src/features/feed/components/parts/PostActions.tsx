import React from 'react';
import { ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { SaveButton } from '@/components/home/SaveButton';

interface PostActionsProps {
  id: string | number;
  isLiked: boolean;
  likeCount: number;
  handleLike: () => void;
  isCommentSectionOpen: boolean;
  isMobileDrawerOpen: boolean;
  isCommented: boolean;
  commentsCount: number;
  handleToggleCommentSection: () => void;
  shares: string | number;
  handleShare: () => void;
  isSaved: boolean;
  setIsSaved: (val: boolean) => void;
  handleSaveToggle: () => void;
}

export const PostActions = ({
  id, isLiked, likeCount, handleLike,
  isCommentSectionOpen, isMobileDrawerOpen, isCommented, commentsCount, handleToggleCommentSection,
  shares, handleShare, isSaved, setIsSaved, handleSaveToggle
}: PostActionsProps) => {
  return (
    <div className="px-4 py-1 border-t border-border/40 mt-auto">
      <div className="flex items-center justify-between gap-1">
        <button
          onClick={handleLike}
          className={`flex items-center justify-center gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:bg-muted/50'} transition-all duration-200 flex-1 py-1.5 rounded-md`}
        >
          <ThumbsUp className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} />
          {likeCount > 0 && <span className="text-xs font-medium">{likeCount}</span>}
        </button>

        <button
          onClick={handleToggleCommentSection}
          className={`flex items-center justify-center gap-2 ${isCommentSectionOpen || isMobileDrawerOpen || isCommented ? 'text-green-500' : 'text-muted-foreground hover:bg-muted/50'} transition-all duration-200 flex-1 py-1.5 rounded-md`}
        >
          <MessageCircle className="w-4 h-4" fill={isCommented ? "currentColor" : "none"} />
          {commentsCount > 0 && <span className="text-xs font-medium">{commentsCount}</span>}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-all duration-200 flex-1 py-1.5 rounded-md"
        >
          <Share2 className="w-4 h-4" />
          {parseInt(shares?.toString() || '0') > 0 && <span className="text-xs font-medium">{shares}</span>}
        </button>

        <SaveButton
          postId={id.toString()}
          initialIsSaved={isSaved}
          onSaveChange={setIsSaved}
          onToggle={handleSaveToggle}
        />
      </div>
    </div>
  );
};

