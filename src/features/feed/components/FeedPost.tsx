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
import { useQueryClient } from '@tanstack/react-query';
import { useFeed } from '@/hooks/use-feed';
import { saveScrollPosition } from '@/hooks/use-scroll-restoration';
import { feedApi } from '../api/feed.api';
import { unhidePost, submitPostFeedback } from '@/services/api/feed';
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

  const queryClient = useQueryClient();
  const { updatePostInFeed } = useFeed(false);

  const isRepostWithoutThoughts = !!shared_post && (!content || content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;|\u200B|\u00A0|&#8203;|&#160;|&zwnj;/g, '').replace(/\s/g, '').trim() === '');
  const interactionTargetProps = isRepostWithoutThoughts ? { 
    ...props, 
    ...shared_post, 
    id: shared_post.id, 
    repostId: props.repostId || shared_post.repostId, 
    shared_post: shared_post.shared_post,
    authorAvatar: shared_post.authorAvatar ?? undefined,
    authorHeadline: shared_post.authorHeadline ?? undefined,
    authorRole: (shared_post as any).authorRole ?? undefined,
    authorSlug: shared_post.authorSlug ?? undefined,
    location: shared_post.location ?? undefined,
  } : props;
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
  const hasMedia = hasImages || hasVideo || targetPost_type === 'image' || targetPost_type === 'video' || Boolean(interactionTargetProps.shared_post);

  const targetIsCompanyPost = interactionTargetProps.isCompanyPost || false;
  const targetAuthorId = interactionTargetProps.authorId || (interactionTargetProps as any).author_id;

  const isTargetAuthorMe = activeProfile?.type === 'COMPANY'
    ? !!(targetIsCompanyPost && activeProfile?.id?.toString() === targetAuthorId?.toString())
    : (currentUserId === targetAuthorId?.toString());

  // Purpose of Bug Fix: Keep comment section collapsed by default on single post detail view unless comments query parameter or initialShowComments is true
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(
    Boolean(props.initialShowComments)
  );
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Only join post room on the Post Details page or when the comments drawer/section is open
  const shouldManageRoom = Boolean(props.isFullContent) || isCommentSectionOpen || isMobileDrawerOpen;

  const {
    isLiked, likeCount, isCommented, isSaved, isReposted, pollData, commentCount, shareCount, externalShareCount,
    isVoting, handleLike, handleVote, setIsSaved, setIsCommented, handleRepostToggle, setShareCount,
    repostId, incrementExternalShareCount, isRepostedWithThoughts,
    incrementCommentCount, decrementCommentCount
  } = usePostInteractions(interactionTargetProps as any, shouldManageRoom);

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

  // Target ID for reporting:
  // For repost-without-thoughts, targetOriginalId holds the original post's ID.
  // For repost-with-thoughts or original posts, the post's own ID is used.
  const targetOriginalId = shared_post?.id?.toString();
  const reportTargetId = (isRepostWithoutThoughts && targetOriginalId ? targetOriginalId : id).toString();

  const isReportedInStore = isRepostWithoutThoughts
    ? (reportedPostIds.includes(id.toString()) || (!!targetOriginalId && reportedPostIds.includes(targetOriginalId)))
    : reportedPostIds.includes(id.toString());

  const isNotInterestedInStore = notInterestedPostIds.includes(id.toString()) || (!!targetOriginalId && notInterestedPostIds.includes(targetOriginalId));
  const isInterestedInStore = interestedPostIds.includes(id.toString()) || (!!targetOriginalId && interestedPostIds.includes(targetOriginalId));

  const isBackendReported = isRepostWithoutThoughts
    ? (!!props.is_reported || !!(props as any).isReported || !!(shared_post as any)?.is_reported)
    : (!!props.is_reported || !!(props as any).isReported);

  // --- Report Flow State ---
  // Tracks if the temporary 'Report submitted' UI is currently visible
  const [isReportSubmittedLocal, setIsReportSubmittedLocal] = useState(false);
  const isReportSubmitted = isReportSubmittedLocal || isReportedInStore || isBackendReported;

  // Tracks if the post was reported during this session or returned from backend hydration
  const [hasBeenReported, setHasBeenReported] = useState(isReportedInStore || isBackendReported);

  useEffect(() => {
    if (isBackendReported || isReportedInStore) {
      setHasBeenReported(true);
    }
  }, [isBackendReported, isReportedInStore]);

  const { removePostFromFeed } = useFeed(false);
  // Ref to hold the auto-removal timer so we can cancel it if the user clicks 'Show post'
  const reportTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tempViewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (reportTimeoutRef.current) clearTimeout(reportTimeoutRef.current);
      if (tempViewTimeoutRef.current) clearTimeout(tempViewTimeoutRef.current);
    };
  }, []);

  // Triggered when the backend successfully saves the report
  const handleReportSuccess = () => {
    setIsReportSubmittedLocal(true);
    setHasBeenReported(true);
    addReportedPostId(reportTargetId);
    if (props.isFullContent) {
      router.back();
    }
    // Auto-remove the post from the feed entirely after 5 seconds
    reportTimeoutRef.current = setTimeout(() => {
      removePostFromFeed(id.toString());
    }, 5000);
  };

  // State to temporarily show the reported post when user clicks 'Show post'
  const [isTemporarilyShowingReportedPost, setIsTemporarilyShowingReportedPost] = useState(false);

  // Trigger auto-remove if reported from another component (e.g. original post reported, so repost should also auto-remove)
  // or if the backend explicitly tells us it is reported
  useEffect(() => {
    if ((isReportedInStore || isBackendReported) && !isReportSubmittedLocal && !isTemporarilyShowingReportedPost && !reportTimeoutRef.current) {
      reportTimeoutRef.current = setTimeout(() => {
        removePostFromFeed(id.toString());
      }, 5000);
    }
  }, [isReportedInStore, isBackendReported, isReportSubmittedLocal, isTemporarilyShowingReportedPost, id, removePostFromFeed]);

  // Triggered when the user clicks 'Show post' on the success snackbar
  const handleUndoReportUI = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Clear any existing removal timer
    if (reportTimeoutRef.current) {
      clearTimeout(reportTimeoutRef.current);
      reportTimeoutRef.current = null;
    }
    if (tempViewTimeoutRef.current) {
      clearTimeout(tempViewTimeoutRef.current);
      tempViewTimeoutRef.current = null;
    }
    // Temporarily render the actual post UI
    setIsTemporarilyShowingReportedPost(true);
    
    // Auto-remove the post completely from the feed after 5 seconds
    tempViewTimeoutRef.current = setTimeout(() => {
      removePostFromFeed(id.toString());
    }, 5000);
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

  // Purpose of Bug Fix: Auto-clear interestedPostIds from uiStore after 5 seconds if post was marked interested in single view
  useEffect(() => {
    if (isInterestedInStore) {
      const timer = setTimeout(() => {
        useUIStore.setState((state) => ({
          interestedPostIds: state.interestedPostIds.filter(postId => postId !== id.toString() && (!targetOriginalId || postId !== targetOriginalId))
        }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isInterestedInStore, id, targetOriginalId]);

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
        }).catch(() => { });
      }
      // Re-render the actual post UI in its exact position
      setIsNotInterestedLocal(false);
      // Clear both the repost wrapper ID and original post ID from store on undo
      if (isNotInterestedInStore) {
        useUIStore.setState((state) => ({
          notInterestedPostIds: state.notInterestedPostIds.filter(postId => postId !== id.toString() && (!targetOriginalId || postId !== targetOriginalId))
        }));
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
      // Purpose of Bug Fix: Safely extract repost ID from API response, dispatch postCreated to immediately render repost on Feed, and smooth scroll to top
      const createdPostId = result?.postId || result?.post_id || result?.id;
      if (result && createdPostId) {
        try {
          const backendPost = await getPostById(createdPostId);
          const mappedPost = mapBackendPostToFrontend(backendPost);
          window.dispatchEvent(new CustomEvent('postCreated', { detail: mappedPost }));
          toast.success("Post reposted successfully!");
          if (typeof window !== 'undefined' && window.location.pathname === '/feed') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
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
        toast.success("Repost removed successfully");
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

  /* ===== LEGACY POST CLICK (Commented out — replaced by handleCardClick) =====
  const handlePostClick = (e: React.MouseEvent) => {
    if (props.isFullContent) return;

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
      return;
    }
    router.push(isArticlePost ? `/article/${id}` : `/post/${id}`);
  };
  ===== END LEGACY POST CLICK ===== */

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
  // If it was already reported on the backend (e.g. previous session), do not render anything at all.
  if (isBackendReported && !isReportedInStore && !isReportSubmittedLocal && !isTemporarilyShowingReportedPost) {
    return null;
  }

  if (isReportSubmitted && !isTemporarilyShowingReportedPost) {
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
      <div id={`post-${id}`} data-post-id={id} className="w-full max-w-[442px] h-[114px] bg-ds-surface-2 border border-ds-border rounded-[8px] flex flex-col items-center justify-center p-[8px_12px] gap-[12px] mx-auto mt-[16px] mb-[12px] box-border">
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

  const handleSeeMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (targetId && targetId !== 'preview') {
      saveScrollPosition(props.isProfileView ? "profile" : "post", targetId.toString());
      router.push(isArticlePost ? `/article/${targetId}` : `/post/${targetId}`);
    }
  };

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
      // Purpose of Bug Fix: Save scroll position and target post ID/viewport top before navigating to single-view post page
      saveScrollPosition(props.isProfileView ? "profile" : "post", targetId.toString());
      router.push(isArticlePost ? `/article/${targetId}` : `/post/${targetId}`);
    }
  };

  return (
    <>
      <div
        id={`post-${id}`}
        data-post-id={id}
        onClick={handleCardClick}
        className={
          props.isFullContent
            ? "w-full max-w-[442px] mx-auto bg-ds-bg flex flex-col gap-[16px] cursor-default box-border"
            : props.isProfileView
            ? "w-full max-w-[442px] mx-auto flex flex-col gap-[12px] bg-ds-bg cursor-pointer group"
            : `w-full flex flex-col px-4 md:px-0 pt-[16px] pb-[8px] gap-[12px] bg-ds-bg max-w-[442px] mx-auto cursor-pointer ${isInterested ? '' : 'border-b border-[var(--ds-media-border)]'}`
        }
      >
        {isRepostWithoutThoughts && shared_post && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const reposterLink = props.isCompanyPost
                ? `/organization/${props.authorSlug || props.authorId}`
                : `/profile/${props.authorSlug || props.authorId}`;
              if (props.authorSlug || props.authorId) {
                router.push(reposterLink);
              }
            }}
            className="flex flex-row items-center gap-[8px] h-[12px] text-ds-text-secondary select-none cursor-pointer prevent-card-click outline-none"
          >
            <RepostIcon size={12} className="w-[12px] h-[12px] shrink-0 flex-none text-ds-text-secondary" />
            <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-ds-text-secondary truncate shrink-0 flex-none">
              {props.author} reposted
            </span>
          </button>
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
                onSeeMoreClick={props.isProfileView ? handleSeeMoreClick : undefined}
                hasMedia={hasMedia || isVideoFeedCard}
                mentionedUsers={interactionTargetProps.mentioned_users}
              />
            )}

            {interactionTargetProps.shared_post && (
              <div className="w-full">
                <SharedPreview
                  sharedPost={interactionTargetProps.shared_post}
                  sharedPostId={interactionTargetProps.shared_post.id?.toString() || (interactionTargetProps.shared_post as any).post_id?.toString()}
                  isMobile={typeof window !== 'undefined' && window.innerWidth < 768}
                  onSeeMoreClick={props.isProfileView ? handleSeeMoreClick : undefined}
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
                hideOverlayLikeBar={true}
                isFullContent={props.isFullContent}
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
              imageDimensions={(interactionTargetProps as any).imageDimensions}
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
                isFullContent={props.isFullContent}
                isProfileView={props.isProfileView}
              />
            ) : null}
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
                onSeeMoreClick={props.isProfileView ? handleSeeMoreClick : undefined}
                hasMedia={hasMedia}
                mentionedUsers={interactionTargetProps.mentioned_users}
              />
            )}

            {interactionTargetProps.shared_post && (
              <div className="w-full">
                <SharedPreview
                  sharedPost={interactionTargetProps.shared_post}
                  sharedPostId={interactionTargetProps.shared_post.id?.toString() || (interactionTargetProps.shared_post as any).post_id?.toString()}
                  isMobile={typeof window !== 'undefined' && window.innerWidth < 768}
                  onSeeMoreClick={props.isProfileView ? handleSeeMoreClick : undefined}
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
              imageDimensions={(interactionTargetProps as any).imageDimensions}
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
                hideOverlayLikeBar={isVideoFeedCard}
                isFullContent={props.isFullContent}
                isProfileView={props.isProfileView}
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
          onShowLikes={() => handleOpenLikesModal()}
          isSharedPost={isRepostWithoutThoughts}
          hideRepostWithThoughts={isTargetPostRepostWithThoughts}
        />

        {/* Expandable Sections */}
        {isCommentSectionOpen && (
          <div onClick={(e) => e.stopPropagation()} className="prevent-card-click">
            <CommentSection
              postId={targetId.toString()}
              isPostOwner={isTargetAuthorMe}
              incrementCommentCount={handleIncrementCommentCount}
              decrementCommentCount={handleDecrementCommentCount}
            />
          </div>
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
                const updatedCount = externalShareCount + selectedIds.length;

                if (shouldManageRoom) {
                  // Post Details page: WebSocket delivers the exact share count,
                  // so skip local increment. But invalidate the feed query so
                  // the Feed fetches fresh data when the user navigates back.
                  queryClient.invalidateQueries({ queryKey: ['feed'] });
                } else {
                  // Feed page: WebSocket is off, so increment locally for
                  // instant feedback and update the feed cache directly.
                  incrementExternalShareCount(selectedIds.length);
                  const shareUpdate = isRepostWithoutThoughts && shared_post
                    ? { shared_post: { ...shared_post, externalShares: updatedCount } }
                    : { externalShares: updatedCount };
                  updatePostInFeed(id.toString(), shareUpdate);
                }

                // Always notify other components (ProfileAllPostsScreen, etc.)
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("postUpdated", {
                      detail: { id: targetId.toString(), externalShares: updatedCount, external_share_count: updatedCount },
                    })
                  );
                }
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
          triggerRef={optionsBtnRef}
          isMe={isTargetAuthorMe}
          isPollPost={!!pollData}
          visibility={targetVisibility}
          zIndex={props.menuZIndex}
          onEdit={() => {
            setShowOptions(false);
            if (isArticlePost) {
              saveScrollPosition(props.isProfileView ? "profile" : "post", targetId.toString());
              router.push(`/article/edit/${targetId}`);
            } else {
              saveScrollPosition(props.isProfileView ? "profile" : "post", targetId.toString());
              if (props.onEdit) {
                props.onEdit(interactionTargetProps);
              } else {
                useUIStore.getState().setEditMode(true, targetId.toString(), interactionTargetProps as any);
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

            // 2. Auto-remove the post from the feed entirely after 5 seconds
            notInterestedTimeoutRef.current = setTimeout(() => {
              removePostFromFeed(id.toString());
            }, 5000);

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
              }).catch(() => { });
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
