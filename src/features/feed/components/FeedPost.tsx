'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { FeedPostProps } from '../types';
import { usePostInteractions } from '../hooks/use-post-interactions';
import { usePostOptions } from '../hooks/use-post-options';
import { usePostMediaObserver } from '../hooks/use-post-media-observer';
import { trackFeedEvent, hidePost } from '@/services/api/feed';
import { createRepost } from '@/services/api/posts';
import { useToast } from "@/hooks/use-toast";

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

export const FeedPost = (props: FeedPostProps) => {
  const { id, author, authorAvatar, imageSrc, videoSrc, content, timeAgo, visibility, isProfileView, shared_post, poll, isCompanyPost, location, tags, sampleLikerUsername, category, title, articleBody } = props;
  const { activeProfile, isCompany } = useActiveProfile();
  const router = useRouter();
  const isArticlePost = category === 'Article' || Boolean(articleBody) || props.post_type === 'article';
  const isArticleFeedCard = isArticlePost && !props.isFullContent;

  // Custom Hooks
  const { updatePostInFeed } = useFeed(false);
  const { toast } = useToast();

  const {
    isLiked, likeCount, isCommented, isSaved, pollData, isVoting, commentCount, shareCount,
    handleLike, handleVote, setIsSaved, setIsCommented, incrementCommentCount, decrementCommentCount, incrementShareCount
  } = usePostInteractions(props);

  const {
    showOptions, setShowOptions, optionsPos, setOptionsPos,
    isEditModalOpen, setIsEditModalOpen, isReportModalOpen, setIsReportModalOpen,
    handleToggleVisibility, handleDelete
  } = usePostOptions(props, (id, data) => {
    updatePostInFeed(id.toString(), data);
  });

  const { videoRef, finalAspectRatio, isVerticalVideo, handleMediaLoad } = usePostMediaObserver(id, videoSrc, props.aspectRatio);

  // Local UI State
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(props.initialShowComments || false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPollAnalytics, setShowPollAnalytics] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const optionsBtnRef = useRef<HTMLButtonElement>(null);

  const handleToggleCommentSection = () => {
    if (window.innerWidth < 768) {
      setIsMobileDrawerOpen(true);
    } else {
      setIsCommentSectionOpen(!isCommentSectionOpen);
    }
  };

  const handleDirectRepost = async () => {
    try {
      await createRepost(id.toString());
      incrementShareCount();
      toast({ title: "Reposted!" });
    } catch (error) {
      toast({ title: "Error reposting", variant: "destructive" });
    }
  };

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
      duration: 5000,
    });

    hideTimeoutRef.current = setTimeout(() => {
      if (props.sessionId) {
        hidePost({
          item_id: id.toString(),
          session_id: props.sessionId,
          position: props.position || 0
        }).catch(console.error);
      }
    }, 5000);
  };

  if (isHidden) return null;

  return (
    <div
      ref={feedCardRef}
      onClick={handleCardClick}
      className={`feed-card-shell flex w-full flex-col gap-[16px] overflow-hidden py-[16px] ${isArticleFeedCard ? 'cursor-pointer' : ''}`}
    >
      {/* Header & Content (Frame 2608598) */}
      <div className="flex flex-col gap-[16px] px-[16px]">
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

        <PostContent
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
        />
      </div>

      {/* Media (Rectangle 14) */}
      {!isArticlePost && (
        <div className="mt-[-16px]">
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
          />
        </div>
      )}

      {/* Poll */}
      <PostPoll
        pollData={pollData}
        isVoting={isVoting}
        handleVote={(optId) => handleVote(optId, isCompany, activeProfile?.id)}
      />

      {/* Social Proof & Actions (Frame 2608624 & 2608574) */}
      {likeCount > 0 && !(likeCount === 1 && isLiked) ? (
        <div className="flex flex-col mt-[-16px]">
          {/* Social Proof (Frame 2608624) */}
          <div className="px-[16px] h-[20px] flex items-center mt-2">
            <p className="text-[12px] leading-[16px] font-[family-name:var(--font-poppins)] font-normal text-foreground">
              Liked by @{sampleLikerUsername || 'someone'}
              {likeCount > 1 && (
                <> and {likeCount - 1} {likeCount - 1 === 1 ? 'other' : 'others'}</>
              )}
            </p>
          </div>

          <div className="mt-4">
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
              isSaved={isSaved || false}
              setIsSaved={setIsSaved}
              handleSaveToggle={() => setIsSaveModalOpen(true)}
            />
          </div>
        </div>
      ) : (
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
          isSaved={isSaved || false}
          setIsSaved={setIsSaved}
          handleSaveToggle={() => setIsSaveModalOpen(true)}
        />
      )}

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
        <CreatePostModal
          isOpen={true}
          onClose={() => setIsEditModalOpen(false)}
          editPostId={id.toString()}
          onUpdate={(updatedPost) => {
            updatePostInFeed(id.toString(), updatedPost);
          }}
        />
      )}
    </div>
  );
};

export default FeedPost;
