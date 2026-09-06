import React, { useState } from 'react';
import Image from 'next/image';
import { PostCarousel } from './PostCarousel';
import { Icon } from '@/components/icons';
import { calculateDisplayDimensions, ImageDimensions, MAX_MEDIA_WIDTH, MAX_MEDIA_HEIGHT } from '@/features/feed/utils/imageBounds';

interface PostMediaProps {
  imageSrc?: string;
  images?: string[];
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
}

export const PostMedia = ({
  imageSrc, images = [], videoSrc, videoRef, onLoad, priority, onClick, tags = [],
  likeCount = 0, isLiked = false, sampleLikerUsername, likedUsers = [], viewerUsername
}: PostMediaProps) => {
  const validImages = images.length > 0 ? images : (imageSrc ? [imageSrc] : []);
  const hasMultipleImages = validImages.length > 1;
  const contentImgSrc = validImages[0];

  const [imgDims, setImgDims] = useState<ImageDimensions | null>(null);

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

  return (
    <div className="w-full flex justify-center items-center overflow-visible">
      {hasMultipleImages ? (
        <div
          onClick={onClick}
          className={`relative w-full max-w-[442px] h-[430px] flex items-center select-none overflow-visible ${onClick ? 'cursor-pointer' : ''}`}
        >
          <PostCarousel
            images={validImages}
            priority={priority}
            onImageLoad={onLoad}
            imageFit="cover"
          />

          {/* Tagged People Badge Overlay */}
          {showTagBadge && (
            <div className="absolute bottom-3 right-3 w-[32px] h-[32px] rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm pointer-events-auto hover:bg-black/80 transition-colors z-20">
              <Icon name="user" className="w-[16px] h-[16px] text-white" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={onClick}
          className={`relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5 flex flex-col justify-center items-center transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
          style={{
            width: imgDims ? `${imgDims.width}px` : '100%',
            maxWidth: `${MAX_MEDIA_WIDTH}px`,
            maxHeight: `${MAX_MEDIA_HEIGHT}px`,
            aspectRatio: imgDims ? `${imgDims.aspectRatio}` : undefined,
          }}
        >
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              muted
              playsInline
              onLoadedMetadata={onLoad}
              className="w-full h-full object-contain max-h-[589px] rounded-2xl"
            />
          ) : contentImgSrc ? (
            <img
              src={contentImgSrc}
              alt="Post content"
              className="w-full h-full object-contain rounded-2xl max-w-[442px] max-h-[589px]"
              onLoad={handleImageLoad}
            />
          ) : null}

          {/* Liked By Overlay */}
          {likeCount > 0 && !(likeCount === 1 && isLiked) && sampleLikerUsername && (
            <div className="absolute bottom-[12px] left-[12px] flex flex-row items-center justify-center px-[8px] py-[4px] gap-[4px] bg-[#030303]/60 rounded-[16px] pointer-events-auto">
              <span className="text-[12px] font-normal leading-[16px] text-ds-text-primary text-center">
                Liked by{' '}
                <span className="font-semibold">
                  {sampleLikerUsername}
                </span>
                {likeCount > (isLiked ? 2 : 1) ? ` and ${likeCount - (isLiked ? 2 : 1)} others` : ''}
              </span>
              {likedUsers && likedUsers.length > 0 && (() => {
                const filteredLikedUsers = viewerUsername 
                  ? likedUsers.filter(u => u.username?.toLowerCase() !== viewerUsername.toLowerCase()) 
                  : likedUsers;
                if (filteredLikedUsers.length === 0) return null;
                return (
                  <div className="flex -space-x-1">
                    {filteredLikedUsers.slice(0, 3).map((user, idx) => {
                      const hasAvatar = user.avatar_url && user.avatar_url !== '/assets/pngegg.png';
                      return hasAvatar ? (
                        <img
                          key={idx}
                          src={user.avatar_url || undefined}
                          alt={user.username || "user"}
                          className="inline-block h-[16px] w-[16px] rounded-full border border-[#030303] object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div key={idx} className="inline-flex h-[16px] w-[16px] rounded-full border border-[#030303] bg-ds-surface-2 text-ds-text-primary font-medium text-[8px] items-center justify-center flex-shrink-0 select-none">
                          {(user.username || '?').charAt(0).toUpperCase()}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
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

