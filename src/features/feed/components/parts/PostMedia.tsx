import React, { useState } from 'react';
import Image from 'next/image';
import { PostCarousel } from './PostCarousel';
import { Icon } from '@/components/icons';
import { calculateDisplayDimensions, ImageDimensions, MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT } from '@/features/feed/utils/imageBounds';
import { LikeBar } from './LikeBar';

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
}

export const PostMedia = ({
  imageSrc, images = [], mediaWidth, mediaHeight, videoSrc, videoRef, onLoad, priority, onClick, tags = [],
  likeCount = 0, isLiked = false, sampleLikerUsername, likedUsers = [], viewerUsername, onShowLikes
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

  return (
    <div className="w-full flex justify-start items-center overflow-visible">
      {hasMultipleImages ? (
        <div
          onClick={onClick}
          className={`relative w-full max-w-[442px] flex flex-col items-center select-none overflow-visible ${onClick ? 'cursor-pointer' : ''}`}
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
          className={`relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 flex flex-col justify-center items-center transition-none ${onClick ? 'cursor-pointer' : ''}`}
          style={{
            width: activeDims ? `${activeDims.width}px` : '100%',
            maxWidth: `${MAX_MEDIA_WIDTH}px`,
            maxHeight: `${MAX_MEDIA_HEIGHT}px`,
            aspectRatio: activeDims ? `${activeDims.aspectRatio}` : undefined,
          }}
        >
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              muted
              playsInline
              onLoadedMetadata={handleVideoLoad}
              className="w-full h-full object-contain object-left max-h-[589px] rounded-2xl"
            />
          ) : contentImgSrc ? (
            <img
              src={contentImgSrc}
              alt="Post content"
              className="w-full h-full object-contain object-left rounded-2xl max-w-[442px] max-h-[589px]"
              onLoad={handleImageLoad}
            />
          ) : null}

          {/* Liked By Overlay - Changed: Replaced inline liker badge with modular overlay LikeBar component */}
          <LikeBar
            likeCount={likeCount}
            isLiked={isLiked}
            sampleLikerUsername={sampleLikerUsername}
            likedUsers={likedUsers}
            viewerUsername={viewerUsername}
            onShowLikes={onShowLikes}
            variant="overlay"
          />

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

