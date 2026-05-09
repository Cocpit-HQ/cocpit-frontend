import React from 'react';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/ui/RichTextRenderer';
import { PostSharedContent } from './PostSharedContent';

interface PostContentProps {
  content?: string;
  author: string;
  authorSlug?: string;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  isFullContent?: boolean;
  shared_post?: any;
  sharedPollData?: any;
  isSharedVoting?: boolean;
  handleSharedVote?: (optionId: string) => void;
  isProfileView?: boolean;
  postId?: string | number;
}

export const PostContent = ({
  content, author, authorSlug, isExpanded, setIsExpanded, isFullContent,
  shared_post, sharedPollData, isSharedVoting, handleSharedVote, isProfileView,
  postId
}: PostContentProps) => {
  return (
    <div className="flex-1 flex flex-col justify-center w-full">
      {content && (
        <div className="w-full">
          <div
            className={`font-normal font-[family-name:var(--font-poppins)] text-[12px] leading-[16px] text-black whitespace-pre-wrap ${!isFullContent && !isExpanded ? 'line-clamp-2' : ''}`}
          >
            <RichTextRenderer content={content} authorName={author} authorSlug={authorSlug} />
          </div>
          {!isFullContent && (content.length > 300 || content.split('\n').length > 4) && (
            <Link
              href={`/post/${postId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[12px] text-primary hover:text-primary/80 mt-1 font-medium font-[family-name:var(--font-poppins)] focus:outline-none transition-colors inline-block"
            >
              ...see more
            </Link>
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
