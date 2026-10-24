"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommentPollIcon,
  CommentArticleIcon,
  CommentMediaIcon,
  CommentIcon,
  RepostIcon,
  BusinessBuildingIcon,
  UserIcon,
} from '@/components/icons';
import { CommentActivityItem } from './activity.types';
import { resolveCommentPostData } from './activityUtils';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import RichTextRenderer from '@/features/feed/components/parts/RichTextRenderer';
import { saveScrollPosition } from '@/hooks/use-scroll-restoration';

interface CommentsActivityTabProps {
  data?: any[];
  removedItemIds: Set<string | number>;
  onRemove?: (e: React.MouseEvent, id: string | number) => void;
}

export function CommentsEmptyState() {
  return (
    <div className="w-full max-w-[680px] px-5 py-16 flex flex-col justify-center items-center gap-4 mx-auto select-none">
      <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
        <CommentIcon size={32} className="size-8 text-ds-text-secondary shrink-0" fill="currentColor" />
      </div>
      <div className="self-stretch flex flex-col justify-start items-center gap-1.5 text-center">
        <h3 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6 m-0">
          No comments yet
        </h3>
        <p className="max-w-[320px] text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 m-0">
          Comments you post on Cocpit will appear here.
        </p>
      </div>
    </div>
  );
}

