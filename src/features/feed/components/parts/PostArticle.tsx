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
    router.push(`/post/${postId}`);
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/post/${postId}`);
        }
      }}
      aria-label={`Read article: ${title || 'Untitled Article'}`}
      className="w-full rounded-2xl overflow-hidden border border-ds-border bg-ds-surface-1 hover:border-ds-border transition-all cursor-pointer select-none group flex flex-col mt-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
    >
      {/* 16:9 Cover Image */}
      {coverImage && (
        <div className="w-full aspect-[16/9] overflow-hidden bg-ds-surface-2 border-b border-ds-border">
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
        <div className="w-full px-4 py-3 bg-ds-surface-1 text-left">
          <h3 className="text-[15px] font-semibold text-ds-text-primary tracking-tight leading-snug line-clamp-2 transition-colors">
            {title}
          </h3>
        </div>
      )}
    </div>
  );
};

export default PostArticle;
