import React from 'react';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/ui/RichTextRenderer';
import { PostSharedContent } from './PostSharedContent';
import type { Poll, Post } from '@/types/entities';

interface PostContentProps {
  content?: string;
  author: string;
  authorSlug?: string;
  isExpanded: boolean;
  isFullContent?: boolean;
  shared_post?: Post | null;
  sharedPollData?: Poll | null;
  isSharedVoting?: boolean;
  handleSharedVote?: (optionId: string) => void;
  isProfileView?: boolean;
  postId?: string | number;
  location?: string;
  timeAgo?: string;
  onToggleExpand?: () => void;
}

export const PostContent = ({
  content, author, authorSlug, isExpanded, isFullContent,
  shared_post, sharedPollData, isSharedVoting, handleSharedVote, isProfileView,
  postId, location, timeAgo, onToggleExpand
}: PostContentProps) => {
  const hasMetadata = Boolean(location || timeAgo);

  if (!content && !shared_post && !hasMetadata) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col justify-center w-full gap-2">
      {content && (
        <div className="w-full">
          <div 
            className={`font-normal font-[family-name:var(--font-poppins)] text-[12px] leading-[16px] text-foreground whitespace-pre-wrap ${!isFullContent && !isExpanded ? 'line-clamp-2' : ''}`}
          >
            <RichTextRenderer content={content} authorName={author} authorSlug={authorSlug} />
          </div>
          {!isFullContent && (content.length > 150 || content.split('\n').length > 3) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
              className="text-[12px] text-[#6366F1] hover:text-[#6366F1]/80 mt-1 font-medium font-[family-name:var(--font-poppins)] focus:outline-none transition-colors inline-block"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}



      {shared_post && (
        <PostSharedContent
          shared_post={shared_post}
          sharedPollData={sharedPollData}
          handleSharedVote={handleSharedVote}
          isSharedVoting={isSharedVoting}
          isProfileView={isProfileView}
        />
      )}
    </div>
  );
};
