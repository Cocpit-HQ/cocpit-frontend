import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
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
  // Article support props:
  category?: string;
  title?: string | null;
  articleBody?: string;
  imageSrc?: string;
  authorAvatar?: string;
}

export const PostContent = ({
  content, author, authorSlug, isExpanded, isFullContent,
  shared_post, sharedPollData, isSharedVoting, handleSharedVote, isProfileView,
  postId, location, timeAgo, onToggleExpand,
  category, title, articleBody, imageSrc
}: PostContentProps) => {
  const isArticle = category === 'Article' || Boolean(articleBody);
  const articleHref = postId ? `/post/${postId}` : undefined;
  const normalizedArticleBody = (articleBody || '').trim();
  const articleDescription = (content || '').trim();
  const shouldShowArticleDescription = Boolean(articleDescription) && articleDescription !== normalizedArticleBody;
  const isLongArticleDescription = articleDescription.length > 180 || articleDescription.split('\n').length > 3;
  const hasArticleBody = Boolean(articleBody?.trim());
  const showFullArticle = isArticle && (isFullContent || isExpanded);

  if (!content && !shared_post && !isArticle) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col justify-center w-full gap-2">
      {/* Custom rich article renderer styles */}
      <style>{`
        .article-body-view h1 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--foreground);
          font-family: var(--font-poppins), sans-serif;
          line-height: 1.3;
        }
        .article-body-view h2 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: var(--foreground);
          font-family: var(--font-poppins), sans-serif;
          line-height: 1.3;
        }
        .article-body-view p {
          margin-bottom: 1rem;
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--foreground);
          opacity: 0.9;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .article-body-view ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
          font-size: 0.95rem;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .article-body-view li {
          margin-bottom: 0.4rem;
        }
        /* Hide editor-only controls in feed view */
        .article-body-view .edit-link-btn,
        .article-body-view .delete-link-btn,
        .article-body-view .img-tools {
          display: none !important;
        }
        /* Link wrapper: relative for tooltip anchor */
        .article-body-view span.inline.group {
          position: relative;
        }
        /* Tooltip: hidden by default, visible on hover, high z-index */
        .article-body-view span.inline.group > span:last-of-type {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          z-index: 50;
        }
        .article-body-view span.inline.group:hover > span:last-of-type {
          opacity: 1;
          pointer-events: auto;
        }
        /* Style links in feed view */
        .article-body-view a {
          color: #6366F1;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
        }
        .article-body-view a:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* Main post description/caption */}
      {content && !isArticle && (() => {
        const truncateLength = 185;
        const trimmedContent = content.trimEnd();
        const nonEmptyLineCount = trimmedContent.split('\n').filter(line => line.trim() !== '').length;
        const isLong = !isFullContent && (trimmedContent.length > truncateLength || nonEmptyLineCount > 3);
        let displayContent = trimmedContent;

        if (isLong && !isExpanded) {
          const lines = trimmedContent.split('\n');
          if (nonEmptyLineCount > 3) {
            let nonEmptyCount = 0;
            let sliceIndex = lines.length;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].trim() !== '') {
                nonEmptyCount++;
                if (nonEmptyCount === 3) {
                  sliceIndex = i + 1;
                  break;
                }
              }
            }
            displayContent = lines.slice(0, sliceIndex).join('\n');
          }
          if (displayContent.length > truncateLength) {
            let truncated = displayContent.slice(0, truncateLength);
            const lastSpaceIndex = truncated.lastIndexOf(' ');
            if (lastSpaceIndex > 0) {
              truncated = truncated.slice(0, lastSpaceIndex);
            }
            displayContent = truncated.trimEnd();
          }
        }

        return (
          <div className="w-full">
            <div
              className="font-normal font-[family-name:var(--font-poppins)] text-[12px] leading-[16px] text-foreground whitespace-pre-wrap"
            >
              <span className="inline">
                <RichTextRenderer content={isExpanded ? trimmedContent : displayContent} authorName={author} authorSlug={authorSlug} />
              </span>
              {isLong && !isExpanded && (
                <span className="inline">
                  ...{' '}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand?.();
                    }}
                    className="inline text-[#6366F1] hover:text-[#6366F1]/80 font-medium font-[family-name:var(--font-poppins)] focus:outline-none transition-colors"
                  >
                    Read more
                  </button>
                </span>
              )}
            </div>
            {isLong && isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.();
                }}
                className="text-[12px] text-[#6366F1] hover:text-[#6366F1]/80 mt-1 font-medium font-[family-name:var(--font-poppins)] focus:outline-none transition-colors inline-block"
              >
                Show less
              </button>
            )}
          </div>
        );
      })()}

      {/* Inline Article Card */}
      {isArticle && (
        <div className="w-full mt-2 mb-2 border border-border bg-card/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 flex flex-col">
          {articleHref ? (
            <Link href={articleHref} className="block" onClick={(e) => e.stopPropagation()}>
              <div className="w-full aspect-[21/9] overflow-hidden relative border-b border-border/40">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={title || "Article cover"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-indigo-400" />
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <div className="w-full aspect-[21/9] overflow-hidden relative border-b border-border/40">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={title || "Article cover"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-indigo-400" />
                </div>
              )}
            </div>
          )}

          <div className="p-5 flex flex-col gap-3">
            {articleHref && !isFullContent ? (
              <Link href={articleHref} className="block">
                <h4 className="line-clamp-2 font-bold text-[16px] text-foreground font-[family-name:var(--font-poppins)] leading-snug">
                  {title || "Untitled Article"}
                </h4>
              </Link>
            ) : (
              <h4 className="line-clamp-2 font-bold text-[16px] text-foreground font-[family-name:var(--font-poppins)] leading-snug">
                {title || "Untitled Article"}
              </h4>
            )}

            {shouldShowArticleDescription && (
              <div className="relative">
                <div
                  className={`font-normal font-[family-name:var(--font-poppins)] text-[13px] leading-[20px] text-foreground/85 whitespace-pre-wrap ${!showFullArticle ? 'line-clamp-3' : ''}`}
                >
                  <RichTextRenderer content={articleDescription} authorName={author} authorSlug={authorSlug} />
                </div>
                {!showFullArticle && isLongArticleDescription && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card via-card/95 to-transparent" />
                )}
              </div>
            )}

            {hasArticleBody && showFullArticle && (
              <div
                className={`grid min-w-0 transition-all duration-300 ease-out ${showFullArticle ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}
              >
                <div className={`min-w-0 ${showFullArticle ? 'overflow-visible' : 'overflow-hidden'}`}>
                  <div
                    dangerouslySetInnerHTML={{ __html: articleBody || '' }}
                    className="article-body-view border-t border-border/40 pt-4 break-words"
                    style={{ overflowWrap: 'break-word', wordWrap: 'break-word', wordBreak: 'break-word' }}
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Shared Post content if present */}
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
