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
  isProfileView?: boolean;
  isVerticalVideo?: boolean;
  hasNoCaption?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const PostMedia = ({
  imageSrc, images = [], videoSrc, videoRef, aspectRatio, onLoad, priority, isProfileView, isVerticalVideo, hasNoCaption, onClick
}: PostMediaProps) => {
  const validImages = images.length > 0 ? images : (imageSrc ? [imageSrc] : []);
  const hasMultipleImages = validImages.length > 1;
  const contentImgSrc = validImages[0];

  if (validImages.length === 0 && !videoSrc) return null;

  const hasMedia = validImages.length > 0 || !!videoSrc;

  return (
    <div
      onClick={onClick}
      onClick={onClick}
      className={`post-image w-full overflow-hidden bg-card relative group flex flex-col justify-center ${isProfileView ? 'aspect-square' : (isVerticalVideo ? '' : (aspectRatio ? '' : 'h-[420px]'))
        } ${!isProfileView && hasMedia ? 'mt-2 mb-0' : ''} ${!videoSrc && validImages.length > 0 ? 'border border-[#EEF2FF] dark:border-white/10' : ''} ${onClick ? 'cursor-pointer' : ''} ${onClick ? 'cursor-pointer' : ''} rounded-[12px]`}
      style={
        !isProfileView
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
        />
      ) : contentImgSrc ? (
        <Image
          src={contentImgSrc}
          alt="Post content"
          fill
          className="object-cover"
          priority={priority}
          sizes="(max-width: 768px) 100vw, 600px"
          onLoad={onLoad}
        />
      ) : null}
    </div>
  );
};
