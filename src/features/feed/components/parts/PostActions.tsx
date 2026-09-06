import React from 'react';
import { Icon } from '@/components/icons';
import { SaveButton } from '@/components/home/SaveButton';
import { RepostMenu } from './RepostMenu';

interface PostActionsProps {
  id: string | number;
  isLiked: boolean;
  likeCount: number;
  handleLike: () => void;
  isCommentSectionOpen: boolean;
  isCommented: boolean;
  commentsCount: number;
  handleToggleCommentSection: () => void;
  shares: string | number;
  handleShare: () => void;
  handleRepostWithThoughts: () => void;
  handleDirectRepost: () => void;
  isReposted: boolean;
  isSaved: boolean;
  setIsSaved: (val: boolean) => void;
  handleSaveToggle: () => void;
  onShowLikes?: () => void;
  isSharedPost?: boolean;
}

export const PostActions = ({
  id, isLiked, likeCount, handleLike,
  isCommentSectionOpen, isCommented, commentsCount, handleToggleCommentSection,
  shares, handleShare, handleRepostWithThoughts, handleDirectRepost, isReposted, isSaved, setIsSaved, handleSaveToggle,
  onShowLikes, isSharedPost
}: PostActionsProps) => {
  return (
    <div className="flex flex-row justify-between items-center w-full py-[8px]">
      {/* Left Aligned Action Group */}
      <div className="flex flex-row items-center gap-[16px]">
        {/* Like */}
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleLike(); }}
            className={`flex items-center justify-center w-[20px] h-[20px] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded ${isLiked ? 'text-[var(--ds-accent)]' : 'text-ds-text-primary hover:text-ds-text-secondary'}`}
          >
            <Icon name={isLiked ? "like-filled" : "like"} className="w-[20px] h-[20px]" />
          </button>
          <span 
            onClick={(e) => {
              e.stopPropagation();
              if (likeCount > 0 && onShowLikes) onShowLikes();
            }}
            className={`font-['DM_Sans'] text-[12px] font-normal leading-[16px] text-ds-text-primary ${likeCount > 0 && onShowLikes ? 'cursor-pointer hover:underline' : ''}`}
          >
            {likeCount}
          </span>
        </div>

        {/* Comment */}
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleCommentSection(); }}
            className={`flex items-center justify-center w-[20px] h-[20px] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded ${isCommented ? 'text-[var(--ds-accent)]' : 'text-ds-text-primary hover:text-ds-text-secondary'}`}
          >
            <Icon name="comment" className="w-[20px] h-[20px]" />
          </button>
          <span className="font-['DM_Sans'] text-[12px] font-normal leading-[16px] text-ds-text-primary">
            {commentsCount}
          </span>
        </div>

        {/* Repost */}
        <div className="flex flex-row items-center gap-[16px]">
          <RepostMenu
            onRepost={handleDirectRepost}
            onRepostWithThoughts={handleRepostWithThoughts}
            isReposted={isReposted}
            shares={shares}
            isSharedPost={isSharedPost}
          />
        </div>

        {/* Share */}
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="flex items-center justify-center w-[20px] h-[20px] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded text-ds-text-primary hover:text-ds-text-secondary"
          >
            <Icon name="share" className="w-[20px] h-[20px]" />
          </button>
        </div>
      </div>

      {/* Right Aligned Save */}
      <div className="flex items-center">
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
