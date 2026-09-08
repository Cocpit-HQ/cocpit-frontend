'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { PostHeader } from '../../parts/PostHeader';
import { PostBody } from '../../parts/PostBody';
import { PostMenuAccess } from '../../../utils/postMenuAccess';

export interface PostVideoCardProps {
  id?: string | number;
  videoSrc: string;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onLoad?: (event: React.SyntheticEvent<HTMLVideoElement>) => void;
  finalAspectRatio?: string;
  author?: string;
  authorId?: string | number;
  authorAvatar?: string;
  authorSlug?: string;
  authorRole?: string;
  location?: string;
  timeAgo?: string;
  visibility?: string;
  isMe?: boolean;
  menuAccess?: PostMenuAccess;
  isCompanyPost?: boolean;
  optionsBtnRef?: React.RefObject<HTMLButtonElement | null>;
  showOptions?: boolean;
  setShowOptions?: (val: boolean) => void;
  setOptionsPos?: (pos: { top: number; right: number } | null) => void;
  content?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showHeader?: boolean;
}

export const PostVideoCard = ({
  id = 'preview',
  videoSrc,
  videoRef: externalVideoRef,
  onLoad,
  finalAspectRatio,
  author = '',
  authorId,
  authorAvatar,
  authorSlug,
  authorRole,
  location,
  timeAgo,
  visibility,
  isMe = true,
  menuAccess,
  isCompanyPost,
  optionsBtnRef,
  showOptions = false,
  setShowOptions,
  setOptionsPos,
  content,
  isExpanded = false,
  onToggleExpand,
  showHeader = true
}: PostVideoCardProps) => {
  const router = useRouter();
  const internalVideoRef = React.useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const dummyBtnRef = React.useRef<HTMLButtonElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted] = useState(true);

  const handleVideoClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (id && id !== 'preview') {
      router.push(`/post/${id}`);
    }
  };

  return (
    <div 
      className="relative w-full max-w-[442px] mx-auto overflow-hidden rounded-2xl bg-black select-none cursor-pointer group shadow-sm flex items-center justify-center transition-all duration-200"
      style={{
        aspectRatio: finalAspectRatio || '4/5',
        maxHeight: '589px'
      }}
      onClick={handleVideoClick}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        muted={isMuted}
        loop
        playsInline
        onLoadedMetadata={onLoad}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Top Header Overlay */}
      {showHeader && author && (
        <div 
          className="absolute top-0 inset-x-0 pt-3 pb-8 px-3 bg-gradient-to-b from-black/75 via-black/35 to-transparent z-20 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <PostHeader
            id={id}
            author={author}
            authorId={authorId}
            authorAvatar={authorAvatar}
            authorSlug={authorSlug}
            authorRole={authorRole}
            location={location}
            timeAgo={timeAgo}
            visibility={visibility}
            isMe={isMe}
            menuAccess={menuAccess}
            isCompanyPost={isCompanyPost}
            optionsBtnRef={optionsBtnRef || dummyBtnRef}
            showOptions={showOptions}
            setShowOptions={setShowOptions || (() => {})}
            setOptionsPos={setOptionsPos || (() => {})}
            variant="overlay"
          />
        </div>
      )}

      {/* Big Play Button Overlay (when paused) */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-200"
        >
          <div className="w-[68px] h-[68px] rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105">
            <svg 
              className="w-[32px] h-[32px] text-white translate-x-[2px]" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Bottom Content & Controls Overlay */}
      <div 
        className="absolute bottom-0 inset-x-0 pb-3 pt-10 px-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-20 pointer-events-auto flex flex-col gap-2 cursor-pointer"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('a') || target.closest('button') || target.closest('[role="button"]')) {
            e.stopPropagation();
            return;
          }
          handleVideoClick(e);
        }}
      >
        {/* Caption */}
        {content && (
          <div className="w-full">
            <PostBody
              content={content}
              author={author}
              authorSlug={authorSlug}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              variant="overlay"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostVideoCard;
