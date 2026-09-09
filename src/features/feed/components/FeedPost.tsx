'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
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
import { feedApi } from '../api/feed.api';
import { hidePost, unhidePost, submitPostFeedback } from '@/services/api/feed';

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
import { RepostIcon, NotInterestedIcon, InterestedIcon } from '@/components/icons';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
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
  const interactionTargetProps = isRepostWithoutThoughts ? { ...props, ...shared_post, id: shared_post.id, repostId: props.repostId || shared_post.repostId, shared_post: shared_post.shared_post } : props;
  const isTargetPostRepostWithThoughts = !!interactionTargetProps.shared_post && !!interactionTargetProps.content && interactionTargetProps.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() !== '';

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

  const isTargetAuthorMe = activeProfile?.type === 'COMPANY'
    ? !!(targetIsCompanyPost && activeProfile?.id?.toString() === targetAuthorId?.toString())
    : (currentUserId === targetAuthorId?.toString());

  const {
    isLiked, likeCount, isCommented, isSaved, isReposted, pollData, commentCount, shareCount, externalShareCount,
    isVoting, handleLike, handleVote, setIsSaved, setIsCommented, handleRepostToggle, setShareCount,
    repostId, incrementExternalShareCount, isRepostedWithThoughts
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
  const [selectedLikesPostId, setSelectedLikesPostId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Opens the Likes modal for either the target post or an embedded shared post
  const handleOpenLikesModal = (postIdToOpen?: string) => {
    setSelectedLikesPostId(postIdToOpen || targetId.toString());
    setIsLikesModalOpen(true);
  };
  // --- Report Flow State ---
  // Tracks if the temporary 'Report submitted' UI is currently visible
  const [isReportSubmitted, setIsReportSubmitted] = useState(false);
  // Tracks if the post was reported during this session (used to show 'Reported' in the options menu if they click 'Show post')
  const [hasBeenReported, setHasBeenReported] = useState(false);

  const { removePostFromFeed } = useFeed(false);
  // Ref to hold the auto-removal timer so we can cancel it if the user clicks 'Show post'
  const reportTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Triggered when the backend successfully saves the report
  const handleReportSuccess = () => {
    setIsReportSubmitted(true);
    setHasBeenReported(true);
    // Auto-remove the post from the feed entirely after 15 seconds
    reportTimeoutRef.current = setTimeout(() => {
      removePostFromFeed(id.toString());
    }, 15000);
  };

  // Triggered when the user clicks 'Show post' on the success snackbar
  const handleUndoReportUI = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Clear the auto-removal timer
    if (reportTimeoutRef.current) {
      clearTimeout(reportTimeoutRef.current);
      reportTimeoutRef.current = null;
    }
    // Re-render the actual post UI (but it remains marked as reported in the DB)
    setIsReportSubmitted(false);
  };
  // -------------------------


  // --- Not Interested Flow State ---
  // Tracks if the temporary 'Not interested' snackbar is currently visible replacing the post content
  const [isNotInterested, setIsNotInterested] = useState(false);
  // Ref to hold the auto-removal timer so we can cancel it if the user clicks 'Undo'
  const notInterestedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Interested Flow State ---
  const [isInterested, setIsInterested] = useState(false);
  const interestedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Triggered when the user clicks 'Undo' on the snackbar
  const handleUndoNotInterested = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notInterestedTimeoutRef.current) {
      clearTimeout(notInterestedTimeoutRef.current);
      notInterestedTimeoutRef.current = null;
    }

    try {
      // Call the backend to reverse the hide action (removes from hiddenSet, seenSet, and reverses penalty)
      await unhidePost({
        item_id: id.toString(),
        session_id: 'default',
        position: 0,
      });
      if (isRepostWithoutThoughts && targetId && targetId !== id) {
        await unhidePost({
          item_id: targetId.toString(),
          session_id: 'default',
          position: 0,
        }).catch(() => {});
      }
      // Re-render the actual post UI in its exact position
      setIsNotInterested(false);
    } catch (error) {
      toast.error("Failed to undo");
    }
  };
  // -------------------------

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
      } else if (result && result.reposted === false) {
        // If we un-reposted, and the current FeedPost is OUR wrapper post, remove it instantly from the UI
        const currentId = isCompany ? activeProfile?.id : currentUserId;
        const isMyPost = (isCompany && props.isCompanyPost && props.authorId === currentId) || (!isCompany && !props.isCompanyPost && props.authorId === currentId);
        
        if (isRepostWithoutThoughts && isMyPost) {
          removePostFromFeed(id.toString());
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

  const isVideoFeedCard = false; // Disabled full-screen video feed card per mobile responsive design

  const handlePostClick = (e: React.MouseEvent) => {
    if (props.isFullContent) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
      return;
    }
    router.push(`/post/${id}`);
  };

  const isCompanyProfile = activeProfile?.type === 'COMPANY';
  const currentUserHandle = isCompanyProfile
    ? activeProfile?.slug
    : ((activeProfile as any)?.account_name || (session?.user as any)?.username);
  const currentUserName = isCompanyProfile
    ? activeProfile?.name
    : ((activeProfile as any)?.full_name || (session?.user as any)?.name || (session?.user as any)?.fullName);

  const isMentioned = useMemo(() => {
    if (!targetContent) return false;

    let isMatch = false;

    if (currentUserHandle) {
      // Check for structured mentions e.g. @[Name](handle)
      const escapeHandle = currentUserHandle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const structuredMatch = new RegExp(`@\\[[^\\]]+\\]\\(${escapeHandle}\\)`, 'i');
      if (structuredMatch.test(targetContent)) isMatch = true;

      // Check for legacy mentions e.g. @handle
      const legacyMatch = new RegExp(`(?:^|\\s)@${escapeHandle}(?:\\b|\\s|$)`, 'i');
      if (legacyMatch.test(targetContent)) isMatch = true;
    }

    // Fallback: Check if the user's full name matches the display name in a structured mention
    if (!isMatch && currentUserName) {
      const escapeName = currentUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const structuredNameMatch = new RegExp(`@\\[${escapeName}\\]\\([^)]+\\)`, 'i');
      if (structuredNameMatch.test(targetContent)) isMatch = true;
    }

    return isMatch;
  }, [targetContent, currentUserHandle, currentUserName]);

  const handleRemoveMention = async () => {
    if (!targetContent) return;

    let newContent = targetContent;

    // 1. Strip structured mentions using the exact handle
    if (currentUserHandle) {
      const escapeHandle = currentUserHandle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const structuredMatch = new RegExp(`@\\[([^\\]]+)\\]\\(${escapeHandle}\\)`, 'gi');
      newContent = newContent.replace(structuredMatch, '$1');
    }

    // 2. Strip structured mentions using the full name fallback
    if (currentUserName) {
      const escapeName = currentUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const structuredNameMatch = new RegExp(`@\\[(${escapeName})\\]\\([^)]+\\)`, 'gi');
      newContent = newContent.replace(structuredNameMatch, '$1');
    }

    // 3. Strip legacy mentions
    if (currentUserHandle) {
      const escapeHandle = currentUserHandle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const legacyMatch = new RegExp(`@(${escapeHandle})\\b`, 'gi');
      newContent = newContent.replace(legacyMatch, '$1');
    }

    // Optimistic Update
    if (isRepostWithoutThoughts && shared_post) {
      updatePostInFeed(id.toString(), { shared_post: { ...shared_post, content: newContent } });
    } else {
      updatePostInFeed(id.toString(), { content: newContent });
    }

    try {
      await feedApi.removeMention(id.toString());
      toast.success("Mention removed from this post.");
    } catch (error) {
      // Revert if API fails
      if (isRepostWithoutThoughts && shared_post) {
        updatePostInFeed(id.toString(), { shared_post: { ...shared_post, content: targetContent } });
      } else {
        updatePostInFeed(id.toString(), { content: targetContent });
      }
      toast.error("Failed to remove mention. Please try again.");
    }
  };

  // Temporary 'Report submitted' inline snackbar after reporting a post
  // Styled as per Figma: bg-ds-border (#2C2C33) background with ds-text-accent action CTA
  if (isReportSubmitted) {
    return (
      <div className="w-full max-w-[442px] bg-ds-border border border-ds-border rounded-[8px] flex flex-col items-center justify-center p-[8px_12px] gap-[12px] mx-auto mt-[16px] mb-[12px] box-border relative">
        <div className="flex flex-col items-center gap-[8px]">
          <div className="w-[40px] h-[40px] rounded-full border-[2px] border-[var(--ds-success)] flex items-center justify-center shrink-0">
            <Check className="w-[20px] h-[20px] text-[var(--ds-success)]" strokeWidth={3} />
          </div>
          <div className="flex flex-col items-center gap-[4px]">
            <span className="ds-text-body text-ds-text-primary">
              Report submitted
            </span>
            <span className="ds-text-small text-ds-text-primary">
              Thanks for helping us keep Cocpit safe
            </span>
          </div>
        </div>
        <button
          onClick={handleUndoReportUI}
          className="ds-text-small-1 text-ds-accent hover:opacity-80 cursor-pointer bg-transparent border-none p-0"
        >
          Show post
        </button>
      </div>
    );
  }

  // Temporary 'Not interested' inline snackbar
  // Styled as per Figma: 40x40px thumb icon and ds-text-accent 'Undo' button
  if (isNotInterested) {
    return (
      <div className="w-full max-w-[442px] h-[114px] bg-ds-surface-2 border border-ds-border rounded-[8px] flex flex-col items-center justify-center p-[8px_12px] gap-[12px] mx-auto mt-[16px] mb-[12px] box-border">
        <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
          <NotInterestedIcon className="w-[40px] h-[40px] text-ds-text-primary" />
        </div>
        <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-ds-text-primary">
          We'll show you fewer posts like this
        </span>
        <button
          onClick={handleUndoNotInterested}
          className="font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-ds-accent hover:opacity-80 cursor-pointer bg-transparent border-none p-0"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className={`w-full flex flex-col px-4 md:px-0 pt-[16px] pb-[8px] gap-[12px] bg-ds-bg max-w-[442px] mx-auto cursor-pointer ${isInterested ? '' : 'border-b border-ds-border/40'}`}
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
          isMe={isTargetAuthorMe}
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
            isMe={isTargetAuthorMe}
            isCompanyPost={targetIsCompanyPost}
            optionsBtnRef={optionsBtnRef}
            showOptions={showOptions}
            setShowOptions={setShowOptions}
            setOptionsPos={setOptionsPos}
          />

          {/* Body (for non-video and non-poll posts, context sits above media) */}
          {!targetVideoSrc && !pollData && (
            <PostBody
              content={targetContent}
              author={targetAuthor}
              authorSlug={targetAuthorSlug}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
            />
          )}

          {interactionTargetProps.shared_post && (
            <div className="w-full">
              <SharedPreview 
                sharedPost={interactionTargetProps.shared_post} 
                sharedPostId={interactionTargetProps.shared_post.id?.toString() || (interactionTargetProps.shared_post as any).post_id?.toString()}
                isMobile={typeof window !== 'undefined' && window.innerWidth < 768} 
              />
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
              onShowLikes={() => handleOpenLikesModal()}
            />
          )}

          {/* Body (for video posts, context sits below video) */}
          {!!targetVideoSrc && (
            <PostBody
              content={targetContent}
              author={targetAuthor}
              authorSlug={targetAuthorSlug}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
            />
          )}
        </>
      )}

      {/* Poll (if any) */}
      {pollData && (
        <PostPoll
          pollData={pollData}
          postId={id}
          title={props.title || targetTitle || targetContent || (pollData as any)?.question || (pollData as any)?.poll_question}
          isOwner={activeProfile?.type === 'COMPANY' ? Boolean(props.isCompanyPost && activeProfile?.id?.toString() === props.authorId?.toString()) : (currentUserId === props.authorId?.toString())}
          isVoting={isVoting}
          handleVote={(optionId) => handleVote(optionId, isCompany, activeProfile?.id)}
        />
      )}

      {/* Liked By (No Media) */}
      {(!((targetImages && targetImages.length > 0) || !!targetImageSrc || !!targetVideoSrc)) && likeCount > 0 && !(likeCount === 1 && isLiked) && targetSampleLikerUsername && (
        <div 
          className="flex flex-row items-center justify-start gap-[4px] pointer-events-auto px-[4px] mt-[4px] cursor-pointer w-fit hover:opacity-80 transition-opacity"
          onClick={() => handleOpenLikesModal()}
        >
          <span className="text-[12px] font-normal leading-[16px] text-ds-text-primary">
            Liked by{' '}
            <span className="font-semibold text-ds-text-primary hover:underline">
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
        id={targetId}
        isLiked={isLiked}
        likeCount={likeCount}
        handleLike={() => handleLike(isCompany, activeProfile?.id)}
        isCommentSectionOpen={isCommentSectionOpen}
        isCommented={isCommented}
        commentsCount={commentCount}
        handleToggleCommentSection={handleToggleCommentSection}
        shares={shareCount}
        externalShares={externalShareCount}
        handleShare={handleShare}
        handleRepostWithThoughts={handleRepostWithThoughts}
        handleDirectRepost={handleDirectRepost}
        isReposted={isReposted}
        isRepostedWithThoughts={isRepostedWithThoughts}
        isSaved={!!isSaved}
        setIsSaved={setIsSaved}
        handleSaveToggle={() => setIsSaveModalOpen(true)}
        onShowLikes={() => setIsLikesModalOpen(true)}
        isSharedPost={isRepostWithoutThoughts}
        hideRepostWithThoughts={isTargetPostRepostWithThoughts}
      />

      {/* Expandable Sections */}
      {isCommentSectionOpen && (
        <CommentSection
          postId={targetId.toString()}
        />
      )}

      <MobileCommentDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        postId={targetId.toString()}
      />

      {isSaveModalOpen && (
        <SavePostModal
          postId={targetId.toString()}
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSaved={() => setIsSaved(true)}
        />
      )}

      {isLikesModalOpen && (
        <LikesModal
          postId={(selectedLikesPostId || id).toString()}
          isOpen={isLikesModalOpen}
          onClose={() => { setIsLikesModalOpen(false); setSelectedLikesPostId(null); }}
        />
      )}

      {isShareModalOpen && (
        <CocpitShareModel
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={targetId.toString()}
          entityType={isArticlePost ? "article" : "post"}
          entityId={targetId.toString()}
          onShare={(selectedIds) => {
            if (selectedIds.length > 0) {
              incrementExternalShareCount(selectedIds.length);
            }
          }}
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
        isMe={isRepostWithoutThoughts ? false : isTargetAuthorMe}
        onEdit={() => {
          setShowOptions(false);
          if (isArticlePost) {
            router.push(`/article/edit/${id}`);
          } else {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              const { useUIStore } = require('@/store/ui.store');
              useUIStore.getState().setEditMode(true, id.toString());
              useUIStore.getState().setActiveModal('create-post');
            } else {
              props.onEdit?.(props);
            }
          }
        }}
        onMakePrivate={handleToggleVisibility}
        onDelete={handleDelete}
        onReport={() => setIsReportModalOpen(true)}
        onInterested={async () => {
          try {
            await submitPostFeedback({
              item_id: (isRepostWithoutThoughts && targetId ? targetId : id).toString(),
              type: 'INTERESTED',
              session_id: 'default',
              position: 0,
            });
            setIsInterested(true);
            if (interestedTimeoutRef.current) {
              clearTimeout(interestedTimeoutRef.current);
            }
            interestedTimeoutRef.current = setTimeout(() => {
              setIsInterested(false);
            }, 5000);
          } catch (error) {
            toast.error("Failed to submit feedback");
            console.error(error);
          }
        }}
        onNotInterested={async () => {
          try {
            // 1. Instantly hide the post on the backend to guarantee persistence if the user refreshes
            await submitPostFeedback({
              item_id: id.toString(),
              type: 'NOT_INTERESTED',
              session_id: 'default',
              position: 0,
            });
            if (isRepostWithoutThoughts && targetId && targetId !== id) {
              await submitPostFeedback({
                item_id: targetId.toString(),
                type: 'NOT_INTERESTED',
                session_id: 'default',
                position: 0,
              }).catch(() => {});
            }
            // 2. Hide the post content locally and show the temporary snackbar inline
            setIsNotInterested(true);

            // 3. Auto-remove the post from the feed entirely after 3 minutes (180,000ms)
            notInterestedTimeoutRef.current = setTimeout(() => {
              removePostFromFeed(id.toString());
            }, 180000);

          } catch (error) {
            toast.error("Failed to hide post");
            console.error(error);
          }
        }}
        isMentioned={isMentioned}
        onRemoveMention={handleRemoveMention}
        isReported={hasBeenReported}
      />

      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSuccess={handleReportSuccess}
          targetType="POST"
          targetId={(isRepostWithoutThoughts && targetId ? targetId : id).toString()}
        />
      )}
    </div>
      {/* Temporary 'Interested' inline snackbar (40x40px thumb icon as per Figma) */}
      {isInterested && (
        <div className="w-full max-w-[442px] h-[86px] bg-ds-surface-2 border border-ds-border rounded-[8px] flex flex-col items-center justify-center p-[8px_12px] gap-[12px] mx-auto mt-[16px] mb-[12px] box-border">
          <div className="w-[40px] h-[40px] flex items-center justify-center shrink-0">
            <InterestedIcon className="w-[40px] h-[40px] text-ds-text-primary" />
          </div>
          <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-ds-text-primary">
            We'll show you more posts like this
          </span>
        </div>
      )}
    </>
  );
};

export default FeedPost;
