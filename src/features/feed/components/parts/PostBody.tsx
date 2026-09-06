import React from 'react';
import { RichTextRenderer } from './RichTextRenderer';

interface PostBodyProps {
  content?: string;
  author: string;
  authorSlug?: string;
  isExpanded: boolean;
  onToggleExpand?: () => void;
  variant?: 'default' | 'overlay';
}

export const PostBody = ({
  content, author, authorSlug, isExpanded, onToggleExpand, variant = 'default'
}: PostBodyProps) => {
  if (!content) return null;

  const truncateLength = 160;
  const maxLines = 3;
  const trimmedContent = content.trimEnd();
  const lines = trimmedContent.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim() !== '');
  
  const isLong = trimmedContent.length > truncateLength || nonEmptyLines.length > maxLines;
  let displayContent = trimmedContent;

  if (isLong && !isExpanded) {
    if (nonEmptyLines.length > maxLines) {
      let nonEmptyCount = 0;
      let sliceIndex = lines.length;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== '') {
          nonEmptyCount++;
          if (nonEmptyCount === maxLines) {
            sliceIndex = i + 1;
            break;
          }
        }
      }
      displayContent = lines.slice(0, sliceIndex).join('\n');
    }
    displayContent = displayContent.trimEnd();

    if (displayContent.length > truncateLength) {
      let truncated = displayContent.slice(0, truncateLength);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      if (lastSpaceIndex > 0) {
        truncated = truncated.slice(0, lastSpaceIndex);
      }
      displayContent = truncated;
    }
  }

  return (
    <div className="w-full flex flex-col gap-1">
      <div className={`font-['DM_Sans'] font-normal text-[12px] leading-[16px] whitespace-pre-wrap break-words ${
        variant === 'overlay' ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-ds-text-primary'
      }`}>
        <RichTextRenderer content={displayContent} authorName={author} authorSlug={authorSlug} />
        {isLong && !isExpanded && (
          <span 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="cursor-pointer text-[var(--ds-accent)] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] no-underline hover:no-underline hover:opacity-80 ml-1 transition-opacity"
          >
            ...See more
          </span>
        )}
        {isLong && isExpanded && (
          <span 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleExpand?.();
            }}
            className="block mt-1.5 w-fit cursor-pointer text-[var(--ds-accent)] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] no-underline hover:no-underline hover:opacity-80 transition-opacity"
          >
            Show less
          </span>
        )}
      </div>
    </div>
  );
};
