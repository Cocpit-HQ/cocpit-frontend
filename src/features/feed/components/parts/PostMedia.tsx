import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PostCarousel } from './PostCarousel';
import { Icon } from '@/components/icons';
import { calculateDisplayDimensions, ImageDimensions, MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT } from '@/features/feed/utils/imageBounds';
import { LikeBar } from './LikeBar';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface PostMediaProps {
  imageSrc?: string;
  images?: string[];
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
  // Video overlay mode props
  videoOverlay?: boolean;
  overlayHeader?: React.ReactNode;
  overlayCaption?: string;
}

export const PostMedia = ({
  imageSrc, images = [], mediaWidth, mediaHeight, videoSrc, videoRef, onLoad, priority, onClick, tags = [],
  likeCount = 0, isLiked = false, sampleLikerUsername, likedUsers = [], viewerUsername, onShowLikes,
  hideOverlayLikeBar = false, isFullContent = false,
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
  
  const activeDims = fastDims || imgDims;

  // Video overlay state
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
  }, [videoRef]);

  const isVideoOverlayMode = videoOverlay && !!videoSrc;

  if (validImages.length === 0 && !videoSrc) return null;

  const showTagBadge = tags && tags.length > 0;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!fastDims && img.naturalWidth && img.naturalHeight) {
      const dims = calculateDisplayDimensions(img.naturalWidth, img.naturalHeight, MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT);
      setImgDims(dims);
    }
    onLoad(e);
  };

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (!fastDims && video.videoWidth && video.videoHeight) {
      const dims = calculateDisplayDimensions(video.videoWidth, video.videoHeight, MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT);
      setImgDims(dims);
    }
    onLoad(e);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
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

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const video = videoRef.current;
    if (video && video.duration) {
      video.currentTime = ratio * video.duration;
      setProgress(ratio * 100);
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
            priority={priority}
            onImageLoad={onLoad}
            imageFit="cover"
            viewportHeight="h-[430px]"
            showDots={true}
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
          className={`relative overflow-hidden rounded-2xl ${isVideoOverlayMode ? 'bg-black' : 'bg-black/5 dark:bg-white/5'} flex flex-col justify-center items-center transition-none ${isVideoOverlayMode ? 'group cursor-pointer' : ''} ${!isVideoOverlayMode && onClick ? 'cursor-pointer' : ''}`}
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
                  className="w-full h-full object-cover max-h-[589px] rounded-2xl"
                />

                {/* ── Top Header Overlay ── */}
                {overlayHeader && (
                  <div 
                    className="absolute top-0 inset-x-0 pt-3 pb-8 px-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 pointer-events-auto select-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {overlayHeader}
                  </div>
                )}

                {/* ── Bottom Overlay: Caption + Mute + Progress ── */}
                <div 
                  className="absolute bottom-0 inset-x-0 pt-12 pb-3 px-3 bg-gradient-to-t from-black/90 via-black/45 to-transparent z-20 pointer-events-auto flex flex-col gap-2 select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Caption & Mute Row */}
                  <div className="flex items-end justify-between gap-3 w-full">
                    {displayCaption ? (
                      <div className="flex-1 min-w-0">
                        <p className="font-['Poppins',sans-serif] font-normal text-[12px] leading-[16px] text-[#FFECE6] h-[32px] overflow-hidden line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                          {displayCaption}
                        </p>
                      </div>
                    ) : <div className="flex-1" />}

                    {/* Mute Button */}
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="w-[32px] h-[32px] rounded-full bg-black/60 hover:bg-black/80 active:scale-95 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-md border border-white/10 mb-0.5"
                      title={isMuted ? "Unmute" : "Mute"}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div 
                    className="w-full cursor-pointer select-none py-1"
                    onClick={handleScrubberClick}
                  >
                    <div className="w-full h-[6px] bg-white/30 rounded-full overflow-hidden transition-all relative">
                      <div 
                        className="h-full bg-[#F4D9D2] rounded-full transition-[width] duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Standard video mode: custom controls matching feed */
              <div 
                className="relative w-full h-full group flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={handleTogglePlay}
              >
                <video
                  ref={videoRef}
                  src={videoSrc}
                  muted={isMuted}
                  loop
                  playsInline
                  onLoadedMetadata={handleVideoLoad}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-contain object-left max-h-[589px] rounded-2xl"
                />
                
                {/* Center Play/Pause Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <div className="w-[64px] h-[64px] rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-white" />
                    ) : (
                      <Play className="w-8 h-8 fill-white ml-1" />
                    )}
                  </div>
                </div>

                {/* Bottom Overlay: Mute + Progress (Feed Style) */}
                <div 
                  className="absolute bottom-0 inset-x-0 pt-12 pb-3 px-3 bg-gradient-to-t from-black/90 via-black/45 to-transparent z-20 pointer-events-auto flex flex-col gap-2 select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-end justify-end gap-3 w-full">
                    {/* Mute Button */}
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className="w-[32px] h-[32px] rounded-full bg-black/60 hover:bg-black/80 active:scale-95 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-md border border-white/10 mb-0.5"
                      title={isMuted ? "Unmute" : "Mute"}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div 
                    className="w-full cursor-pointer select-none py-1"
                    onClick={handleScrubberClick}
                  >
                    <div className="w-full h-[6px] bg-white/30 rounded-full overflow-hidden transition-all relative">
                      <div 
                        className="h-full bg-[#F4D9D2] rounded-full transition-[width] duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : contentImgSrc ? (
            <img
              src={contentImgSrc}
              alt="Post content"
              className={`w-full h-full object-contain object-left rounded-2xl ${isFullContent ? 'max-w-full' : 'max-w-[442px]'} max-h-[589px]`}
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
