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
import { useUIStore } from '@/store/ui.store';

// New Parts
import { PostHeader } from './parts/PostHeader';
import { PostBody } from './parts/PostBody';
import { PostMedia } from './parts/PostMedia';
import { PostVideoCard } from './parts/PostVideoCard';
import { PostArticle } from './parts/PostArticle';
import { PostActions } from './parts/PostActions';
import { PostPoll } from './parts/PostPoll';
import { PostOptionsMenu } from './parts/PostOptionsMenu';
import { LikeBar } from './parts/LikeBar';
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

  const hasImages = Boolean(
    (targetImageSrc && typeof targetImageSrc === 'string' && targetImageSrc.trim() !== '') ||
    (Array.isArray(targetImages) && targetImages.length > 0)
  );
  const hasVideo = Boolean(targetVideoSrc && typeof targetVideoSrc === 'string' && targetVideoSrc.trim() !== '');
  const hasMedia = hasImages || hasVideo || targetPost_type === 'image' || targetPost_type === 'video';

  const targetIsCompanyPost = interactionTargetProps.isCompanyPost || false;
  const targetAuthorId = interactionTargetProps.authorId || (interactionTargetProps as any).author_id;

  const isTargetAuthorMe = activeProfile?.type === 'COMPANY'
    ? !!(targetIsCompanyPost && activeProfile?.id?.toString() === targetAuthorId?.toString())
    : (currentUserId === targetAuthorId?.toString());

  const {
    isLiked, likeCount, isCommented, isSaved, isReposted, pollData, commentCount, shareCount, externalShareCount,
    isVoting, handleLike, handleVote, setIsSaved, setIsCommented, handleRepostToggle, setShareCount,
    repostId, incrementExternalShareCount, isRepostedWithThoughts,
    incrementCommentCount, decrementCommentCount
  } = usePostInteractions(interactionTargetProps as any);

  const handleIncrementCommentCount = () => {
    incrementCommentCount();
    const currentComments = typeof props.comments === 'string' ? parseInt(props.comments || '0') : (props.comments || 0);
    const newComments = (Math.max(currentComments, commentCount) + 1).toString();
    if (isRepostWithoutThoughts && shared_post) {
      updatePostInFeed(id.toString(), {
        shared_post: { ...shared_post, comments: newComments }
      });
    } else {
      updatePostInFeed(id.toString(), { comments: newComments });
    }
  };

  const handleDecrementCommentCount = () => {
    decrementCommentCount();
    const currentComments = typeof props.comments === 'string' ? parseInt(props.comments || '0') : (props.comments || 0);
    const newComments = Math.max(0, Math.min(currentComments, commentCount) - 1).toString();
    if (isRepostWithoutThoughts && shared_post) {
      updatePostInFeed(id.toString(), {
        shared_post: { ...shared_post, comments: newComments }
      });
    } else {
      updatePostInFeed(id.toString(), { comments: newComments });
    }
  };

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

  // Purpose of Bug Fix: Keep comment section collapsed by default on single post detail view unless comments query parameter or initialShowComments is true
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(
    Boolean(props.initialShowComments)
  );
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(Boolean(props.isFullContent));
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [selectedLikesPostId, setSelectedLikesPostId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Opens the Likes modal for either the target post or an embedded shared post
  const handleOpenLikesModal = (postIdToOpen?: string) => {
    setSelectedLikesPostId(postIdToOpen || targetId.toString());
    setIsLikesModalOpen(true);
  };

  // Purpose of Bug Fix: Read from global UI store to correctly display snackbar on the Feed when redirected from post details page
  const { reportedPostIds, notInterestedPostIds, interestedPostIds, addReportedPostId, addNotInterestedPostId, addInterestedPostId } = useUIStore();

  const isReportedInStore = reportedPostIds.includes(id.toString());
  const isNotInterestedInStore = notInterestedPostIds.includes(id.toString());
  const isInterestedInStore = interestedPostIds.includes(id.toString());

  // --- Report Flow State ---
  // Tracks if the temporary 'Report submitted' UI is currently visible
  const [isReportSubmittedLocal, setIsReportSubmittedLocal] = useState(false);
  const isReportSubmitted = isReportSubmittedLocal || isReportedInStore;
  
  // Tracks if the post was reported during this session (used to show 'Reported' in the options menu if they click 'Show post')
  const [hasBeenReported, setHasBeenReported] = useState(isReportedInStore);

  const { removePostFromFeed } = useFeed(false);
  // Ref to hold the auto-removal timer so we can cancel it if the user clicks 'Show post'
  const reportTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Triggered when the backend successfully saves the report
  const handleReportSuccess = () => {
    setIsReportSubmittedLocal(true);
    setHasBeenReported(true);
    if (props.isFullContent) {
      addReportedPostId(id.toString());
      router.back();
    }
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
    setIsReportSubmittedLocal(false);
    // If we undo from the feed, we also need to clear it from the store if it's there
    if (isReportedInStore) {
        useUIStore.setState((state) => ({ reportedPostIds: state.reportedPostIds.filter(postId => postId !== id.toString()) }));
    }
  };
  // -------------------------


  // --- Not Interested Flow State ---
  // Tracks if the temporary 'Not interested' snackbar is currently visible replacing the post content
  const [isNotInterestedLocal, setIsNotInterestedLocal] = useState(false);
  const isNotInterested = isNotInterestedLocal || isNotInterestedInStore;
  // Ref to hold the auto-removal timer so we can cancel it if the user clicks 'Undo'
  const notInterestedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Interested Flow State ---
  const [isInterestedLocal, setIsInterestedLocal] = useState(false);
  const isInterested = isInterestedLocal || isInterestedInStore;
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
      setIsNotInterestedLocal(false);
      if (isNotInterestedInStore) {
        useUIStore.setState((state) => ({ notInterestedPostIds: state.notInterestedPostIds.filter(postId => postId !== id.toString()) }));
      }
    } catch (error) {
      toast.error("Failed to undo");
    }
  };
  // -------------------------

  const searchParams = useSearchParams();
  useEffect(() => {
    // Purpose of Bug Fix: Do not auto-expand comments on post detail view unless comments flag or commentId is present in URL
    if (searchParams?.get("comments") === "true" || !!searchParams?.get("commentId") || props.initialShowComments) {
      setIsCommentSectionOpen(true);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsMobileDrawerOpen(true);
      }
    }
  }, [searchParams, props.initialShowComments]);


  const optionsBtnRef = useRef<HTMLButtonElement>(null);

  const handleToggleCommentSection = () => {
    if (props.onCommentClickOverride) {
      props.onCommentClickOverride();
      return;
    }
    if (props.isFullContent) {
      setIsCommentSectionOpen(!isCommentSectionOpen);
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
    const postToQuote = (isRepostWithoutThoughts && shared_post) ? shared_post : props;
    props.onRepostWithThoughts?.(postToQuote);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const isVideoFeedCard = Boolean(targetVideoSrc && typeof targetVideoSrc === 'string' && targetVideoSrc.trim() !== '');

  const handlePostClick = (e: React.MouseEvent) => {
    if (props.isFullContent) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
      return;
    }
    router.push(isArticlePost ? `/article/${id}` : `/post/${id}`);
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (props.isFullContent) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('input') || 
      target.closest('textarea') || 
      target.closest('[role="button"]') || 
      target.closest('.prevent-card-click')
    ) {
      return;
    }
    if (targetId && targetId !== 'preview') {
      router.push(`/post/${targetId}`);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={
          props.isFullContent
            ? "w-full max-w-[442px] mx-auto bg-ds-bg flex flex-col gap-[16px] cursor-default box-border"
            : `w-full flex flex-col px-4 md:px-0 pt-[16px] pb-[8px] gap-[12px] bg-ds-bg max-w-[442px] mx-auto cursor-pointer ${isInterested ? '' : 'border-b border-ds-border/40'}`
        }
      >
      {isRepostWithoutThoughts && shared_post && (
        <div className="flex flex-row items-center gap-[8px] h-[12px] text-ds-text-secondary select-none">
          <RepostIcon size={12} className="w-[12px] h-[12px] shrink-0 flex-none text-ds-text-secondary" />
          <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-ds-text-secondary truncate shrink-0 flex-none">
            {props.author} reposted
          </span>
        </div>
      )}

      {props.isFullContent ? (
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

          {/* Full Post Description Text */}
          {targetContent && (
            <PostBody
              content={targetContent}
              author={targetAuthor}
              authorSlug={targetAuthorSlug}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
              hasMedia={hasMedia || isVideoFeedCard}
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

          {/* Media: Video / Article / Images */}
          {isVideoFeedCard ? (
            <PostMedia
              videoSrc={targetVideoSrc}
              mediaWidth={interactionTargetProps.mediaWidth}
              mediaHeight={interactionTargetProps.mediaHeight}
              videoRef={videoRef}
              onLoad={handleMediaLoad}
              tags={targetTags}
              likeCount={likeCount}
              isLiked={isLiked}
              sampleLikerUsername={targetSampleLikerUsername ?? undefined}
              likedUsers={targetLikedUsers}
              viewerUsername={(activeProfile as any)?.account_name || (session?.user as any)?.username}
              onShowLikes={() => handleOpenLikesModal()}
              videoOverlay={false}
            />
          ) : isArticlePost ? (
            <PostArticle
              postId={targetId}
              title={targetTitle}
              coverImage={targetImageSrc || (targetImages && targetImages.length > 0 ? targetImages[0] : null)}
            />
          ) : hasMedia ? (
            <PostMedia
              imageSrc={targetImageSrc}
              images={targetImages}
              mediaWidth={interactionTargetProps.mediaWidth}
              mediaHeight={interactionTargetProps.mediaHeight}
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
              hideOverlayLikeBar={true}
            />
          ) : null}
        </>
      ) : isVideoFeedCard ? (
        <>
          {/* Video post: header & caption rendered INSIDE video via PostMedia overlay */}
          <PostMedia
            videoSrc={targetVideoSrc}
            mediaWidth={interactionTargetProps.mediaWidth}
            mediaHeight={interactionTargetProps.mediaHeight}
            videoRef={videoRef}
            onLoad={handleMediaLoad}
            tags={targetTags}
            likeCount={likeCount}
            isLiked={isLiked}
            sampleLikerUsername={targetSampleLikerUsername ?? undefined}
            likedUsers={targetLikedUsers}
            viewerUsername={(activeProfile as any)?.account_name || (session?.user as any)?.username}
            onShowLikes={() => handleOpenLikesModal()}
            videoOverlay={true}
            overlayHeader={
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
                variant="overlay"
              />
            }
            overlayCaption={targetContent}
          />
        </>
      ) : (
        <>
          {/* Non-video post: header & caption outside media */}
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
          {!pollData && !isArticlePost && (
            <PostBody
              content={targetContent}
              author={targetAuthor}
              authorSlug={targetAuthorSlug}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
              hasMedia={hasMedia}
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
              mediaWidth={interactionTargetProps.mediaWidth}
              mediaHeight={interactionTargetProps.mediaHeight}
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

      {/* Liked By - Shown in full view, when no media (text-only), or for video feed cards */}
      {(props.isFullContent || isVideoFeedCard || !((targetImages && targetImages.length > 0) || !!targetImageSrc || !!targetVideoSrc)) && (
        <LikeBar
          likeCount={likeCount}
          isLiked={isLiked}
          sampleLikerUsername={targetSampleLikerUsername ?? undefined}
          likedUsers={targetLikedUsers}
          viewerUsername={(activeProfile as any)?.account_name || (session?.user as any)?.username}
          onShowLikes={() => handleOpenLikesModal()}
          variant="inline"
        />
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
          isPostOwner={isTargetAuthorMe}
          incrementCommentCount={handleIncrementCommentCount}
          decrementCommentCount={handleDecrementCommentCount}
        />
      )}

      <MobileCommentDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        postId={targetId.toString()}
        isPostOwner={isTargetAuthorMe}
        incrementCommentCount={handleIncrementCommentCount}
        decrementCommentCount={handleDecrementCommentCount}
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
          onConfirm={async () => {
            await confirmDelete();
            if (props.isFullContent) {
              router.push('/feed');
            }
          }}
        />
      )}

      <PostOptionsMenu
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        position={optionsPos}
        isMe={isRepostWithoutThoughts ? false : isTargetAuthorMe}
        isPollPost={!!pollData}
        visibility={targetVisibility}
        onEdit={() => {
          setShowOptions(false);
          if (isArticlePost) {
            router.push(`/article/edit/${id}`);
          } else {
            if (props.onEdit) {
              props.onEdit(props);
            } else {
              useUIStore.getState().setEditMode(true, id.toString(), props);
              
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                useUIStore.getState().setActiveModal('create-post');
              } else {
                router.push('/feed');
              }
            }
          }
        }}
        onMakePrivate={handleToggleVisibility}
        onDelete={handleDelete}
        onReport={() => setIsReportModalOpen(true)}
        onInterested={() => {
          setIsInterestedLocal(true);
          if (props.isFullContent) {
            addInterestedPostId(id.toString());
            router.back();
          }
          if (interestedTimeoutRef.current) {
            clearTimeout(interestedTimeoutRef.current);
          }
          interestedTimeoutRef.current = setTimeout(() => {
            setIsInterestedLocal(false);
            useUIStore.setState((state) => ({ interestedPostIds: state.interestedPostIds.filter(postId => postId !== id.toString()) }));
          }, 5000);

          // Fire API in background
          submitPostFeedback({
            item_id: (isRepostWithoutThoughts && targetId ? targetId : id).toString(),
            type: 'INTERESTED',
            session_id: 'default',
            position: 0,
          }).catch((error) => {
            toast.error("Failed to submit feedback");
            console.error(error);
          });
        }}
        onNotInterested={() => {
          // 1. Hide the post content locally and show the temporary snackbar inline
          setIsNotInterestedLocal(true);
          
          if (props.isFullContent) {
            addNotInterestedPostId(id.toString());
            router.back();
          }

          // 2. Auto-remove the post from the feed entirely after 3 minutes (180,000ms)
          notInterestedTimeoutRef.current = setTimeout(() => {
            removePostFromFeed(id.toString());
          }, 180000);

          // 3. Instantly submit feedback on the backend to guarantee persistence if the user refreshes
          submitPostFeedback({
            item_id: id.toString(),
            type: 'NOT_INTERESTED',
            session_id: 'default',
            position: 0,
          }).catch((error) => {
            toast.error("Failed to hide post");
            console.error(error);
          });
          
          if (isRepostWithoutThoughts && targetId && targetId !== id) {
            submitPostFeedback({
              item_id: targetId.toString(),
              type: 'NOT_INTERESTED',
              session_id: 'default',
              position: 0,
            }).catch(() => {});
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
