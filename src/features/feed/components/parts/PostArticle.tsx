'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface PostArticleProps {
  postId: string | number;
  title?: string | null;
  coverImage?: string | null;
  likeCount?: number;
  isLiked?: boolean;
  sampleLikerUsername?: string;
  likedUsers?: any[];
  viewerUsername?: string;
  onShowLikes?: () => void;
}

export const PostArticle: React.FC<PostArticleProps> = ({
  postId,
  title,
  coverImage,
}) => {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/article/${postId}`);
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/article/${postId}`);
        }
      }}
      aria-label={`Read article: ${title || 'Untitled Article'}`}
      className="w-full rounded-[8px] overflow-hidden border-[0.5px] border-[var(--ds-border)] bg-transparent hover:border-[var(--ds-border)] transition-all cursor-pointer select-none group flex flex-col my-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] px-3 py-2 gap-3"
    >
      {/* 16:9 Cover Image */}
      {coverImage && (
        <div className="w-full aspect-[16/9] overflow-hidden rounded-[4px] bg-ds-surface-2">
          <img
            src={coverImage}
            alt={title || 'Article cover'}
            className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Title Bar */}
      {title && (
        <div className="w-full px-0 pb-1 text-left">
          <h3 className="text-[12px] font-semibold leading-[16px] text-ds-text-primary tracking-tight line-clamp-2 transition-colors">
            {title}
          </h3>
        </div>
      )}
    </div>
  );
};

export default PostArticle;
