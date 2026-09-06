'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { FeedPostProps } from '../types';
import { usePostInteractions } from '../hooks/use-post-interactions';
import { usePostOptions } from '../hooks/use-post-options';
import { usePostMediaObserver } from '../hooks/use-post-media-observer';
import { getPostById } from '@/services/api/posts';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { useFeed } from '@/hooks/use-feed';

// New Parts
import { PostHeader } from './parts/PostHeader';
import { PostBody } from './parts/PostBody';
import { PostMedia } from './parts/PostMedia';
import { PostVideoCard } from './parts/PostVideoCard';
import { PostArticle } from './parts/PostArticle';
import { PostActions } from './parts/PostActions';
import { PostPoll } from './parts/PostPoll';
import { PostOptionsMenu } from './parts/PostOptionsMenu';
import SharedPreview from './create-post/SharedPreview';
import { RepostIcon } from '@/components/icons';
const CommentSection = dynamic(() => import('./comments/CommentSection'), { ssr: false });
const MobileCommentDrawer = dynamic(() => import('./comments/MobileCommentDrawer'), { ssr: false });
const SavePostModal = dynamic(() => import('@/shared/commonComponents/SavePostModal').then(m => m.SavePostModal), { ssr: false });
const DeleteConfirmationModal = dynamic(() => import('@/components/shared/DeleteConfirmationModal').then(m => m.DeleteConfirmationModal), { ssr: false });
const LikesModal = dynamic(() => import('@/shared/commonComponents/LikesModal').then(m => m.LikesModal), { ssr: false });
const CocpitShareModel = dynamic(() => import('@/shared/commonComponents/cocpitsharemodel'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/shared/ReportModal').then(m => m.ReportModal), { ssr: false });


export const FeedPost = (props: FeedPostProps) => {
  const { id, author, authorAvatar, imageSrc, videoSrc, content, timeAgo, visibility, isProfileView, shared_post, poll, isCompanyPost, location, tags, category, post_type } = props;
  const { activeProfile, isCompany } = useActiveProfile();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const router = useRouter();
  const isArticlePost = category === 'Article' || post_type === 'article';
  
  const { updatePostInFeed } = useFeed(false);
  
  const isRepostWithoutThoughts = !!shared_post && (!content || content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() === '');
  const interactionTargetProps = isRepostWithoutThoughts ? { ...props, ...shared_post, id: shared_post.id, repostId: props.repostId || shared_post.repostId } : props;

  const {
    id: targetId,
    author: targetAuthor,
    authorAvatar: targetAuthorAvatar,
    authorSlug: targetAuthorSlug,
    authorRole: targetAuthorRole,
    authorHeadline: targetAuthorHeadline,
    imageSrc: targetImageSrc,
    images: targetImages,
    videoSrc: targetVideoSrc,
    content: targetContent,
    timeAgo: targetTimeAgo,
    visibility: targetVisibility,
    location: targetLocation,
    tags: targetTags,
    category: targetCategory,
    post_type: targetPost_type,
    title: targetTitle,
    sampleLikerUsername: targetSampleLikerUsername,
    likedUsers: targetLikedUsers
  } = interactionTargetProps as any;

  const targetIsCompanyPost = interactionTargetProps.isCompanyPost || false;
  const targetAuthorId = interactionTargetProps.authorId || (interactionTargetProps as any).author_id;

  const {
    isLiked, likeCount, isCommented, isSaved, isReposted, pollData, commentCount, shareCount, externalShareCount,
    isVoting, handleLike, handleVote, setIsSaved, setIsCommented, handleRepostToggle, setShareCount,
    repostId
  } = usePostInteractions(interactionTargetProps as any);

  const {
    showOptions, setShowOptions, optionsPos, setOptionsPos,
    isEditModalOpen, setIsEditModalOpen,
    isReportModalOpen, setIsReportModalOpen,
    isDeleteDialogOpen, setIsDeleteDialogOpen, confirmDelete,
    handleToggleVisibility, handleDelete
  } = usePostOptions(interactionTargetProps as any, (targetId, data) => {
    if (isRepostWithoutThoughts && shared_post) {
      updatePostInFeed(id.toString(), { shared_post: { ...shared_post, ...data } });
    } else {
      updatePostInFeed(id.toString(), data);
    }
  });

  const { videoRef, finalAspectRatio, handleMediaLoad } = usePostMediaObserver(targetId, targetVideoSrc, props.aspectRatio);

  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(
    props.initialShowComments || props.isFullContent || false
  );
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const searchParams = useSearchParams();
  useEffect(() => {
    if (props.isFullContent || searchParams?.get("comments") === "true" || !!searchParams?.get("commentId") || props.initialShowComments) {
      setIsCommentSectionOpen(true);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsMobileDrawerOpen(true);
      }
    }
  }, [searchParams, props.isFullContent, props.initialShowComments]);

  const optionsBtnRef = useRef<HTMLButtonElement>(null);

  const handleToggleCommentSection = () => {
    if (props.onCommentClickOverride) {
      props.onCommentClickOverride();
      return;
    }
    if (window.innerWidth < 768) {
      setIsMobileDrawerOpen(true);
    } else {
      setIsCommentSectionOpen(!isCommentSectionOpen);
    }
  };

  const handleDirectRepost = async () => {
    try {
      const result = await handleRepostToggle(isCompany, activeProfile?.id);
      if (result && result.post_id) {
        try {
          const backendPost = await getPostById(result.post_id);
          const mappedPost = mapBackendPostToFrontend(backendPost);
          window.dispatchEvent(new CustomEvent('postCreated', { detail: mappedPost }));
        } catch (fetchErr) {
          console.error("Failed to fetch and add new repost to feed:", fetchErr);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleRepostWithThoughts = () => {
    props.onRepostWithThoughts?.(props);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const isVideoFeedCard = !!videoSrc && !props.isFullContent;

  const handlePostClick = (e: React.MouseEvent) => {
    if (props.isFullContent) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
      return;
    }
    router.push(`/post/${id}`);
  };

  return (
    <div 
      className="w-full flex flex-col pt-[16px] pb-[8px] gap-[12px] bg-ds-bg border-b border-ds-border/40 max-w-[442px] mx-auto cursor-pointer"
      onClick={handlePostClick}
    >
      {isRepostWithoutThoughts && shared_post && (
        <div className="flex flex-row items-center gap-[8px] h-[12px] text-ds-text-secondary select-none">
          <RepostIcon size={12} className="w-[12px] h-[12px] shrink-0 flex-none text-ds-text-secondary" />
          <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-ds-text-secondary truncate shrink-0 flex-none">
            {props.author} reposted
          </span>
        </div>
      )}

      {/* Video Overlay Card or Regular Layout */}
      {isVideoFeedCard ? (
        <PostVideoCard
          id={targetId}
          videoSrc={targetVideoSrc}
          videoRef={videoRef}
          onLoad={handleMediaLoad}
          finalAspectRatio={finalAspectRatio}
          author={targetAuthor}
          authorId={targetAuthorId}
          authorAvatar={targetAuthorAvatar}
          authorSlug={targetAuthorSlug}
          authorRole={targetAuthorRole || targetAuthorHeadline || undefined}
          location={targetLocation}
          timeAgo={targetTimeAgo}
          visibility={targetVisibility}
          isMe={activeProfile?.type === 'COMPANY' ? !!(targetIsCompanyPost && activeProfile?.id?.toString() === targetAuthorId?.toString()) : (currentUserId === targetAuthorId?.toString())}
          isCompanyPost={targetIsCompanyPost}
          optionsBtnRef={optionsBtnRef}
          showOptions={showOptions}
          setShowOptions={setShowOptions}
          setOptionsPos={setOptionsPos}
          content={targetContent}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      ) : (
        <>
          {/* Header */}
          <PostHeader
            id={targetId}
            author={targetAuthor}
            authorId={targetAuthorId}
            authorAvatar={targetAuthorAvatar}
            authorSlug={targetAuthorSlug}
            authorRole={targetAuthorRole || targetAuthorHeadline || undefined}
            location={targetLocation}
            timeAgo={targetTimeAgo}
            visibility={targetVisibility}
            isMe={activeProfile?.type === 'COMPANY' ? !!(targetIsCompanyPost && activeProfile?.id?.toString() === targetAuthorId?.toString()) : (currentUserId === targetAuthorId?.toString())}
            isCompanyPost={targetIsCompanyPost}
            optionsBtnRef={optionsBtnRef}
            showOptions={showOptions}
            setShowOptions={setShowOptions}
            setOptionsPos={setOptionsPos}
          />

          {/* Body */}
          <PostBody
            content={targetContent}
            author={targetAuthor}
            authorSlug={targetAuthorSlug}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
          />

          {!isRepostWithoutThoughts && shared_post && (
            <div className="px-4 md:px-5">
              <SharedPreview sharedPost={shared_post} isMobile={typeof window !== 'undefined' && window.innerWidth < 768} />
            </div>
          )}

          {/* Article Card or Standard Media */}
          {isArticlePost ? (
            <PostArticle
              postId={targetId}
              title={targetTitle}
              coverImage={targetImageSrc || (targetImages && targetImages.length > 0 ? targetImages[0] : null)}
            />
          ) : (
            <PostMedia
              imageSrc={targetImageSrc}
              images={targetImages}
              videoSrc={targetVideoSrc}
              videoRef={videoRef}
              onLoad={handleMediaLoad}
              tags={targetTags}
              likeCount={likeCount}
              isLiked={isLiked}
              sampleLikerUsername={targetSampleLikerUsername ?? undefined}
              likedUsers={targetLikedUsers}
              viewerUsername={(activeProfile as any)?.account_name || (session?.user as any)?.username}
            />
          )}
        </>
      )}

      {/* Poll (if any) */}
      {pollData && (
        <PostPoll
          pollData={pollData}
          postId={id}
          isOwner={activeProfile?.type === 'COMPANY' ? Boolean(props.isCompanyPost && activeProfile?.id?.toString() === props.authorId?.toString()) : (currentUserId === props.authorId?.toString())}
          isVoting={isVoting}
          handleVote={(optionId) => handleVote(optionId, isCompany, activeProfile?.id)}
        />
      )}

      {/* Liked By (No Media) */}
      {(!((targetImages && targetImages.length > 0) || !!targetImageSrc || !!targetVideoSrc)) && likeCount > 0 && !(likeCount === 1 && isLiked) && targetSampleLikerUsername && (
        <div className="flex flex-row items-center justify-start gap-[4px] pointer-events-auto px-[4px] mt-[4px]">
          <span className="text-[12px] font-normal leading-[16px] text-ds-text-secondary">
            Liked by{' '}
            <span className="font-semibold text-ds-text-primary">
              {targetSampleLikerUsername}
            </span>
            {likeCount > (isLiked ? 2 : 1) ? ` and ${likeCount - (isLiked ? 2 : 1)} others` : ''}
          </span>
          {targetLikedUsers && targetLikedUsers.length > 0 && (() => {
            const viewerUsername = (activeProfile as any)?.account_name || (session?.user as any)?.username;
            const filteredLikedUsers = viewerUsername 
              ? targetLikedUsers.filter((u: any) => u.username?.toLowerCase() !== viewerUsername.toLowerCase()) 
              : targetLikedUsers;
            if (filteredLikedUsers.length === 0) return null;
            return (
              <div className="flex -space-x-1 ml-1">
                {filteredLikedUsers.slice(0, 3).map((user: any, idx: number) => {
                  const hasAvatar = user.avatar_url && user.avatar_url !== '/assets/pngegg.png';
                  return hasAvatar ? (
                    <img
                      key={idx}
                      src={user.avatar_url || undefined}
                      alt={user.username || "user"}
                      className="inline-block h-[16px] w-[16px] rounded-full border border-ds-bg object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div key={idx} className="inline-flex h-[16px] w-[16px] rounded-full border border-ds-bg bg-ds-surface-2 text-ds-text-primary font-medium text-[8px] items-center justify-center flex-shrink-0 select-none">
                      {(user.username || '?').charAt(0).toUpperCase()}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Actions */}
      <PostActions
        id={id}
        isLiked={isLiked}
        likeCount={likeCount}
        handleLike={() => handleLike(isCompany, activeProfile?.id)}
        isCommentSectionOpen={isCommentSectionOpen}
        isCommented={isCommented}
        commentsCount={commentCount}
        handleToggleCommentSection={handleToggleCommentSection}
        shares={shareCount}
        handleShare={handleShare}
        handleRepostWithThoughts={handleRepostWithThoughts}
        handleDirectRepost={handleDirectRepost}
        isReposted={isReposted}
        isSaved={!!isSaved}
        setIsSaved={setIsSaved}
        handleSaveToggle={() => setIsSaveModalOpen(true)}
        onShowLikes={() => setIsLikesModalOpen(true)}
        isSharedPost={isRepostWithoutThoughts}
      />

      {/* Expandable Sections */}
      {isCommentSectionOpen && (
        <CommentSection
          postId={id}
        />
      )}

      <MobileCommentDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        postId={id.toString()}
      />

      {isSaveModalOpen && (
        <SavePostModal
          postId={id.toString()}
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSaved={() => setIsSaved(true)}
        />
      )}

      {isLikesModalOpen && (
        <LikesModal
          postId={id.toString()}
          isOpen={isLikesModalOpen}
          onClose={() => setIsLikesModalOpen(false)}
        />
      )}

      {isShareModalOpen && (
        <CocpitShareModel
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={id.toString()}
          entityType={isArticlePost ? "article" : "post"}
          entityId={id.toString()}
        />
      )}

      {isDeleteDialogOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />
      )}

      <PostOptionsMenu
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        position={optionsPos}
        isMe={activeProfile?.type === 'COMPANY' ? Boolean(props.isCompanyPost && activeProfile?.id?.toString() === props.authorId?.toString()) : (currentUserId === props.authorId?.toString())}
        onEdit={() => {
          setShowOptions(false);
          if (isArticlePost) {
            router.push(`/article/edit/${id}`);
          } else {
            props.onEdit?.(props);
          }
        }}
        onMakePrivate={handleToggleVisibility}
        onDelete={handleDelete}
        onReport={() => setIsReportModalOpen(true)}
        onInterested={() => console.log('Interested clicked for post', id)}
        onNotInterested={() => console.log('Not interested clicked for post', id)}
      />

      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="POST"
          targetId={id.toString()}
        />
      )}
    </div>
  );
};

export default FeedPost;
