'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  MessageCircle, 
  Repeat, 
  Share2, 
  Bookmark, 
  Volume2,
  VolumeX,
  MoreHorizontal 
} from 'lucide-react';
import { PostMenuAccess } from '../../../utils/postMenuAccess';
import { useSocial } from '@/context/SocialContext';
import { VideoScrubber } from '../../parts/VideoScrubber';

export interface FloatingBadge {
  avatar?: string;
  name?: string;
  x?: string | number;
  y?: string | number;
}

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
  showFooter?: boolean;
  isPreview?: boolean;
  likeCount?: number;
  isLiked?: boolean;
  commentCount?: number;
  repostCount?: number;
  shareCount?: number;
  isSaved?: boolean;
  sampleLikerUsername?: string;
  likedUsers?: any[];
  viewerUsername?: string;
  onShowLikes?: () => void;
  onLikeToggle?: () => void;
  onSaveToggle?: () => void;
  onCommentClick?: () => void;
  onShareClick?: () => void;
  onRepostClick?: () => void;
  floatingBadge?: FloatingBadge | null;
  onFollowToggle?: () => void;
  isFollowing?: boolean;
  allowPlayPause?: boolean;
}

const stripHtml = (html?: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const formatCount = (count?: number | string): string => {
  if (count === undefined || count === null) return '0';
  if (typeof count === 'string') return count;
  if (count >= 1000) {
    const k = (count / 1000).toFixed(1);
    return k.endsWith('.0') ? `${Math.floor(count / 1000)}k` : `${k}k`;
  }
  return count.toString();
};

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
  showHeader = true,
  showFooter = false,
  isPreview = false,
  likeCount,
  isLiked = false,
  commentCount,
  repostCount,
  shareCount,
  isSaved = false,
  sampleLikerUsername,
  likedUsers = [],
  viewerUsername,
  onShowLikes,
  onLikeToggle,
  onSaveToggle,
  onCommentClick,
  onShareClick,
  onRepostClick,
  floatingBadge,
  onFollowToggle,
  isFollowing = false,
  allowPlayPause
}: PostVideoCardProps) => {
  const router = useRouter();
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const dummyBtnRef = useRef<HTMLButtonElement>(null);

  // Play/pause controls are kept ONLY on post details view (!showHeader) or composer preview (isPreview)
  const canPlayPause = allowPlayPause !== undefined ? allowPlayPause : (!showHeader || isPreview);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Local interactive states for preview
  const [likedState, setLikedState] = useState(isLiked);
  const [currentLikeCount, setCurrentLikeCount] = useState(likeCount ?? (isPreview ? 2100 : 0));
  const [savedState, setSavedState] = useState(isSaved);

  useEffect(() => {
    setLikedState(isLiked);
  }, [isLiked]);

  useEffect(() => {
    if (likeCount !== undefined) setCurrentLikeCount(likeCount);
  }, [likeCount]);

  useEffect(() => {
    setSavedState(isSaved);
  }, [isSaved]);

  const isDraggingRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    if (!video.paused) {
      setIsPlaying(true);
    }

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef, videoSrc]);

  // Autoplay attempt on mount (e.g. when opening post details full view)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    video.muted = isMuted;
    video.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // Browser blocked un-interacted autoplay; stays paused with Play Triangle
      setIsPlaying(false);
    });
  }, [videoSrc]);

  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (!canPlayPause) {
      // In feed, clicking video moves to post details page by allowing click to bubble
      return;
    }
    e?.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    const newMuted = !isMuted;
    if (video) {
      video.muted = newMuted;
    }
    setIsMuted(newMuted);
  };

  const handleTimeUpdate = () => {
    if (isDraggingRef.current) return;
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      setDuration(video.duration);
    }
    onLoad?.(e);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLikeToggle) {
      onLikeToggle();
    } else {
      setLikedState((prev) => {
        const next = !prev;
        setCurrentLikeCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
        return next;
      });
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSaveToggle) {
      onSaveToggle();
    } else {
      setSavedState((prev) => !prev);
    }
  };

  let social: any = null;
  try {
    social = useSocial();
  } catch (e) {}

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    setHasInteracted(false);
  }, [id, authorId]);

  const authorUserId = authorId?.toString();
  const isAuthorFollowing = authorUserId && social?.isFollowing ? social.isFollowing(authorUserId) : false;
  const isAuthorFollowLoading = authorUserId && social?.isFollowLoading ? social.isFollowLoading(authorUserId) : false;

  // Follow condition matching PostHeader.tsx:
  // 1. If it's my own post or in composer preview, NEVER show follow button.
  // 2. If already following and user hasn't interacted on this post, keep header clean (hidden).
  // 3. If not following, show "Follow".
  // 4. If user just interacted to follow, show "Unfollow".
  const effectiveIsMe = Boolean(isMe || isPreview);
  const isFollowingInitialized = social ? social.isFollowingInitialized : true;
  const canShowFollow = !effectiveIsMe && isFollowingInitialized && (!isAuthorFollowing || hasInteracted);

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFollowToggle) {
      onFollowToggle();
      return;
    }
    if (!authorUserId || !social || isAuthorFollowLoading) {
      return;
    }
    setHasInteracted(true);
    if (isAuthorFollowing) {
      social.unfollowUser(authorUserId);
    } else {
      social.followUser(authorUserId, id?.toString());
    }
  };

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showOptions && setShowOptions && setOptionsPos) {
      const rect = (optionsBtnRef || dummyBtnRef).current?.getBoundingClientRect();
      if (rect) {
        setOptionsPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
      }
    }
    setShowOptions?.(!showOptions);
  };

  const cleanCaption = stripHtml(content);
  const displayCaption = cleanCaption || (isPreview ? "Hey! I just got a new job — all thanks to Cocpit! I’m really excited for this new chapter and couldn’t have done it without the support and opportunities I found there. Feeling grateful and pumped for what’s ahead! 🚀" : '');

  const displayAuthor = author || (isPreview ? 'Marcus avery' : '');
  const displayRole = authorRole || (isPreview ? 'Senior product designer' : '');
  const displayAvatar = authorAvatar || (isPreview ? '/assets/pngegg.png' : '');

  const effectiveLikerName = sampleLikerUsername || (isPreview ? 'John' : 'someone');
  const effectiveOtherCount = isPreview ? 3 : Math.max(0, currentLikeCount - (likedState ? 2 : 1));
  const effectiveCommentCount = formatCount(commentCount ?? (isPreview ? 989 : 0));
  const effectiveRepostCount = formatCount(repostCount ?? (isPreview ? 230 : 0));
  const effectiveShareCount = formatCount(shareCount ?? (isPreview ? 45 : 0));

  const demoLikerAvatars = [
    '/assets/pngegg.png',
    '/assets/pngegg.png',
    '/assets/pngegg.png'
  ];

  const likerAvatarsToDisplay = likedUsers && likedUsers.length > 0 
    ? likedUsers.slice(0, 3).map((u) => u.avatar_url || demoLikerAvatars[0])
    : (isPreview ? demoLikerAvatars : []);

  return (
    <div className={`w-full ${showHeader ? 'max-w-[442px]' : 'max-w-full'} mx-auto flex flex-col select-none`}>
      {/* ── Main Video Card ── */}
      <div 
        className="relative w-full overflow-hidden rounded-[24px] bg-black select-none cursor-pointer group shadow-lg flex items-center justify-center transition-all duration-200 border border-white/10"
        style={{
          aspectRatio: finalAspectRatio || '4/5',
          maxHeight: showHeader ? '589px' : '650px'
        }}
        onClick={handleTogglePlay}
      >
        {/* HTML5 Video */}
        <video
          ref={videoRef}
          src={videoSrc}
          muted={isMuted}
          loop
          playsInline
          onClick={handleTogglePlay}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* ── Top Header Overlay (In-Video) ── */}
        {showHeader && displayAuthor && (
          <div 
            className="absolute top-0 inset-x-0 pt-2.5 pb-6 px-4 bg-gradient-to-b from-black/70 to-transparent z-20 pointer-events-auto flex items-center justify-between select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Avatar + Name + Role */}
            <div 
              className="flex items-center gap-2.5 min-w-0 pr-2 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (isPreview) return;
                const profileHref = isCompanyPost && authorSlug
                  ? `/organization/${authorSlug}`
                  : (authorId ? `/profile/${authorId}` : (authorSlug ? `/profile/${authorSlug}` : null));
                if (profileHref) {
                  router.push(profileHref);
                }
              }}
            >
              <div className="w-[36px] h-[36px] rounded-full overflow-hidden border border-white/20 flex-shrink-0 bg-black/40 shadow-md">
                {displayAvatar ? (
                  <img 
                    src={displayAvatar} 
                    alt={displayAuthor} 
                    className="w-full h-full object-cover rounded-full" 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/pngegg.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-medium text-xs bg-white/20">
                    {displayAuthor.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold text-[14px] sm:text-[15px] leading-tight truncate hover:underline">
                  {displayAuthor}
                </span>
                {displayRole && (
                  <span className="text-white/80 text-[11px] sm:text-[12px] leading-tight truncate mt-0.5">
                    {displayRole}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Clean Follow Action + Options */}
            <div className="flex items-center gap-3 shrink-0">
              {canShowFollow && (
                <button
                  type="button"
                  onClick={handleFollowClick}
                  disabled={isAuthorFollowLoading}
                  className="text-white hover:text-white/80 font-medium text-[14px] transition-opacity cursor-pointer bg-transparent border-none p-0 outline-none disabled:opacity-50"
                >
                  {isAuthorFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
              <button
                ref={optionsBtnRef || dummyBtnRef}
                type="button"
                onClick={handleOptionsClick}
                className="text-white hover:text-white/80 p-0.5 transition-opacity cursor-pointer bg-transparent border-none outline-none"
                aria-label="More options"
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ── Center Play/Pause Button (Kept ONLY on post details page / preview as requested) ── */}
        {canPlayPause && (
          <div 
            onClick={handleTogglePlay}
            className={`absolute inset-0 flex items-center justify-center z-10 cursor-pointer transition-opacity duration-200 ${
              !isPlaying 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
            }`}
          >
            <div 
              className="w-[72px] h-[72px] rounded-full bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl transition-transform duration-150 group-hover:scale-105 active:scale-95 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePlay(e);
              }}
            >
              {!isPlaying ? (
                /* When Paused / Stopped: Play Triangle (Figma 40x40 scale) */
                <svg 
                  className="w-[40px] h-[40px] fill-white translate-x-[2px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
                  viewBox="0 0 40 40"
                >
                  <path d="M8 3.5C6 2.3 4 3.7 4 6.2V33.8C4 36.3 6 37.7 8 36.5L34.5 22.7C36.5 21.5 36.5 18.5 34.5 17.3L8 3.5Z" />
                </svg>
              ) : (
                /* When Playing: Hollow Pause Bars on hover (Figma 40x40 scale) */
                <svg 
                  className="w-[40px] h-[40px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
                  viewBox="0 0 40 40" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="5.5" y="3.5" width="10" height="33" rx="3.5" stroke="white" strokeWidth="2.5" />
                  <rect x="24.5" y="3.5" width="10" height="33" rx="3.5" stroke="white" strokeWidth="2.5" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* ── Optional Floating Avatar Speech Bubble (Pin/Tag) ── */}
        {floatingBadge && (
          <div 
            className="absolute z-15 pointer-events-none select-none transition-transform"
            style={{
              top: floatingBadge.y || '42%',
              right: floatingBadge.x || '35%',
            }}
          >
            <div className="relative bg-white rounded-full p-0.5 shadow-xl flex items-center justify-center">
              <div className="w-[24px] h-[24px] rounded-full overflow-hidden">
                <img 
                  src={floatingBadge.avatar || '/assets/pngegg.png'} 
                  alt="pin" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Speech bubble pointer tail */}
              <div className="absolute -bottom-1 left-2 w-2 h-2 bg-white rotate-45 transform origin-center shadow-xs" />
            </div>
          </div>
        )}

        {/* ── Bottom In-Video Overlays ── */}
        <div 
          className="absolute bottom-0 inset-x-0 pt-4 pb-2 px-4 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none flex flex-col gap-1.5 select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          {/* Caption & Mute Row (Figma layout) */}
          <div className="flex items-end justify-between gap-3 w-full">
            {displayCaption ? (
              <div className="flex-1 max-w-[362px] min-w-0">
                <p className="font-['Poppins',sans-serif] font-normal text-[12px] leading-[16px] text-[#FFECE6] h-[32px] overflow-hidden line-clamp-2">
                  {displayCaption}
                </p>
              </div>
            ) : <div className="flex-1" />}

            {/* Circular Volume / Mute Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className="w-[32px] h-[32px] rounded-full bg-black/60 hover:bg-black/80 active:scale-95 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.6)] border border-white/20 mb-0.5 pointer-events-auto"
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {!isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* ── Video Scrubber / Progress Bar (Figma spec: 410 Fill × 6 Hug) ── */}
          <div className="pointer-events-auto w-full">
            <VideoScrubber
              videoRef={videoRef}
              progress={progress}
              setProgress={setProgress}
              isDraggingRef={isDraggingRef}
            />
          </div>
        </div>
      </div>

      {/* ── Below-Video Social Section (Liked By & Action Bar) ── */}
      {(showFooter || isPreview) && (
        <div 
          className="w-full flex flex-col gap-2 pt-2.5 px-1 select-none" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Liked by row */}
          <div 
            className="flex items-center gap-1.5 cursor-pointer text-white/90 hover:text-white text-[13px] font-normal"
            onClick={onShowLikes}
          >
            <span>
              Liked by <span className="font-semibold text-white">{effectiveLikerName}</span> and {effectiveOtherCount} others
            </span>
            {likerAvatarsToDisplay.length > 0 && (
              <div className="flex -space-x-1.5 items-center ml-1">
                {likerAvatarsToDisplay.map((avatar, idx) => (
                  <img 
                    key={idx} 
                    src={avatar} 
                    alt="liker" 
                    className="w-[16px] h-[16px] rounded-full border border-black object-cover flex-shrink-0"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between w-full pt-1">
            <div className="flex items-center gap-5">
              {/* Like */}
              <button 
                type="button" 
                onClick={handleLikeClick}
                className="flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer group"
              >
                <Heart 
                  className={`w-[19px] h-[19px] transition-colors ${
                    likedState 
                      ? 'fill-[#FF4B4B] text-[#FF4B4B]' 
                      : 'text-white group-hover:text-white/80'
                  }`} 
                />
                <span className="text-white text-[12px] font-normal">
                  {formatCount(currentLikeCount)}
                </span>
              </button>

              {/* Comment */}
              <button 
                type="button" 
                onClick={onCommentClick}
                className="flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer group"
              >
                <MessageCircle className="w-[19px] h-[19px] text-white group-hover:text-white/80 transition-colors" />
                <span className="text-white text-[12px] font-normal">{effectiveCommentCount}</span>
              </button>

              {/* Repost */}
              <button 
                type="button" 
                onClick={onRepostClick}
                className="flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer group"
              >
                <Repeat className="w-[19px] h-[19px] text-white group-hover:text-white/80 transition-colors" />
                <span className="text-white text-[12px] font-normal">{effectiveRepostCount}</span>
              </button>

              {/* Share */}
              <button 
                type="button" 
                onClick={onShareClick}
                className="flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer group"
              >
                <Share2 className="w-[19px] h-[19px] text-white group-hover:text-white/80 transition-colors" />
                <span className="text-white text-[12px] font-normal">{effectiveShareCount}</span>
              </button>
            </div>

            {/* Bookmark / Save */}
            <button 
              type="button" 
              onClick={handleSaveClick}
              className="bg-transparent border-none p-0 cursor-pointer group"
            >
              <Bookmark 
                className={`w-[19px] h-[19px] transition-colors ${
                  savedState 
                    ? 'fill-white text-white' 
                    : 'text-white group-hover:text-white/80'
                }`} 
              />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PostVideoCard;
