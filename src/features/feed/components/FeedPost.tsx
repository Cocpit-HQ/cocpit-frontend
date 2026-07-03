'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { FeedPostProps } from '../types';
import { usePostInteractions } from '../hooks/use-post-interactions';
import { usePostOptions } from '../hooks/use-post-options';
import { usePostMediaObserver } from '../hooks/use-post-media-observer';
import { trackFeedEvent, hidePost } from '@/services/api/feed';
import { createRepost } from '@/services/api/posts';
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
  const { id, author, authorAvatar, imageSrc, videoSrc, content, timeAgo, visibility, isProfileView, shared_post, poll, isCompanyPost, location, tags, sampleLikerUsername, category, title, articleBody } = props;
  const { activeProfile, isCompany } = useActiveProfile();
  const router = useRouter();
  const isArticlePost = category === 'Article' || props.post_type === 'article';
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
    if (props.isFullContent || searchParams?.get("comments") === "true" || !!searchParams?.get("commentId")) {
      setIsCommentSectionOpen(true);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsMobileDrawerOpen(true);
      }
    }
  }, [searchParams, props.isFullContent]);
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
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast({ title: "You have already reposted this post." });
      } else {
        toast({ title: "Error reposting", variant: "destructive" });
      }
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
      className={`feed-card-shell flex w-full max-w-[560px] flex-col gap-[8px] overflow-hidden ${isArticleFeedCard ? 'cursor-pointer' : ''}`}
    >
      {isRepostWithoutThoughts ? (
        <>
          {/* Repost Header Row */}
          <div className="flex flex-row justify-between items-center px-4 md:px-0 w-full h-[32px] mt-2 mb-1 select-none">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[12px] font-normal font-poppins">
              <Icon icon="lucide:repeat" className="w-4 h-4 text-[#6B7280]" style={{ strokeWidth: '1.5px' }} />
              <span className="text-[#6B7280] font-normal font-[family-name:var(--font-poppins)] text-[12px] leading-[16px] text-center">{author} reposted</span>
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

          {/* Original Post Header & Content */}
          <div className="flex flex-col gap-[8px] px-4 md:px-0">
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
              onEdit={() => {}}
              onDelete={() => {}}
              onToggleVisibility={() => {}}
              onShowAnalytics={() => {}}
              onReport={() => setIsReportModalOpen(true)}
              onNotInterested={handleNotInterested}
              hideOptions={true}
            />

            <PostContent
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
            />
          </div>

          {/* Media */}
          {shared_post.imageSrc || shared_post.videoSrc || (shared_post.images && shared_post.images.length > 0) ? (
            <div className="mt-0">
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
      ) : (
        <>
          {/* Header & Content (Frame 2608598) */}
          <div className="flex flex-col gap-[8px] px-4 md:px-0">
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
            <div className="mt-0">
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
      <div className="flex flex-col gap-[8px] px-4 md:px-0">
        {likeCount > 0 && !(likeCount === 1 && isLiked) && (
          <div className="flex items-center">
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
            isSaved={isSaved || false}
            setIsSaved={setIsSaved}
            handleSaveToggle={() => setIsSaveModalOpen(true)}
            onShowLikes={() => setIsLikesModalOpen(true)}
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
