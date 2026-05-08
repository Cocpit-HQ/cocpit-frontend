'use client';

import React from 'react';
import { Heart, MessageCircle, Share2, Repeat2 } from 'lucide-react';
import { SaveButton } from '@/components/home/SaveButton';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

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
    <div className="flex flex-row justify-between items-center px-[16px] py-[8px] gap-[8px] w-full h-[40px]">
      {/* Frame 2608620 (Action Icons Group) - Left Aligned */}
      <div className="flex flex-row items-center gap-[16px]">
        {/* Like (Frame 2608593) */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-row items-center gap-[8px] h-[24px]"
        >
          {isLiked ? (
            <Icon icon="solar:heart-bold" className="w-[24px] h-[24px] text-[#6366F1]" />
          ) : (
            <Icon icon="solar:heart-linear" className="w-[24px] h-[24px] text-black" />
          )}
          <span className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-black">
            {likeCount}
          </span>
        </button>

        {/* Comment (Frame 2608594) */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleToggleCommentSection(); }}
          className="flex flex-row items-center gap-[8px] h-[24px]"
        >
          <Icon icon="solar:chat-round-dots-linear" className="w-[24px] h-[24px] text-black" />
          <span className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-black">
            {commentsCount}
          </span>
        </button>

        {/* Repost (Frame 2608595) */}
        <button 
          className="flex flex-row items-center gap-[8px] h-[24px]"
        >
          <Icon icon="solar:repeat-linear" className="w-[24px] h-[24px] text-black" />
          <span className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-black">
            3
          </span>
        </button>

        {/* Share (Frame 2608597) */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-row items-center gap-[8px] h-[24px]"
        >
          <Icon icon="solar:share-linear" className="w-[24px] h-[24px] text-black" />
          <span className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-black">
            {shares}
          </span>
        </button>
      </div>

      {/* Save (Frame 2608596) - Right Aligned */}
      <div className="flex-shrink-0">
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
