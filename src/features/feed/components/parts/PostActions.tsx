import React from 'react';
import { Icon } from '@/components/icons';
import { SaveButton } from '@/components/home/SaveButton';
import { RepostMenu } from './RepostMenu';
import { FeatureDisabledTooltip } from '@/components/feature-flags';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  disabled?: boolean;
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
  onShowLikes, isSharedPost, hideRepostWithThoughts, disabled
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
          {disabled ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2 cursor-not-allowed">
                    <button
                      type="button"
                      disabled
                      className={`flex items-center justify-center w-[20px] h-[20px] outline-none pointer-events-none rounded ${isLiked ? 'text-[var(--ds-accent)]' : 'text-ds-text-primary'}`}
                      aria-label="Like"
                    >
                      <Icon name={isLiked ? "like-filled" : "like"} className="w-[20px] h-[20px]" />
                    </button>
                    <span className="font-['DM_Sans'] text-[12px] font-normal leading-[16px] text-ds-text-primary pointer-events-none">
                      {likeCount}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-['DM_Sans'] z-50">
                  You don't have access
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex flex-row items-center gap-2">
              <button
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                className={`flex items-center justify-center w-[20px] h-[20px] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded cursor-pointer ${isLiked ? 'text-[var(--ds-accent)]' : 'text-ds-text-primary hover:text-ds-text-secondary'}`}
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
          )}
        </FeatureDisabledTooltip>

        {/* Comment */}
        <FeatureDisabledTooltip featureKey="enableFeedPostInteractions">
          {disabled ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2 cursor-not-allowed">
                    <button
                      type="button"
                      disabled
                      className="flex items-center justify-center w-[20px] h-[20px] outline-none pointer-events-none rounded text-ds-text-primary"
                      aria-label="Toggle comments"
                    >
                      <Icon name="comment" className="w-[20px] h-[20px]" />
                    </button>
                    <span className="font-['DM_Sans'] text-[12px] font-normal leading-[16px] text-ds-text-primary pointer-events-none">
                      {commentsCount}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-['DM_Sans'] z-50">
                  You don't have access
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex flex-row items-center gap-2">
              <button
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCommentSection();
                }}
                className="flex items-center justify-center w-[20px] h-[20px] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded cursor-pointer hover:text-ds-text-secondary text-ds-text-primary"
                aria-label="Toggle comments"
              >
                <Icon name="comment" className="w-[20px] h-[20px]" />
              </button>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCommentSection();
                }}
                className="font-['DM_Sans'] text-[12px] font-normal leading-[16px] text-ds-text-primary cursor-pointer"
              >
                {commentsCount}
              </span>
            </div>
          )}
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
              disabled={disabled}
            />
          </div>
        </FeatureDisabledTooltip>

        {/* Share */}
        {disabled ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-2 cursor-not-allowed">
                  <button
                    type="button"
                    disabled
                    className="flex items-center justify-center w-[20px] h-[20px] outline-none pointer-events-none rounded text-ds-text-primary"
                    aria-label="Share post"
                  >
                    <Icon name="share" className="w-[20px] h-[20px]" />
                  </button>
                  <span className="font-['DM_Sans'] text-[12px] font-normal leading-[16px] text-center text-ds-text-primary pointer-events-none">
                    {externalShares}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-['DM_Sans'] z-50">
                You don't have access
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex flex-row items-center gap-2">
            <button
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="flex items-center justify-center w-[20px] h-[20px] outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded cursor-pointer hover:text-ds-text-secondary text-ds-text-primary"
              aria-label="Share post"
            >
              <Icon name="share" className="w-[20px] h-[20px]" />
            </button>
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="font-['DM_Sans'] text-[12px] font-normal leading-[16px] text-center text-ds-text-primary cursor-pointer"
            >
              {externalShares}
            </span>
          </div>
        )}
      </div>

      {/* Right Aligned Save */}
      <div className="flex items-center">
        <SaveButton
          postId={id.toString()}
          initialIsSaved={isSaved}
          onSaveChange={setIsSaved}
          onToggle={handleSaveToggle}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
