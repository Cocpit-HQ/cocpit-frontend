import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PostCarousel } from './PostCarousel';
import { Icon } from '@/components/icons';
import { calculateDisplayDimensions, ImageDimensions, MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT } from '@/features/feed/utils/imageBounds';
import { LikeBar } from './LikeBar';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { VideoScrubber } from './VideoScrubber';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface PostMediaProps {
  imageSrc?: string;
  images?: string[];
  imageDimensions?: Array<{ width: number; height: number } | null>;
  mediaWidth?: number;
  mediaHeight?: number;
  videoSrc?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onLoad: (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => void;
  priority?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  tags?: any[];
  likeCount?: number;
  isLiked?: boolean;
  sampleLikerUsername?: string;
  likedUsers?: any[];
  viewerUsername?: string;
  onShowLikes?: (e: React.MouseEvent) => void;
  hideOverlayLikeBar?: boolean;
  isFullContent?: boolean;
  isProfileView?: boolean;
  // Video overlay mode props
  videoOverlay?: boolean;
  overlayHeader?: React.ReactNode;
  overlayCaption?: string;
}

export const PostMedia = ({
  imageSrc, images = [], imageDimensions, mediaWidth, mediaHeight, videoSrc, videoRef, onLoad, priority, onClick, tags = [],
  likeCount = 0, isLiked = false, sampleLikerUsername, likedUsers = [], viewerUsername, onShowLikes,
  hideOverlayLikeBar = false, isFullContent = false, isProfileView = false,
  videoOverlay = false, overlayHeader, overlayCaption
}: PostMediaProps) => {
  const validImages = images.length > 0 ? images : (imageSrc ? [imageSrc] : []);
  const hasMultipleImages = validImages.length > 1;
  const contentImgSrc = validImages[0];

  const fastDims = React.useMemo(() => {
    if (mediaWidth && mediaHeight) {
      return calculateDisplayDimensions(mediaWidth, mediaHeight, MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT);
    }
    return null;
  }, [mediaWidth, mediaHeight]);

  const [imgDims, setImgDims] = useState<ImageDimensions | null>(null);
  
  const activeDims = imgDims || fastDims;

  // Video overlay state
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isDraggingRef = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const video = videoRef?.current;
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

  const isVideoOverlayMode = videoOverlay && !!videoSrc;

  if (validImages.length === 0 && !videoSrc) return null;

  const showTagBadge = tags && tags.length > 0;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const dims = calculateDisplayDimensions(img.naturalWidth, img.naturalHeight, MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT);
      setImgDims(dims);
    }
    onLoad(e);
  };

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      const dims = calculateDisplayDimensions(video.videoWidth, video.videoHeight, MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT);
      setImgDims(dims);
    }
    onLoad(e);
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

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  // Strip HTML for caption display
  const stripHtml = (html?: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const displayCaption = stripHtml(overlayCaption);

  return (
    <div className="w-full flex justify-start items-center overflow-visible">
      {hasMultipleImages ? (
        <div
          onClick={onClick}
          className={`relative w-full ${isFullContent ? 'max-w-full' : 'max-w-[442px]'} flex flex-col items-center select-none overflow-visible ${onClick ? 'cursor-pointer' : ''}`}
        >
          <PostCarousel
            images={validImages}
            imageDimensions={imageDimensions}
            priority={priority}
            onImageLoad={onLoad}
            imageFit="cover"
            showDots={true}
            arrowPlacement={isProfileView ? 'inside' : 'outside'}
            dotsClassName="mt-[12px]"
            overlay={
              showTagBadge && (
                <div className="absolute bottom-3 right-3 w-[32px] h-[32px] rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm pointer-events-auto hover:bg-black/80 transition-colors z-20">
                  <Icon name="user" className="w-[16px] h-[16px] text-white" />
                </div>
              )
            }
          />
        </div>
      ) : (
        <div
          onClick={onClick}
          className={`relative overflow-hidden rounded-[8px] border border-[var(--ds-media-border)] group ${isVideoOverlayMode ? 'bg-black' : 'bg-black/5 dark:bg-white/5'} flex flex-col justify-center items-center transition-none ${isVideoOverlayMode ? 'cursor-pointer' : ''} ${!isVideoOverlayMode && onClick ? 'cursor-pointer' : ''}`}
          style={{
            width: activeDims ? `${activeDims.width}px` : '100%',
            maxWidth: isFullContent ? '100%' : `${MAX_MEDIA_WIDTH}px`,
            maxHeight: `${MAX_MEDIA_HEIGHT}px`,
            aspectRatio: activeDims ? `${activeDims.aspectRatio}` : undefined,
          }}
        >
          {videoSrc ? (
            isVideoOverlayMode ? (
              /* Video overlay mode: no native controls, custom overlays */
              <>
                <video
                  ref={videoRef}
                  src={videoSrc}
                  muted={isMuted}
                  loop
                  playsInline
                  onLoadedMetadata={handleVideoLoad}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-cover max-h-[589px] rounded-[8px]"
                />

                {/* ── Top Header Overlay ── */}
                {overlayHeader && (
                  <div 
                    className="absolute top-0 inset-x-0 pt-2.5 pb-6 px-3 bg-gradient-to-b from-black/70 to-transparent z-20 pointer-events-auto select-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {overlayHeader}
                  </div>
                )}

                {/* ── Bottom Overlay: Caption + Mute + Progress ── */}
                <div 
                  className="absolute bottom-0 inset-x-0 pt-4 pb-2 px-3 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-auto flex flex-col gap-1.5 select-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Caption & Mute Row */}
                  <div className="flex items-end justify-between gap-3 w-full">
                    {displayCaption ? (
                      <div className="flex-1 min-w-0">
                        <p className="font-['Poppins',sans-serif] font-normal text-[12px] leading-[16px] text-[#FFECE6] h-[32px] overflow-hidden line-clamp-2">
                          {displayCaption}
                        </p>
                      </div>
                    ) : <div className="flex-1" />}

                    {/* Mute Button */}
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="w-[28px] h-[28px] rounded-full bg-black/80 hover:bg-black/90 active:scale-95 backdrop-blur-md flex items-center justify-center text-[#FFECE6] transition-all cursor-pointer shrink-0 shadow-[-1px_-1px_1px_rgba(255,255,255,0.6),1px_1px_1px_rgba(255,255,255,0.6)] mb-0.5"
                      title={isMuted ? "Unmute" : "Mute"}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <Icon name="volume-off" className="w-5 h-5" />
                      ) : (
                        <Icon name="volume-on" className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <VideoScrubber
                    videoRef={videoRef}
                    progress={progress}
                    setProgress={setProgress}
                    isDraggingRef={isDraggingRef}
                  />
                </div>
              </>
            ) : (
              /* Standard video mode: custom controls matching feed */
              <div 
                className={cn(
                  "relative w-full h-full group flex items-center justify-center overflow-hidden",
                  isFullContent ? "cursor-pointer" : ""
                )}
                onClick={(e) => {
                  if (!isFullContent) return;
                  handleTogglePlay(e);
                }}
              >
                <video
                  ref={videoRef}
                  src={videoSrc}
                  muted={isMuted}
                  loop
                  playsInline
                  onClick={(e) => {
                    if (!isFullContent) return;
                    handleTogglePlay(e);
                  }}
                  onLoadedMetadata={handleVideoLoad}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-contain object-left max-h-[589px] rounded-[8px] cursor-pointer"
                />
                
                {/* Center Play/Pause Button on Hover (Only on post details page) */}
                {isFullContent && (
                  <div 
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-opacity duration-200 z-10 pointer-events-none cursor-pointer",
                      isMobile ? (!isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0") : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      if (!isFullContent) return;
                      handleTogglePlay(e);
                    }}
                  >
                    <div 
                      className="w-[60px] h-[60px] rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-[#FFECE6] pointer-events-auto cursor-pointer shadow-[-1px_-1px_1px_rgba(255,255,255,0.6),1px_1px_1px_rgba(255,255,255,0.6)] transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePlay(e);
                      }}
                    >
                      {isPlaying ? (
                        <Pause className="w-10 h-10" strokeWidth={1.5} />
                      ) : (
                        <Play className="w-10 h-10 ml-1" strokeWidth={1.5} />
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Overlay: Mute + Progress (Feed Style) */}
                <div 
                  className={cn(
                    "absolute bottom-0 inset-x-0 pt-4 pb-2 px-3 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none flex flex-col gap-1.5 select-none transition-opacity duration-200",
                    isMobile && isFullContent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                >
                  {isFullContent && (
                    <div className="flex items-end justify-end gap-3 w-full mb-1 transition-opacity duration-200 opacity-100">
                      {/* Mute Button */}
                      <button
                        type="button"
                        onClick={handleToggleMute}
                        className="w-[28px] h-[28px] rounded-full bg-black/80 hover:bg-black/90 active:scale-95 backdrop-blur-md flex items-center justify-center text-[#FFECE6] transition-all cursor-pointer shrink-0 shadow-[-1px_-1px_1px_rgba(255,255,255,0.6),1px_1px_1px_rgba(255,255,255,0.6)] mb-0.5 pointer-events-auto"
                        title={isMuted ? "Unmute" : "Mute"}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {!isMuted ? (
                          <Icon name="volume-off" className="w-5 h-5" />
                        ) : (
                          <Icon name="volume-on" className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full opacity-100 pointer-events-auto">
                  <VideoScrubber
                    videoRef={videoRef}
                    progress={progress}
                    setProgress={setProgress}
                    isDraggingRef={isDraggingRef}
                  />
                  </div>
                </div>
              </div>
            )
          ) : contentImgSrc ? (
            <img
              src={contentImgSrc}
              alt="Post content"
              className={`w-full h-full object-contain object-left rounded-[8px] ${isFullContent ? 'max-w-full' : 'max-w-[442px]'} max-h-[589px]`}
              onLoad={handleImageLoad}
            />
          ) : null}

          {/* Liked By Overlay — hidden in video overlay mode (handled separately) */}
          {!hideOverlayLikeBar && !isVideoOverlayMode && (
            <LikeBar
              likeCount={likeCount}
              isLiked={isLiked}
              sampleLikerUsername={sampleLikerUsername}
              likedUsers={likedUsers}
              viewerUsername={viewerUsername}
              onShowLikes={onShowLikes}
              variant="overlay"
            />
          )}

          {/* Tagged People Badge Overlay */}
          {showTagBadge && (
            <div className="absolute bottom-3 right-3 w-[32px] h-[32px] rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm pointer-events-auto hover:bg-black/80 transition-colors">
              <Icon name="user" className="w-[16px] h-[16px] text-white" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
