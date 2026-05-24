'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { FeedPostProps } from '../types';
import { usePostInteractions } from '../hooks/use-post-interactions';
import { usePostOptions } from '../hooks/use-post-options';
import { usePostMediaObserver } from '../hooks/use-post-media-observer';

// Parts
import { PostHeader } from './parts/PostHeader';
import { PostContent } from './parts/PostContent';
import { PostMedia } from './parts/PostMedia';
import { PostActions } from './parts/PostActions';
import { PostPoll } from './parts/PostPoll';

// Lazy loaded modals and sections
const CommentSection = dynamic(() => import('./comments/CommentSection'), { ssr: false });
const MobileCommentDrawer = dynamic(() => import('./comments/MobileCommentDrawer'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/shared/ReportModal').then(m => m.ReportModal), { ssr: false });
const PollAnalyticsModal = dynamic(() => import('@/components/home/PollAnalyticsModal').then(m => m.PollAnalyticsModal), { ssr: false });
const CocpitShareModel = dynamic(() => import('@/shared/commonComponents/cocpitsharemodel'), { ssr: false });
const SavePostModal = dynamic(() => import('@/components/settings/SavePostModal').then(m => m.SavePostModal), { ssr: false });
const CreatePostModal = dynamic(() => import('@/features/create-post/components/CreatePostModal').then(m => m.CreatePostModal), { ssr: false });

export const FeedPost = (props: FeedPostProps) => {
  const { id, author, authorAvatar, imageSrc, videoSrc, content, timeAgo, visibility, isProfileView, shared_post, poll, isCompanyPost, location, tags, sampleLikerUsername, category, title, articleBody } = props;
  const { activeProfile, isCompany } = useActiveProfile();
  const router = useRouter();
  const isArticlePost = category === 'Article' || Boolean(articleBody);
  const isArticleFeedCard = isArticlePost && !props.isFullContent;

  // Custom Hooks
  const {
    isLiked, likeCount, isCommented, isSaved, pollData, isVoting, commentCount, shareCount,
    handleLike, handleVote, setIsSaved, setIsCommented, incrementCommentCount, decrementCommentCount, incrementShareCount
  } = usePostInteractions(props);

  const {
    showOptions, setShowOptions, optionsPos, setOptionsPos,
    isEditModalOpen, setIsEditModalOpen, isReportModalOpen, setIsReportModalOpen,
    handleToggleVisibility, handleDelete
  } = usePostOptions(props, (id, data) => {
    // Parent handle refresh logic
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

  const optionsBtnRef = useRef<HTMLButtonElement>(null);

  const handleToggleCommentSection = () => {
    if (window.innerWidth < 768) {
      setIsMobileDrawerOpen(true);
    } else {
      setIsCommentSectionOpen(!isCommentSectionOpen);
    }
  };

  return (
    <div
      onClick={() => {
        if (isArticleFeedCard) {
          router.push(`/post/${id}`);
        }
      }}
      className={`feed-card-shell flex w-full flex-col gap-[16px] overflow-hidden py-[16px] transition-all duration-300 hover:shadow-md ${isArticleFeedCard ? 'cursor-pointer' : ''}`}
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
          onEdit={() => setIsEditModalOpen(true)}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
          onShowAnalytics={() => setShowPollAnalytics(true)}
          onReport={() => setIsReportModalOpen(true)}
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
        <PostMedia
          imageSrc={imageSrc}
          images={props.images}
          videoSrc={videoSrc}
          videoRef={videoRef}
          aspectRatio={finalAspectRatio}
          onLoad={handleMediaLoad}
          priority={props.priority}
          isVerticalVideo={isVerticalVideo}
        />
      )}

      {/* Poll */}
      <PostPoll
        pollData={pollData}
        isVoting={isVoting}
        handleVote={(optId) => handleVote(optId, isCompany, activeProfile?.id)}
      />

      {/* Social Proof (Frame 2608624) */}
      {likeCount > 0 && (
        <div className="px-[16px] h-[20px] flex items-center">
          <p className="text-[12px] leading-[16px] font-[family-name:var(--font-poppins)] font-normal text-foreground">
            Liked by {isLiked ? (
              likeCount === 1 ? (
                'you'
              ) : (
                <>
                  you and {likeCount - 1} {likeCount - 1 === 1 ? 'other' : 'others'}
                </>
              )
            ) : (
              likeCount === 1 ? (
                `@${sampleLikerUsername || 'someone'}`
              ) : (
                <>
                  @{sampleLikerUsername || 'someone'} and {likeCount - 1} {likeCount - 1 === 1 ? 'other' : 'others'}
                </>
              )
            )}
          </p>
        </div>
      )}

      {/* Actions (Frame 2608574) */}
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
        handleRepost={() => setIsRepostModalOpen(true)}
        isSaved={isSaved || false}
        setIsSaved={setIsSaved}
        handleSaveToggle={() => setIsSaveModalOpen(true)}
      />

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
    </div>
  );
};

export default FeedPost;
