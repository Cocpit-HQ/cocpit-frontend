import React from 'react';
import { Icon } from '@/components/icons';
import { SaveButton } from '@/components/home/SaveButton';
import { RepostMenu } from './RepostMenu';
import { FeatureDisabledTooltip } from '@/components/feature-flags';

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
  externalShares?: string | number;
  handleShare: () => void;
  handleRepostWithThoughts: () => void;
  handleDirectRepost: () => void;
  isReposted: boolean;
  isRepostedWithThoughts?: boolean;
  isSaved: boolean;
  setIsSaved: (val: boolean) => void;
  handleSaveToggle: () => void;
  onShowLikes?: () => void;
  isSharedPost?: boolean;
  hideRepostWithThoughts?: boolean;
}

/**
 * PostActions Component
 * 
 * Renders the interactive action bar for feed posts (Like, Comment, Repost, Share, Save).
 * Includes e.stopPropagation() and 'prevent-card-click' to prevent actions from accidentally
 * triggering navigation to the Single Post View (/post/[id]).
 */
export const PostActions = ({
  id, isLiked, likeCount, handleLike,
  isCommentSectionOpen, isCommented, commentsCount, handleToggleCommentSection,
  shares, externalShares, handleShare, handleRepostWithThoughts, handleDirectRepost, isReposted, isRepostedWithThoughts, isSaved, setIsSaved, handleSaveToggle,
  onShowLikes, isSharedPost, hideRepostWithThoughts
}: PostActionsProps) => {
  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className="flex flex-row justify-between items-center w-full pb-[8px] prevent-card-click"
    >
      {/* Left Aligned Action Group */}
      <div className="flex flex-row items-center gap-[16px]">
        {/* Like */}
        <FeatureDisabledTooltip featureKey="enableFeedPostInteractions">
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
        </FeatureDisabledTooltip>

        {/* Comment */}
        <FeatureDisabledTooltip featureKey="enableFeedPostInteractions">
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleCommentSection(); }}
            className="flex items-center justify-center w-[20px] h-[20px] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded text-ds-text-primary hover:text-ds-text-secondary"
            aria-label="Toggle comments"
          >
            <Icon name="comment" className="w-[20px] h-[20px]" />
          </button>
          <span 
            onClick={(e) => { e.stopPropagation(); handleToggleCommentSection(); }}
            className="font-['DM_Sans'] text-[12px] font-normal leading-[16px] text-ds-text-primary cursor-pointer"
          >
            {commentsCount}
          </span>
        </div>
        </FeatureDisabledTooltip>

        {/* Repost */}
        <FeatureDisabledTooltip featureKey="enableFeedPostInteractions">
        <div className="flex flex-row items-center">
          <RepostMenu
            onRepost={handleDirectRepost}
            onRepostWithThoughts={handleRepostWithThoughts}
            shares={shares}
            isReposted={isReposted}
            isRepostedWithThoughts={isRepostedWithThoughts}
            isSharedPost={isSharedPost}
            hideRepostWithThoughts={hideRepostWithThoughts}
          />
        </div>
        </FeatureDisabledTooltip>

        {/* Share */}
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="flex items-center justify-center w-[20px] h-[20px] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded text-ds-text-primary hover:text-ds-text-secondary"
            aria-label="Share post"
          >
            <Icon name="share" className="w-[20px] h-[20px]" />
          </button>
          <span 
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            className="font-['DM_Sans'] text-[12px] font-normal leading-[16px] text-center text-ds-text-primary cursor-pointer"
          >
            {externalShares}
          </span>
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
