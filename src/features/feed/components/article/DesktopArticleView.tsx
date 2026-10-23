import React from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { BusinessBuildingIcon } from '@/components/icons';
import { ArticleUIProps } from './ArticleUIProps';
import CommentSection from '../comments/CommentSection';
import { LikeBar } from '../parts/LikeBar';
import { PostActions } from '../parts/PostActions';

export function DesktopArticleView(props: ArticleUIProps) {
  const {
    post,
    id,
    coverImage,
    sanitizedHtml,
    authorProfileHref,
    authorUserId,
    isMe,
    canManage,
    isCompany,
    session,
    activeProfileId,
    likeCount,
    isLiked,
    commentCount,
    isCommented,
    shareCount,
    externalShareCount,
    isReposted,
    isRepostedWithThoughts,
    isSaved,
    setIsSaved,
    handleClose,
    handleLike,
    handleToggleFollow,
    isFollowActionLoading,
    isAuthorFollowing,
    handleIncrementCommentCount,
    handleDecrementCommentCount,
    handleMenuClick,
    handleDirectRepost,
    setIsShareModalOpen,
    setIsSaveModalOpen,
    setIsLikesModalOpen,
    handleRepostWithThoughts,
    contentRef,
    menuAccess,
    hasPostInteractions = true,
  } = props;

  return (
    <main className="relative min-h-screen w-full bg-[var(--ds-bg)] text-[var(--ds-text-primary)] overflow-y-auto lg:overflow-hidden font-['DM_Sans']">
      {/* Top Close Button */}
      <button
        type="button"
        onClick={handleClose}
        className="fixed lg:absolute top-4 right-4 md:top-8 md:right-8 z-30 flex h-[20px] w-[20px] items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity bg-transparent border-none p-0 outline-none cursor-pointer"
        aria-label="Close"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3.75 3.75L16.25 16.25M16.25 3.75L3.75 16.25"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Main Two-Column Centered Layout */}
      <div className="w-full max-w-[935px] mx-auto h-[100dvh] flex flex-col lg:flex-row items-center lg:items-start justify-center gap-[20px] px-4 pt-[max(env(safe-area-inset-top),64px)] pb-[max(env(safe-area-inset-bottom),24px)] lg:pt-[max(env(safe-area-inset-top),80px)] overflow-hidden">
        {/* LEFT COLUMN: Article Content */}
        <article className="no-scrollbar flex w-full max-w-[583px] shrink-0 flex-col items-start gap-[12px] h-full lg:h-full lg:max-h-[766px] lg:overflow-y-auto">
          <div className="flex w-full flex-col items-start gap-[20px] pr-0 lg:pr-2 pb-[120px] lg:pb-0">
            {/* Cover Image */}
            {coverImage && (
              <div className="h-[220px] sm:h-[300px] md:h-[338px] w-full shrink-0 overflow-hidden rounded-[16px] bg-[var(--ds-surface-1)] border border-[var(--ds-border)]">
                <img
                  src={coverImage}
                  alt={post.title || 'Article cover'}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Article Title */}
            <h1 className="m-0 w-full font-['DM_Sans'] text-[28px] sm:text-[34px] md:text-[40px] font-bold leading-[1.2] text-[var(--ds-text-primary)]">
              {post.title || 'Untitled Article'}
            </h1>

            {/* Bulletproof link styling to override any prose defaults */}
            <style dangerouslySetInnerHTML={{
              __html: `
              .article-content a,
              [data-theme="dark"] .article-content a,
              
              .article-content a:hover,
              [data-theme="dark"] .article-content a:hover,
              
            `}} />

            {/* Article Rich Text Body */}
            <div
              ref={contentRef}
              className="article-content prose prose-invert max-w-none w-full text-[var(--ds-text-primary)] [&_a]:!text-[#EC6229] [&_a]:!underline [&_a_*]:!text-[#EC6229]"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </div>
        </article>

        {/* RIGHT COLUMN: Sidebar / Comments Panel */}
        <aside className="box-border flex h-full lg:h-full lg:max-h-[766px] w-full max-w-[583px] lg:w-[300px] shrink-0 flex-col items-start gap-[12px] overflow-hidden rounded-[8px] border border-[var(--ds-border)] bg-[var(--ds-bg)] p-[12px]">
          {/* Author Header */}
          <div className="flex h-[36px] w-full shrink-0 items-center justify-between gap-[8px]">
            <Link
              href={authorProfileHref}
              className="flex h-[36px] items-center gap-[8px] min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              {post.authorAvatar && post.authorAvatar !== "/images/companyonboarding/companyprofileDefault.jpg" ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className={`h-[32px] w-[32px] ${post.isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} object-cover shrink-0`}
                />
              ) : post.isCompanyPost ? (
                <div className="h-[32px] w-[32px] rounded-[8px] bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] flex items-center justify-center shrink-0">
                  <BusinessBuildingIcon className="w-4 h-4 text-ds-text-primary" />
                </div>
              ) : (
                <div className="h-[32px] w-[32px] rounded-full bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                  {(post.author || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-['DM_Sans'] text-[16px] font-semibold leading-[24px] text-[var(--ds-text-primary)] truncate max-w-full">
                  {post.author}
                </span>
                <span className="font-['DM_Sans'] text-[10px] font-normal leading-[12px] text-[var(--ds-text-secondary)] truncate max-w-full">
                  {post.authorHeadline || 'Author'}
                </span>
              </div>
            </Link>

            {/* Follow / Following Button */}
            {!isMe && authorUserId && (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={isFollowActionLoading}
                className="font-['DM_Sans'] text-[14px] font-medium leading-[20px] text-[var(--ds-accent)] hover:opacity-80 transition-opacity shrink-0 px-1 disabled:opacity-50"
              >
                {isAuthorFollowing ? 'Following' : 'Follow'}
              </button>
            )}

            {menuAccess !== 'internal' && hasPostInteractions && (
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={handleMenuClick}
                  className="flex h-[24px] w-[24px] items-center justify-center rounded hover:bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors"
                  aria-label="More options"
                >
                  <MoreHorizontal className="w-[16px] h-[16px]" />
                </button>
              </div>
            )}
          </div>

          {/* Comments Section (Scrollable list + input) */}
          <div className="w-full flex-1 min-h-0 flex flex-col">
            <CommentSection
              postId={id}
              isPostOwner={isMe}
              incrementCommentCount={handleIncrementCommentCount}
              decrementCommentCount={handleDecrementCommentCount}
              isSidebar={true}
            />
          </div>

          {/* Bottom Actions Bar */}
          <div className="w-full shrink-0 border-t border-[var(--ds-border)] pt-2 flex flex-col gap-[8px]">
            <LikeBar
              likeCount={likeCount}
              isLiked={isLiked}
              sampleLikerUsername={post.sampleLikerUsername || undefined}
              likedUsers={post.likedUsers || []}
              viewerUsername={session?.user?.name || undefined}
              onShowLikes={() => setIsLikesModalOpen(true)}
              variant="inline"
              postType="text"
            />
            <PostActions
              id={id}
              isLiked={isLiked}
              likeCount={likeCount}
              handleLike={() => handleLike(isCompany, activeProfileId?.toString())}
              isCommentSectionOpen={true}
              isCommented={isCommented}
              commentsCount={commentCount}
              handleToggleCommentSection={() => { }}
              shares={shareCount}
              externalShares={externalShareCount}
              handleShare={() => setIsShareModalOpen(true)}
              handleRepostWithThoughts={handleRepostWithThoughts}
              handleDirectRepost={handleDirectRepost}
              isReposted={isReposted}
              isRepostedWithThoughts={isRepostedWithThoughts}
              isSaved={!!isSaved}
              setIsSaved={setIsSaved}
              handleSaveToggle={() => setIsSaveModalOpen(true)}
              onShowLikes={() => setIsLikesModalOpen(true)}
              isSharedPost={false}
              hideRepostWithThoughts={false}
              disabled={!hasPostInteractions}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
