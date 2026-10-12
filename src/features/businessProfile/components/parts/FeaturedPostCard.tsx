"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  LikeIcon,
  LikeFilledIcon,
  CommentIcon,
  RepostIcon,
  ShareIcon,
  SaveIcon,
  SaveFilledIcon,
  MenuIcon,
} from "@/components/icons";
import { formatCount } from "../../utils/postMediaUtils";

export interface FeaturedPostItem {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likesCount: number | string;
  commentsCount: number | string;
  repostsCount: number | string;
  sharesCount: number | string;
  isLiked?: boolean;
  isSaved?: boolean;
  isReposted?: boolean;
  repostId?: string | null;
}

interface FeaturedPostCardProps {
  post: FeaturedPostItem;
  orgName: string;
  orgLogo?: string;
  orgTagline?: string;
  onLike: (postId: string) => void;
  onSave: (postId: string, isSaved: boolean) => void;
  onComment: (postId: string) => void;
  onRepost: (postId: string, isReposted: boolean, repostId: string | null) => void;
  onShare: (postId: string) => void;
}

export function FeaturedPostCard({
  post,
  orgName,
  orgLogo,
  orgTagline,
  onLike,
  onSave,
  onComment,
  onRepost,
  onShare,
}: FeaturedPostCardProps) {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest('[role="button"]') ||
      target.closest('[role="menu"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="dialog"]') ||
      target.closest(".prevent-card-click")
    ) {
      return;
    }
    if (post.id) {
      router.push(`/post/${post.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex-1 w-full max-w-full sm:max-w-[378px] min-w-0 flex flex-col justify-start items-center gap-3 cursor-pointer"
    >
      {/* Frame 2608569: Card Author Header (height 32px, gap 8px) */}
      <div className="self-stretch w-full flex justify-between items-center h-8 gap-2 min-w-0">
        {/* Frame 2608571: Avatar + Name / Headline */}
        <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden">
          <img
            className="w-8 h-8 rounded-[12px] object-cover shrink-0"
            src={
              post.authorAvatarUrl ||
              orgLogo ||
              "/images/companyonboarding/companyprofileDefault.jpg"
            }
            alt={post.authorName || orgName}
          />
          <div className="flex-1 flex flex-col justify-start items-start min-w-0 w-full overflow-hidden">
            <span className="w-full text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 truncate block">
              {post.authorName || orgName}
            </span>
            <span className="w-full text-ds-text-secondary text-[10px] font-normal font-['DM_Sans'] leading-3 truncate block">
              {orgTagline || post.timestamp}
            </span>
          </div>
        </div>

        {/* Menu (20px x 20px) */}
        <button
          type="button"
          aria-label="Post options"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer shrink-0 ml-auto"
        >
          <MenuIcon className="w-5 h-5 text-ds-text-primary" fill="currentColor" />
        </button>
      </div>

      {/* Frame 2609511: Media Container (width 378px, height 442px, radius 8px) */}
      <div className="self-stretch w-full h-[400px] sm:h-[442px] relative rounded-[8px] overflow-hidden bg-ds-surface-1 border border-ds-border shrink-0">
        {post.imageUrl ? (
          <img
            className="w-full h-full object-cover rounded-[8px]"
            src={post.imageUrl}
            alt={post.content || "Post media"}
          />
        ) : post.videoUrl ? (
          <video
            src={post.videoUrl}
            controls
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full object-cover rounded-[8px]"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center bg-ds-surface-1 rounded-[8px]">
            <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] line-clamp-6">
              {post.content || "Post Content"}
            </span>
          </div>
        )}
      </div>

      {/* Frame 2609512: Card Actions Footer (padding-top 8px, height 28px, gap 8px) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="self-stretch w-full pt-2 flex flex-row justify-between items-center h-7 gap-2 prevent-card-click"
      >
        {/* Frame 2608620: Left Actions Group (gap 8px, height 20px) */}
        <div className="flex flex-row items-center gap-2 h-5">
          {/* Like (Frame 2609517) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLike(post.id);
            }}
            className="flex flex-row items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
          >
            {post.isLiked ? (
              <LikeFilledIcon className="w-5 h-5 text-ds-accent" fill="currentColor" />
            ) : (
              <LikeIcon className="w-5 h-5 text-ds-text-primary" fill="currentColor" />
            )}
            <span className="text-ds-text-primary text-xs font-normal font-['DM_Sans'] leading-4">
              {formatCount(post.likesCount)}
            </span>
          </button>

          {/* Comment (Frame 2609518) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onComment(post.id);
            }}
            className="flex flex-row items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <CommentIcon className="w-5 h-5 text-ds-text-primary" fill="currentColor" />
            <span className="text-ds-text-primary text-xs font-normal font-['DM_Sans'] leading-4">
              {formatCount(post.commentsCount)}
            </span>
          </button>

          {/* Repost (Frame 2609519) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRepost(post.id, Boolean(post.isReposted), post.repostId || null);
            }}
            className="flex flex-row items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <RepostIcon
              className={`w-5 h-5 ${post.isReposted ? "text-ds-accent" : "text-ds-text-primary"}`}
              fill="currentColor"
            />
            <span className="text-ds-text-primary text-xs font-normal font-['DM_Sans'] leading-4">
              {formatCount(post.repostsCount)}
            </span>
          </button>

          {/* Share (Frame 2609520) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(post.id);
            }}
            className="flex flex-row items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <ShareIcon className="w-5 h-5 text-ds-text-primary" fill="currentColor" />
            <span className="text-ds-text-primary text-xs font-normal font-['DM_Sans'] leading-4">
              {formatCount(post.sharesCount)}
            </span>
          </button>
        </div>

        {/* Save (20px x 20px) */}
        <button
          type="button"
          aria-label={post.isSaved ? "Remove from saved" : "Save post"}
          onClick={(e) => {
            e.stopPropagation();
            onSave(post.id, Boolean(post.isSaved));
          }}
          className="w-5 h-5 flex items-center justify-center cursor-pointer hover:opacity-85 transition-opacity shrink-0"
        >
          {post.isSaved ? (
            <SaveFilledIcon className="w-5 h-5 text-ds-accent" fill="currentColor" />
          ) : (
            <SaveIcon className="w-5 h-5 text-ds-text-primary" fill="currentColor" />
          )}
        </button>
      </div>
    </div>
  );
}
