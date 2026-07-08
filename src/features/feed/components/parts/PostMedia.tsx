import React from 'react';
import Image from 'next/image';
import { PostCarousel } from '@/components/shared/PostCarousel';

interface PostMediaProps {
  imageSrc?: string;
  images?: string[];
  videoSrc?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  aspectRatio?: string;
  onLoad: (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => void;
  priority?: boolean;
  forceSquare?: boolean;
  isVerticalVideo?: boolean;
  hasNoCaption?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  achievementTitle?: string;
  imageFit?: 'cover' | 'contain';
}

export const PostMedia = ({
  imageSrc, images = [], videoSrc, videoRef, aspectRatio, onLoad, priority, forceSquare, isVerticalVideo, hasNoCaption, onClick, achievementTitle, imageFit
}: PostMediaProps) => {
  const validImages = images.length > 0 ? images : (imageSrc ? [imageSrc] : []);
  const hasMultipleImages = validImages.length > 1;
  const contentImgSrc = validImages[0];

  if (validImages.length === 0 && !videoSrc) return null;

  const hasMedia = validImages.length > 0 || !!videoSrc;

  // Render achievement special styling if title is present
  if (achievementTitle && !videoSrc && !hasMultipleImages && contentImgSrc) {
    return (
      <div
        onClick={onClick}
        className={`post-image w-full relative flex flex-col justify-center gap-[8px] bg-white ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="w-full">
          <div className="relative w-full aspect-[16/10] overflow-hidden rounded-[8px]">
            <Image
              src={contentImgSrc}
              alt="Achievement media"
              fill
              className="object-cover"
              priority={priority}
              sizes="(max-width: 768px) 100vw, 600px"
              onLoad={onLoad}
            />
          </div>
        </div>
        <div className="text-center text-[#6B7280] text-[12px] font-normal font-poppins leading-[16px] pb-[16px]">
          {achievementTitle}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`post-image w-full overflow-hidden bg-card relative group flex flex-col justify-center ${forceSquare ? 'aspect-square' : (isVerticalVideo ? '' : (aspectRatio ? '' : 'h-[420px]'))
        } ${!forceSquare && hasMedia ? 'mt-0 mb-0' : ''} ${!videoSrc && validImages.length > 0 ? 'border border-[#EEF2FF] dark:border-white/10' : ''} ${onClick ? 'cursor-pointer' : ''} rounded-[12px]`}
      style={
        !forceSquare
          ? (isVerticalVideo ? { height: '550px' } : (aspectRatio ? { aspectRatio, maxHeight: '700px' } : undefined))
          : undefined
      }
    >
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          muted
          playsInline
          onLoadedMetadata={onLoad}
          className={`w-full h-full bg-black ${isVerticalVideo ? 'object-contain' : 'object-cover'}`}
        />
      ) : hasMultipleImages ? (
        <PostCarousel
          images={validImages}
          priority={priority}
          onImageLoad={onLoad}
          imageFit={imageFit}
        />
      ) : contentImgSrc ? (
        <Image
          src={contentImgSrc}
          alt="Post content"
          fill
          className={imageFit === 'contain' ? "object-contain bg-black/5 dark:bg-white/5" : "object-cover"}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 600px"
          onLoad={onLoad}
        />
      ) : null}
    </div>
  );
};
