import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, ArrowLeft } from 'lucide-react';
import { BusinessBuildingIcon } from '@/components/icons';
import { ArticleUIProps } from './ArticleUIProps';
import CommentSection from '../comments/CommentSection';
import { LikeBar } from '../parts/LikeBar';
import { PostActions } from '../parts/PostActions';
import dynamic from 'next/dynamic';

const MobileCommentDrawer = dynamic(() => import('../comments/MobileCommentDrawer'), { ssr: false });

export function MobileArticleView(props: ArticleUIProps) {
  const router = useRouter();
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

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);

  return (
    <main className="relative min-h-screen w-full bg-[var(--ds-bg)] text-[var(--ds-text-primary)] overflow-y-auto font-['DM_Sans']">
      
      {/* Main Content */}
      <div className="w-full flex flex-col px-4 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),80px)]">
        
        {/* Top Navigation */}
        <div className="w-full flex justify-between items-center mb-2">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-[24px] w-[24px] items-center justify-center text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors bg-transparent border-none p-0 outline-none cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="flex h-[24px] w-[24px] items-center justify-center text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors bg-transparent border-none p-0 outline-none cursor-pointer"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Author Header - Moved to Top for Mobile */}
        <div className="flex h-auto w-full items-center justify-between gap-[8px] mb-6">
          <Link
            href={authorProfileHref}
            className="flex items-center gap-[12px] min-w-0 flex-1 hover:opacity-90 transition-opacity"
          >
            {post.authorAvatar && post.authorAvatar !== "/images/companyonboarding/companyprofileDefault.jpg" ? (
              <img
                src={post.authorAvatar}
                alt={post.author}
                className={`h-[40px] w-[40px] ${post.isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} object-cover shrink-0`}
              />
            ) : post.isCompanyPost ? (
              <div className="h-[40px] w-[40px] rounded-[8px] bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] flex items-center justify-center shrink-0">
                <BusinessBuildingIcon className="w-5 h-5 text-ds-text-primary" />
              </div>
            ) : (
              <div className="h-[40px] w-[40px] rounded-full bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] flex items-center justify-center font-bold text-sm shrink-0">
                {(post.author || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="font-['DM_Sans'] text-[15px] font-semibold leading-[20px] text-[var(--ds-text-primary)] truncate max-w-full">
                {post.author}
              </span>
              <span className="font-['DM_Sans'] text-[13px] font-normal leading-[16px] text-[var(--ds-text-secondary)] truncate max-w-full">
                {post.authorHeadline || 'Author'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {/* Follow / Following Button */}
            {!isMe && authorUserId && (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={isFollowActionLoading}
                className="font-['DM_Sans'] text-[14px] font-medium leading-[20px] text-[var(--ds-accent)] hover:opacity-80 transition-opacity px-2 py-1 disabled:opacity-50 bg-transparent border-none outline-none cursor-pointer"
              >
                {isAuthorFollowing ? 'Following' : 'Follow'}
              </button>
            )}

            {menuAccess !== 'internal' && hasPostInteractions && (
              <button
                type="button"
                onClick={handleMenuClick}
                className="flex h-[32px] w-[32px] items-center justify-center rounded-full hover:bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors border-none bg-transparent"
                aria-label="More options"
              >
                <MoreHorizontal className="w-[20px] h-[20px]" />
              </button>
            )}
          </div>
        </div>

        {/* Cover Image */}
        {coverImage && (
          <div className="w-full shrink-0 overflow-hidden rounded-[16px] mb-6">
            <img
              src={coverImage}
              alt={post.title || 'Article cover'}
              className="w-full h-auto object-cover max-h-[300px]"
            />
          </div>
        )}

        {/* Article Title */}
        <h1 className="m-0 w-full font-['DM_Sans'] text-[32px] font-bold leading-[1.2] text-[var(--ds-text-primary)] mb-4">
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
          className="article-content prose prose-invert max-w-none w-full text-[var(--ds-text-primary)] [&_a]:!text-[#EC6229] [&_a]:!underline [&_a_*]:!text-[#EC6229] pb-8"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
        

      </div>

      {/* Fixed Bottom Actions Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-[80] w-full bg-[var(--ds-bg)] px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)] flex flex-col shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        <PostActions
          id={id}
          isLiked={isLiked}
          likeCount={likeCount}
          handleLike={() => handleLike(isCompany, activeProfileId?.toString())}
          isCommentSectionOpen={isMobileDrawerOpen}
          isCommented={isCommented}
          commentsCount={commentCount}
          handleToggleCommentSection={() => setIsMobileDrawerOpen(true)}
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

      <MobileCommentDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        postId={id}
        isPostOwner={isMe}
        incrementCommentCount={handleIncrementCommentCount}
        decrementCommentCount={handleDecrementCommentCount}
      />
    </main>
  );
}
