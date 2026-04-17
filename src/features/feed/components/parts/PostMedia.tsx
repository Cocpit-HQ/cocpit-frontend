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
}

export const PostMedia = ({
  imageSrc, images = [], videoSrc, videoRef, aspectRatio, onLoad, priority, isProfileView, isVerticalVideo
}: PostMediaProps) => {
  const validImages = images.length > 0 ? images : (imageSrc ? [imageSrc] : []);
  const hasMultipleImages = validImages.length > 1;
  const contentImgSrc = validImages[0];

  if (validImages.length === 0 && !videoSrc) return null;

  return (
    <div
      className={`w-full overflow-hidden bg-gray-100 dark:bg-zinc-900 relative group flex flex-col justify-center ${
        isProfileView ? 'aspect-square' : (isVerticalVideo ? '' : (aspectRatio ? '' : 'min-h-[300px] md:min-h-[400px]'))
      }`}
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