export function CommentsActivityTab({ data, removedItemIds }: CommentsActivityTabProps) {
  const router = useRouter();

  const commentsList = useMemo<CommentActivityItem[]>(() => {
    if (!data || data.length === 0) return [];
    return data
      .filter((item) => {
        if (removedItemIds.has(item.id)) return false;
        if (item.isDeleted || item.is_deleted) return false;
        if (item.isDeactivated || item.is_deactivated) return false;
        const targetId = item.postId || item.id;
        if (!targetId || targetId === 'null' || targetId === 'undefined') return false;
        return true;
      })
      .map((item, index) => resolveCommentPostData(item, index));
  }, [data, removedItemIds]);

  if (commentsList.length === 0) {
    return <CommentsEmptyState />;
  }

  return (
    <div className="w-full flex flex-col justify-start items-start gap-4">
      {commentsList.map((item, index) => (
        <div
          key={item.uniqueKey || `comment-${item.id}-${index}`}
          id={item.postId ? `post-${item.postId}` : undefined}
          data-post-id={item.postId}
          onClick={(e) => {
            const targetId = item.postId;
            if (targetId) {
              if (typeof window !== 'undefined') {
                const mainEl = e.currentTarget.closest('main') || document.getElementById('settings-main-scroll-container');
                const scrollY = mainEl ? mainEl.scrollTop : window.scrollY;
                const rect = e.currentTarget.getBoundingClientRect();
                const containerTop = mainEl ? mainEl.getBoundingClientRect().top : 0;

                sessionStorage.setItem('cocpit_scroll_path', window.location.pathname);
                sessionStorage.setItem(`scroll-${window.location.pathname}`, scrollY.toString());
                sessionStorage.setItem('cocpit_scroll_y', scrollY.toString());
                sessionStorage.setItem('cocpit_activity_scroll_y', scrollY.toString());
                sessionStorage.setItem('cocpit_last_interacted_post_id', targetId.toString());
                sessionStorage.setItem('cocpit_last_interacted_post_viewport_top', (rect.top - containerTop).toString());

                saveScrollPosition('settings', targetId.toString());
              }
              router.push(`/post/${targetId}`);
            }
          }}
          className="w-full pb-4 border-b border-ds-border last:border-b-0 last:pb-0 inline-flex justify-start items-start gap-4 cursor-pointer group"
        >
          {/* Left 76x76 box */}
          {item.videoUrl || (item.imageUrl && item.imageUrl.match(/\.(mp4|webm|mov)(\?|#|$)/i)) ? (
            <div className="w-[76px] h-[76px] rounded-[8px] overflow-hidden shrink-0 bg-ds-surface-1 border border-ds-border flex items-center justify-center">
              <video
                className="w-full h-full object-cover pointer-events-none"
                src={`${item.videoUrl || item.imageUrl}#t=0.001`}
                muted
                playsInline
                preload="metadata"
              />
            </div>
          ) : item.imageUrl ? (
            <div className="w-[76px] h-[76px] rounded-[8px] overflow-hidden shrink-0 bg-ds-surface-1 border border-ds-border flex items-center justify-center">
              <img
                className="w-full h-full object-cover"
                src={item.imageUrl}
                alt="Media thumbnail"
              />
            </div>
          ) : item.mediaType === 'poll' ? (
            <div className="w-[76px] h-[76px] rounded-[8px] bg-ds-surface-1 shrink-0 border border-ds-border flex items-center justify-center">
              <CommentPollIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
            </div>
          ) : item.mediaType === 'article' ? (
            <div className="w-[76px] h-[76px] rounded-[8px] bg-ds-surface-1 shrink-0 border border-ds-border flex items-center justify-center">
              <CommentArticleIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
            </div>
          ) : item.mediaType === 'repost' ? (
            <div className="w-[76px] h-[76px] rounded-[8px] bg-ds-surface-1 shrink-0 border border-ds-border flex items-center justify-center">
              <RepostIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
            </div>
          ) : (
            <div className="w-[76px] h-[76px] rounded-[8px] bg-ds-surface-1 shrink-0 border border-ds-border flex items-center justify-center">
              <CommentMediaIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
            </div>
          )}

          {/* Right Details */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2 min-w-0">
            {/* Parent Post Title & Author */}
            <div className="w-full inline-flex justify-start items-center gap-2 min-w-0">
              <Avatar className={cn("size-6 shrink-0", item.isPostCompany ? "rounded-[6px]" : "rounded-full")}>
                <AvatarImage
                  src={(item.authorAvatarUrl && item.authorAvatarUrl !== "null") ? item.authorAvatarUrl : ""}
                  alt={item.postAuthor}
                  className={cn("object-cover", item.isPostCompany ? "rounded-[6px]" : "rounded-full")}
                />
                <AvatarFallback className={cn("bg-ds-surface-1 border border-ds-border", item.isPostCompany ? "rounded-[6px]" : "rounded-full")}>
                  {item.isPostCompany ? (
                    <BusinessBuildingIcon className="w-full h-full p-0.5 text-ds-text-primary" />
                  ) : (
                    <UserIcon className="w-[60%] h-[60%] text-current" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="truncate">
                <span className="text-ds-text-primary ds-text-body-2 leading-6 mr-2">
                  {item.postAuthor}
                </span>
                <span className="text-ds-text-primary ds-text-secondary leading-5">
                  {item.postTitle}
                </span>
              </div>
            </div>

            {/* Indented Comment */}
            <div className="w-full pl-8 inline-flex justify-start items-start gap-2">
              <Avatar className={cn("size-6 shrink-0", item.isCommenterCompany ? "rounded-[6px]" : "rounded-full")}>
                <AvatarImage
                  src={(item.commenterAvatarUrl && item.commenterAvatarUrl !== "null") ? item.commenterAvatarUrl : ""}
                  alt={item.commenter}
                  className={cn("object-cover", item.isCommenterCompany ? "rounded-[6px]" : "rounded-full")}
                />
                <AvatarFallback className={cn("bg-ds-surface-1 border border-ds-border", item.isCommenterCompany ? "rounded-[6px]" : "rounded-full")}>
                  {item.isCommenterCompany ? (
                    <BusinessBuildingIcon className="w-full h-full p-0.5 text-ds-text-primary" />
                  ) : (
                    <UserIcon className="w-[60%] h-[60%] text-current" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 flex flex-col justify-center items-start gap-2">
                <div className="w-full">
                  <span className="text-ds-text-primary ds-text-body-2 leading-6 mr-2 font-medium">
                    {item.commenter}
                  </span>
                  <span className="text-ds-text-primary ds-text-secondary leading-5 line-clamp-4 break-words">
                    <RichTextRenderer content={item.commentTextRaw || item.commentText} disableLinks />
                  </span>
                </div>


              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export default CommentsActivityTab;
