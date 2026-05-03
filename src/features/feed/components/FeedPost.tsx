'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
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
const UniversalShareModal = dynamic(() => import('@/components/share/UniversalShareModal').then(m => m.UniversalShareModal), { ssr: false });
const SavePostModal = dynamic(() => import('@/components/settings/SavePostModal').then(m => m.SavePostModal), { ssr: false });

export const FeedPost = (props: FeedPostProps) => {
  const { id, author, authorAvatar, imageSrc, videoSrc, content, timeAgo, visibility, isProfileView, shared_post, poll, isCompanyPost, location, tags } = props;
  const { activeProfile, isCompany } = useActiveProfile();
  
  // Custom Hooks
  const { 
    isLiked, likeCount, isCommented, isSaved, pollData, isVoting, commentCount,
    handleLike, handleVote, setIsSaved, setIsCommented, incrementCommentCount, decrementCommentCount 
  } = usePostInteractions(props);

  const {
    showOptions, setShowOptions, optionsPos, setOptionsPos,
    isEditModalOpen, setIsEditModalOpen, isReportModalOpen, setIsReportModalOpen,
    handleToggleVisibility, handleDelete
  } = usePostOptions(props, (id, data) => {
    // This would typically involve a feed update logic, 
    // but here we rely on the parent's props if it re-renders.
  });

  const { videoRef, finalAspectRatio, isVerticalVideo, handleMediaLoad } = usePostMediaObserver(id, videoSrc, props.aspectRatio);

  // Local UI State
  const [isCommentSectionOpen, setIsCommentSectionOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPollAnalytics, setShowPollAnalytics] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  const optionsBtnRef = useRef<HTMLButtonElement>(null);

  const handleToggleCommentSection = () => {
    if (window.innerWidth < 768) {
      setIsMobileDrawerOpen(true);
    } else {
      setIsCommentSectionOpen(!isCommentSectionOpen);
    }
  };

  return (
    <div className="bg-card/30 backdrop-blur-md border border-border/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      <div className="p-4">
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
        />

        <PostContent 
          content={content}
          author={author}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          isFullContent={props.isFullContent}
          shared_post={shared_post}
          sharedPollData={shared_post?.poll}
          isProfileView={isProfileView}
        />
      </div>

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

      <PostPoll 
        pollData={pollData}
        isVoting={isVoting}
        handleVote={(optId) => handleVote(optId, isCompany, activeProfile?.id)}
      />

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
        shares={props.shares || 0}
        handleShare={() => setIsShareModalOpen(true)}
        isSaved={isSaved || false}
        setIsSaved={setIsSaved}
        handleSaveToggle={() => setIsSaveModalOpen(true)}
      />

      {/* Lazy Modals */}
      {isCommentSectionOpen && (
        <CommentSection 
          postId={id.toString()} 
          incrementCommentCount={incrementCommentCount}
          decrementCommentCount={decrementCommentCount}
        />
      )}

      {isMobileDrawerOpen && (
        <MobileCommentDrawer 
          postId={id.toString()} 
          isOpen={isMobileDrawerOpen} 
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
        <UniversalShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          entityId={id.toString()}
          entityType="post"
          entityName={author}
          entityAvatar={authorAvatar}
          postCategory={props.category}
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
    </div>
  );
};

export default FeedPost;