'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { FeedPostProps } from '../types';
import { usePostInteractions } from '../hooks/use-post-interactions';
import { usePostOptions } from '../hooks/use-post-options';
import { usePostMediaObserver } from '../hooks/use-post-media-observer';
import { trackFeedEvent, hidePost } from '@/services/api/feed';
import { createRepost, deletePost, getPostById } from '@/services/api/posts';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { useToast } from "@/hooks/use-toast";
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';

// Parts
import { PostHeader } from './parts/PostHeader';
import { PostContent } from './parts/PostContent';
import { PostMedia } from './parts/PostMedia';
import { PostActions } from './parts/PostActions';
import { PostPoll } from './parts/PostPoll';
import { useFeed } from '@/hooks/use-feed';


// Lazy loaded modals and sections
const CommentSection = dynamic(() => import('./comments/CommentSection'), { ssr: false });
const MobileCommentDrawer = dynamic(() => import('./comments/MobileCommentDrawer'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/shared/ReportModal').then(m => m.ReportModal), { ssr: false });
const PollAnalyticsModal = dynamic(() => import('@/components/home/PollAnalyticsModal').then(m => m.PollAnalyticsModal), { ssr: false });
const CocpitShareModel = dynamic(() => import('@/shared/commonComponents/cocpitsharemodel'), { ssr: false });
const SavePostModal = dynamic(() => import('@/components/settings/SavePostModal').then(m => m.SavePostModal), { ssr: false });
const CreatePostModal = dynamic(() => import('@/shared/commonComponents/CreatePostModal').then(m => m.CreatePostModal), { ssr: false });
const EditPostModal = dynamic(() => import('@/shared/commonComponents/EditPostModal').then(m => m.EditPostModal), { ssr: false });
const DeleteConfirmationModal = dynamic(() => import('@/components/shared/DeleteConfirmationModal').then(m => m.DeleteConfirmationModal), { ssr: false });
const LikesModal = dynamic(() => import('./LikesModal').then(m => m.LikesModal), { ssr: false });

export const FeedPost = (props: FeedPostProps) => {
  const { id, author, authorAvatar, imageSrc, videoSrc, content, timeAgo, visibility, isProfileView, shared_post, poll, isCompanyPost, location, tags, sampleLikerUsername, category, title, articleBody, imageFit, forceSquareMedia, likedUsers } = props;
  const { activeProfile, isCompany } = useActiveProfile();
  const { data: session } = useSession();
  const router = useRouter();
  const isArticlePost = category === 'Article' || props.post_type === 'article';
  const isArticleFeedCard = isArticlePost && !props.isFullContent;

  // Custom Hooks
  const { updatePostInFeed, addPost } = useFeed(false);
  const { toast } = useToast();

  const {
    isLiked, likeCount, isCommented, isSaved, isReposted, pollData, isVoting, commentCount, shareCount,
    handleLike, handleVote, setIsSaved, setIsCommented, setIsReposted, incrementCommentCount, decrementCommentCount, incrementShareCount, handleRepostToggle, setShareCount,
    repostId, setRepostId
  } = usePostInteractions(props);

  const {
    showOptions, setShowOptions, optionsPos, setOptionsPos,
    isEditModalOpen, setIsEditModalOpen, isReportModalOpen, setIsReportModalOpen,
    isDeleteDialogOpen, setIsDeleteDialogOpen, confirmDelete,
    handleToggleVisibility, handleDelete
  } = usePostOptions(props, (id, data) => {
    updatePostInFeed(id.toString(), data);
  });

  const { videoRef, finalAspectRatio, isVerticalVideo, handleMediaLoad } = usePostMediaObserver(id, videoSrc, props.aspectRatio);

  // Local UI State
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(
    props.initialShowComments || props.isFullContent || false
  );
  const searchParams = useSearchParams();

  useEffect(() => {
    if (props.isFullContent || searchParams?.get("comments") === "true" || !!searchParams?.get("commentId") || props.initialShowComments) {
      setIsCommentSectionOpen(true);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsMobileDrawerOpen(true);
      }
    }
  }, [searchParams, props.isFullContent, props.initialShowComments]);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPollAnalytics, setShowPollAnalytics] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const optionsBtnRef = useRef<HTMLButtonElement>(null);
  const [showInnerOptions, setShowInnerOptions] = useState(false);
  const [innerOptionsPos, setInnerOptionsPos] = useState<{ top: number; right: number } | null>(null);
  const innerOptionsBtnRef = useRef<HTMLButtonElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [captionFocused, setCaptionFocused] = useState(false);

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showOptions) {
      const rect = optionsBtnRef.current?.getBoundingClientRect();
      if (rect) {
        setOptionsPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
      }
    }
    setShowOptions(!showOptions);
  };

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

  const [isUndoRepostConfirmOpen, setIsUndoRepostConfirmOpen] = useState(false);

  const handleDirectRepost = async () => {
    if (isReposted) {
      setIsUndoRepostConfirmOpen(true);
    } else {
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
      } catch (error: any) {
        toast({ title: "Error updating repost", variant: "destructive" });
      }
    }
  };

  const confirmUndoRepost = () => {
    setIsUndoRepostConfirmOpen(false);
    if (repostId) {
      const targetRepostId = repostId;
      setIsReposted(false);
      setShareCount(prev => Math.max(0, prev - 1));
      setRepostId(null);
      try {
        updatePostInFeed(id.toString(), { isReposted: false, shares: Math.max(0, shareCount - 1).toString(), repostId: null });
      } catch (feedErr) {
        console.warn("Failed to update feed cache:", feedErr);
      }
      window.dispatchEvent(new CustomEvent('repostDeleted', { detail: { originalPostId: id, repostId: targetRepostId } }));
      if (props.onDelete) {
        Promise.resolve(props.onDelete(targetRepostId)).catch((err) => {
          console.error("Background onDelete failed:", err);
        });
      } else {
        deletePost(targetRepostId).catch((err) => {
          console.error("Background deletePost failed:", err);
        });
      }
      toast({ title: "Repost removed successfully", variant: "default" });
    }
  };

  useEffect(() => {
    const handlePostCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newPost = customEvent.detail;
      if (newPost && newPost.shared_post?.id?.toString() === id.toString()) {
        setIsReposted(true);
        setRepostId(newPost.id.toString());
        setShareCount(prev => prev + 1);
        try {
          updatePostInFeed(id.toString(), { 
            isReposted: true, 
            shares: (shareCount + 1).toString(), 
            repostId: newPost.id.toString() 
          });
        } catch (feedErr) {
          console.warn("Failed to update feed cache:", feedErr);
        }
      }
    };

    const handleRepostDeleted = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { originalPostId } = customEvent.detail;
      if (originalPostId?.toString() === id.toString() && isReposted) {
        setIsReposted(false);
        setRepostId(null);
        setShareCount(prev => Math.max(0, prev - 1));
        try {
          updatePostInFeed(id.toString(), { 
            isReposted: false, 
            shares: Math.max(0, shareCount - 1).toString(), 
            repostId: null 
          });
        } catch (feedErr) {
          console.warn("Failed to update feed cache:", feedErr);
        }
      }
    };

    window.addEventListener('postCreated', handlePostCreated);
    window.addEventListener('repostDeleted', handleRepostDeleted);
    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('repostDeleted', handleRepostDeleted);
    };
  }, [id, shareCount, isReposted, updatePostInFeed, setIsReposted, setRepostId, setShareCount]);

  const feedCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!props.sessionId || !feedCardRef.current) return;

    let enterTime = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          enterTime = Date.now();
        } else if (enterTime > 0) {
          const dwell_ms = Date.now() - enterTime;
          if (dwell_ms > 1500) {
            trackFeedEvent({
              event_type: 'impression',
              item_id: id,
              item_type: props.isJob ? 'job' : 'post',
              session_id: props.sessionId!,
              position: props.position ?? 0,
              dwell_ms,
              context: 'home',
              metadata: { slot_type: props.slotType, score: props.rankingScore }
            }).catch(() => { });
          }
          enterTime = 0;
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(feedCardRef.current);
    return () => observer.disconnect();
  }, [id, props.sessionId, props.position, props.slotType, props.rankingScore, props.isJob]);

  useEffect(() => {
    if (props.initialShowComments && feedCardRef.current) {
      setTimeout(() => {
        feedCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [props.initialShowComments]);

  // Click tracking
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="menu"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="dialog"]') ||
      target.closest('[data-radix-popper-content-wrapper]')
    ) {
      return;
    }

    if (props.sessionId) {
      trackFeedEvent({
        event_type: 'click',
        item_id: id,
        item_type: props.isJob ? 'job' : 'post',
        session_id: props.sessionId,
        position: props.position ?? 0,
        context: 'home'
      }).catch(() => { });
    }

    if (isArticleFeedCard) {
      router.push(`/post/${id}`);
    }
  };

  const handleNotInterested = () => {
    setIsHidden(true);

    toast({
      title: "Post hidden",
      description: "We'll show fewer posts like this.",
      action: (
        <button
          onClick={() => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            setIsHidden(false);
          }}
          className="bg-transparent text-primary hover:underline text-sm font-medium"
        >
          Undo
        </button>
      ),
      duration: 3000,
    });

    hideTimeoutRef.current = setTimeout(() => {
      hidePost({
        item_id: id.toString(),
        session_id: props.sessionId || 'unknown',
        position: props.position || 0
      }).catch(console.error);
    }, 3000);
  };

  if (isHidden) return null;

  // Safeguard: If the post has no content, no media, no poll, and no shared content/job, do not render it.
  const hasContent = !!(content && content.trim() !== '');
  const hasMedia = !!(imageSrc || videoSrc || props.images?.length);
  const hasPoll = !!poll;
  const hasSharedPost = !!shared_post;
  const hasSharedJob = !!props.isJob;
  if (!hasContent && !hasMedia && !hasPoll && !hasSharedPost && !hasSharedJob && !isArticlePost) {
    return null;
  }

  const isRepostWithoutThoughts = !!shared_post && (!content || content.trim() === '');

  return (
    <div
      ref={feedCardRef}
      onClick={handleCardClick}
      className={`feed-card-shell flex w-full max-w-[560px] max-md:!max-w-full flex-col gap-[8px] overflow-hidden h-full ${isArticleFeedCard ? 'cursor-pointer' : ''}`}
    >
      {isRepostWithoutThoughts ? (
        <>
          {/* Repost Header Row */}
          <div className="flex flex-row justify-between items-center px-4 md:px-0 w-full h-[32px] mt-2 mb-1 select-none">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[12px] font-normal font-poppins">
              <Icon icon="lucide:repeat" className="w-4 h-4 text-[#6B7280]" style={{ strokeWidth: '1.5px' }} />
              <Link 
                href={props.isCompanyPost ? `/organization/${props.authorSlug}` : `/profile/${props.authorSlug || props.authorId}`}
                className="text-[#6B7280] font-medium hover:underline font-[family-name:var(--font-poppins)] text-[12px] leading-[16px]"
                onClick={(e) => e.stopPropagation()}
              >
                {author}
              </Link>
              <span className="text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] text-[12px] leading-[16px] text-center">reposted</span>
            </div>
            <div className="relative">
              <button
                ref={optionsBtnRef}
                onClick={handleOptionsClick}
                className="text-[#000000] p-1"
              >
                <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
              </button>
              {showOptions && optionsPos && typeof document !== 'undefined' && createPortal(
                <>
                  <div className="fixed inset-0 z-[199]" onClick={(e) => { e.stopPropagation(); setShowOptions(false); }} />
                  <div
                    className="fixed w-[180px] p-2 bg-card border border-[#EEF2FF] dark:border-card-border-inner rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg z-[200]"
                    style={{ top: optionsPos.top, right: optionsPos.right }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {props.isOwnPost && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleVisibility(); }}
                          className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-[#EEF2FF] hover:text-[#6366F1] focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors group"
                        >
                          <span className="text-[14px] font-[family-name:var(--font-poppins)] text-black dark:text-white group-hover:text-[#6366F1] group-focus:text-[#6366F1]">
                            {visibility === 'private' ? 'Make public' : 'Make private'}
                          </span>
                          {visibility === 'private' ? (
                            <Icon icon="hugeicons:view" className="w-6 h-6 text-black dark:text-white group-hover:text-[#6366F1] group-focus:text-[#6366F1]" />
                          ) : (
                            <Icon icon="hugeicons:view-off-slash" className="w-6 h-6 text-black dark:text-white group-hover:text-[#6366F1] group-focus:text-[#6366F1]" />
                          )}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                          className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-red-50 focus:bg-red-50 text-[#FF6B6B] rounded-xl outline-none transition-colors"
                        >
                          <span className="text-[14px] font-[family-name:var(--font-poppins)]">Delete repost</span>
                          <Icon icon="hugeicons:delete-02" className="w-6 h-6 text-[#FF6B6B]" style={{ strokeWidth: '1.5px' }} />
                        </button>
                      </div>
                    )}
                    {!props.isOwnPost && (
                      <button
                        onClick={() => { setIsReportModalOpen(true); setShowOptions(false); }}
                        className="flex items-center justify-between w-full px-4 py-2 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-3xl outline-none transition-colors"
                      >
                        <span className="text-sm font-normal font-poppins text-foreground">Report repost</span>
                        <Icon icon="mdi:information-outline" className="w-6 h-6 text-foreground" />
                      </button>
                    )}
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-border mx-auto px-4 md:px-0">
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Original Post Header */}
          <div className={`flex flex-col gap-[8px] ${isProfileView ? 'px-4' : 'px-4 md:px-0'}`}>
            <PostHeader
              {...props}
              shared_post={null}
              id={shared_post.id}
              author={shared_post.author}
              authorId={shared_post.authorId}
              authorAvatar={shared_post.authorAvatar}
              authorSlug={shared_post.authorSlug}
              timeAgo={shared_post.timeAgo || timeAgo}
              visibility="public"
              isMe={shared_post.authorId?.toString() === activeProfile?.id?.toString()}
              isOwnPost={shared_post.authorId?.toString() === activeProfile?.id?.toString()}
              isCompanyPost={shared_post.isCompanyPost || false}
              location={shared_post.location}
              tags={shared_post.tags || []}
              authorRole={shared_post.authorHeadline || shared_post.title || undefined}
              optionsBtnRef={innerOptionsBtnRef}
              showOptions={showInnerOptions}
              setShowOptions={setShowInnerOptions}
              optionsPos={innerOptionsPos}
              setOptionsPos={setInnerOptionsPos}
              onEdit={() => { }}
              onDelete={() => { }}
              onToggleVisibility={() => { }}
              onShowAnalytics={() => { }}
              onReport={() => setIsReportModalOpen(true)}
              onNotInterested={handleNotInterested}
              hideOptions={true}
            />
          </div>

          <div className={`flex flex-col gap-[8px] ${isProfileView ? 'px-4' : 'px-4 md:px-0'}`}>
            <PostContent
              isCarouselView={forceSquareMedia}
              content={shared_post.content}
              author={shared_post.author}
              authorSlug={shared_post.authorSlug}
              isExpanded={isExpanded}
              isFullContent={props.isFullContent}
              shared_post={null}
              isProfileView={isProfileView}
              postId={shared_post.id}
              location={shared_post.location}
              timeAgo={shared_post.timeAgo || timeAgo}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
              category={shared_post.category}
              title={shared_post.title}
              articleBody={shared_post.articleBody}
              imageSrc={shared_post.imageSrc}
              authorAvatar={shared_post.authorAvatar}
              postType={shared_post.post_type}
            />
          </div>

          {/* Media */}
          {shared_post.imageSrc || shared_post.videoSrc || (shared_post.images && shared_post.images.length > 0) ? (
            <div className={`mt-0`}>
              <PostMedia
                imageSrc={shared_post.imageSrc}
                images={shared_post.images}
                videoSrc={shared_post.videoSrc}
                videoRef={videoRef}
                aspectRatio={finalAspectRatio}
                onLoad={handleMediaLoad}
                priority={props.priority}
                isVerticalVideo={isVerticalVideo}
                hasNoCaption={!shared_post.content}
                achievementTitle={shared_post.achievementImageTitle}
                imageFit={imageFit}
                forceSquare={forceSquareMedia}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/post/${shared_post.id}`);
                }}
              />
            </div>
          ) : null}

          {/* Poll */}
          {shared_post.poll && (
            <div className="w-full px-4 md:px-0">
              <PostPoll
                pollData={pollData}
                isVoting={isVoting}
                handleVote={(optId) => handleVote(optId, isCompany, activeProfile?.id)}
                title={shared_post.title}
              />
            </div>
          )}
        </>
      ) : videoSrc && !props.isFullContent ? (
        <>
          {/* NEW VIDEO FEED CARD DESIGN */}
          <div 
            className="relative w-full max-w-[560px] max-h-[500px] rounded-[24px] overflow-hidden bg-black flex-shrink-0 cursor-pointer shadow-sm group transition-all duration-300"
            style={{ aspectRatio: finalAspectRatio || '16/9' }}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              loop
              playsInline
              onLoadedMetadata={handleMediaLoad}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="absolute inset-0 w-full h-full object-cover"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />
            
            {/* Click Interceptor for Video */}
            <div 
              className="absolute inset-0 z-0 pointer-events-auto"
              onClick={(e) => {
                 e.stopPropagation();
                 if (captionFocused) {
                    setCaptionFocused(false);
                    videoRef.current?.play();
                    return;
                 }
                 router.push(`/post/${id}`);
              }}
            />

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-auto">
              <PostHeader
                {...props}
                isMe={props.isOwnPost || false}
                author={author}
                timeAgo={timeAgo}
                visibility={visibility || 'public'}
                optionsBtnRef={optionsBtnRef}
                showOptions={showOptions}
                setShowOptions={setShowOptions}
                optionsPos={optionsPos}
                setOptionsPos={setOptionsPos}
                onEdit={() => setIsEditModalOpen(true)}
                onDelete={handleDelete}
                onToggleVisibility={handleToggleVisibility}
                onShowAnalytics={() => setShowPollAnalytics(true)}
                onReport={() => setIsReportModalOpen(true)}
                onNotInterested={handleNotInterested}
                location={location}
                tags={tags}
                authorRole={props.authorHeadline || undefined}
                variant="overlay"
              />
            </div>
            
            {/* Caption Overlay */}
            <div 
              className={`absolute bottom-0 left-0 w-full p-4 z-10 pointer-events-auto rounded-b-[24px] transition-all duration-300 ${captionFocused ? 'opacity-100 bg-black/40 backdrop-blur-sm' : 'opacity-70 hover:opacity-90'}`}
              onClick={(e) => {
                 e.stopPropagation();
                 if (!captionFocused) {
                    setCaptionFocused(true);
                    videoRef.current?.pause();
                 }
              }}
            >
              <PostContent
                isCarouselView={forceSquareMedia}
                content={content}
                author={author}
                isExpanded={isExpanded}
                isFullContent={props.isFullContent}
                shared_post={shared_post}
                sharedPollData={shared_post?.poll}
                isProfileView={isProfileView}
                postId={id}
                location={location}
                timeAgo={timeAgo}
                onToggleExpand={() => setIsExpanded(!isExpanded)}
                category={category}
                title={title}
                articleBody={articleBody}
                imageSrc={imageSrc}
                authorAvatar={authorAvatar}
                authorSlug={props.authorSlug}
                postType={props.post_type}
                variant="overlay"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className={`flex flex-col gap-[8px] ${isProfileView ? 'px-4 pt-4' : 'px-4 md:px-0'}`}>
            <PostHeader
              {...props}
              isMe={props.isOwnPost || false}
              author={author}
              timeAgo={timeAgo}
              visibility={visibility || 'public'}
              optionsBtnRef={optionsBtnRef}
              showOptions={showOptions}
              setShowOptions={setShowOptions}
              optionsPos={optionsPos}
              setOptionsPos={setOptionsPos}
              onEdit={() => {
                if (isArticlePost) {
                  router.push(`/article/edit/${id}`);
                } else {
                  setIsEditModalOpen(true);
                }
              }}
              onDelete={handleDelete}
              onToggleVisibility={handleToggleVisibility}
              onShowAnalytics={() => setShowPollAnalytics(true)}
              onReport={() => setIsReportModalOpen(true)}
              onNotInterested={handleNotInterested}
              location={location}
              tags={tags}
              authorRole={props.authorHeadline || undefined}
            />
          </div>

          <div className={`flex flex-col gap-[8px] ${isProfileView ? 'px-4' : 'px-4 md:px-0'}`}>
            <PostContent
              isCarouselView={forceSquareMedia}
              content={content}
              author={author}
              isExpanded={isExpanded}
              isFullContent={props.isFullContent}
              shared_post={shared_post}
              sharedPollData={shared_post?.poll}
              isProfileView={isProfileView}
              postId={id}
              location={location}
              timeAgo={timeAgo}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
              category={category}
              title={title}
              articleBody={articleBody}
              imageSrc={imageSrc}
              authorAvatar={authorAvatar}
              authorSlug={props.authorSlug}
              postType={props.post_type}
            />
          </div>

          {/* Media (Rectangle 14) */}
          {!isArticlePost && (
            <div className={`mt-0`}>
              <PostMedia
                imageSrc={imageSrc}
                images={props.images}
                videoSrc={videoSrc}
                videoRef={videoRef}
                aspectRatio={finalAspectRatio}
                onLoad={handleMediaLoad}
                priority={props.priority}
                isVerticalVideo={isVerticalVideo}
                hasNoCaption={!content && !shared_post}
                achievementTitle={props.achievementImageTitle}
                imageFit={imageFit}
                forceSquare={forceSquareMedia}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/post/${id}`);
                }}
              />
            </div>
          )}

          <div className="w-full px-4 md:px-0">
            <PostPoll
              pollData={pollData}
              isVoting={isVoting}
              handleVote={(optId) => handleVote(optId, isCompany, activeProfile?.id)}
              title={title}
            />
          </div>
        </>
      )}

      {/* Social Proof & Actions */}
      <div className="flex flex-col gap-[8px] px-4 md:px-0 mt-auto pb-2">
        {(forceSquareMedia || (likeCount > 0 && !(likeCount === 1 && isLiked) && sampleLikerUsername)) && (
          <div className={`flex items-center ${forceSquareMedia ? 'min-h-[16px]' : ''}`}>
            {likeCount > 0 && !(likeCount === 1 && isLiked) && sampleLikerUsername && (
              <p className="text-[12px] leading-[16px] font-[family-name:var(--font-poppins)] font-normal text-foreground">
              Liked by{" "}
              <span 
                className="font-semibold cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (sampleLikerUsername) {
                    router.push(`/profile/${sampleLikerUsername}`);
                  }
                }}
              >
                @{sampleLikerUsername || 'someone'}
              </span>
              {likeCount > 1 && (
                <>
                  {" "}and{" "}
                  <span 
                    className="font-semibold cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLikesModalOpen(true);
                    }}
                  >
                    {likeCount - 1} {likeCount - 1 === 1 ? 'other' : 'others'}
                  </span>
                </>
              )}
            </p>
            )}
          </div>
        )}

        <div>
          <PostActions
            id={id}
            isLiked={isLiked}
            likeCount={likeCount}
            handleLike={() => handleLike(isCompany, activeProfile?.id)}
            isCommentSectionOpen={isCommentSectionOpen}
            isMobileDrawerOpen={isMobileDrawerOpen}
            isCommented={isCommented}
            commentsCount={commentCount}
            handleToggleCommentSection={handleToggleCommentSection}
            shares={shareCount}
            handleShare={() => setIsShareModalOpen(true)}
            handleRepostWithThoughts={() => setIsRepostModalOpen(true)}
            handleDirectRepost={handleDirectRepost}
            isReposted={isReposted || false}
            isSaved={isSaved || false}
            setIsSaved={setIsSaved}
            handleSaveToggle={() => setIsSaveModalOpen(true)}
            onShowLikes={() => setIsLikesModalOpen(true)}
            isSharedPost={!!shared_post}
          />
        </div>
      </div>

      {/* Lazy Modals */}
      {isCommentSectionOpen && (
        <CommentSection
          postId={id.toString()}
          isPostOwner={props.isOwnPost}
          incrementCommentCount={incrementCommentCount}
          decrementCommentCount={decrementCommentCount}
        />
      )}

      {isMobileDrawerOpen && (
        <MobileCommentDrawer
          postId={id.toString()}
          isOpen={isMobileDrawerOpen}
          isPostOwner={props.isOwnPost}
          onClose={() => setIsMobileDrawerOpen(false)}
          incrementCommentCount={incrementCommentCount}
          decrementCommentCount={decrementCommentCount}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="POST"
          targetId={id.toString()}
        />
      )}

      {showPollAnalytics && (
        <PollAnalyticsModal
          isOpen={showPollAnalytics}
          onClose={() => setShowPollAnalytics(false)}
          postId={id.toString()}
        />
      )}

      {isUndoRepostConfirmOpen && (
        <DeleteConfirmationModal
          isOpen={isUndoRepostConfirmOpen}
          onClose={() => setIsUndoRepostConfirmOpen(false)}
          onConfirm={confirmUndoRepost}
          title="Delete Repost"
          description="Are you sure you want to delete this repost?"
        />
      )}

      {isShareModalOpen && (
        <CocpitShareModel
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          postId={id.toString()}
          onShare={() => {
            incrementShareCount();
          }}
        />
      )}

      {isSaveModalOpen && (
        <SavePostModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          postId={id.toString()}
          onSaved={setIsSaved}
        />
      )}

      {isRepostModalOpen && (
        <CreatePostModal
          isOpen={true}
          onClose={() => setIsRepostModalOpen(false)}
          sharedPostId={id.toString()}
          onPostCreated={() => {
            incrementShareCount();
            setIsRepostModalOpen(false);
          }}
        />
      )}

      {isEditModalOpen && (
        <EditPostModal
          isOpen={true}
          onClose={() => setIsEditModalOpen(false)}
          editPostId={id.toString()}
          onUpdate={(updatedPost) => {
            updatePostInFeed(id.toString(), updatedPost);
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

      {isLikesModalOpen && (
        <LikesModal
          isOpen={isLikesModalOpen}
          onClose={() => setIsLikesModalOpen(false)}
          postId={id.toString()}
        />
      )}
    </div>
  );
};

export default FeedPost;
