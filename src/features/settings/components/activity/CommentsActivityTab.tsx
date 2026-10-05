"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommentPollIcon,
  CommentArticleIcon,
  CommentMediaIcon,
  CommentIcon,
} from '@/components/icons';
import { CommentActivityItem } from './activity.types';
import { resolveCommentPostData } from './activityUtils';

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
      .filter((item) => !removedItemIds.has(item.id))
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
          onClick={() => {
            const targetId = item.postId;
            if (targetId && (typeof targetId === 'number' || !String(targetId).startsWith('comment-'))) {
              router.push(`/post/${targetId}`);
            }
          }}
          className="w-full pb-4 border-b border-ds-border last:border-b-0 last:pb-0 inline-flex justify-start items-center gap-4 cursor-pointer group"
        >
          {/* Left 76x76 box */}
          {item.mediaType === 'poll' ? (
            <div className="w-[76px] h-[76px] rounded-[8px] bg-ds-surface-1 shrink-0 border border-ds-border flex items-center justify-center">
              <CommentPollIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
            </div>
          ) : item.mediaType === 'article' ? (
            <div className="w-[76px] h-[76px] rounded-[8px] bg-ds-surface-1 shrink-0 border border-ds-border flex items-center justify-center">
              <CommentArticleIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
            </div>
          ) : item.imageUrl ? (
            <div className="w-[76px] h-[76px] rounded-[8px] overflow-hidden shrink-0 bg-ds-surface-1 border border-ds-border flex items-center justify-center">
              <img
                className="w-full h-full object-cover"
                src={item.imageUrl}
                alt="Media thumbnail"
              />
            </div>
          ) : item.videoUrl ? (
            <div className="w-[76px] h-[76px] rounded-[8px] overflow-hidden shrink-0 bg-ds-surface-1 border border-ds-border flex items-center justify-center">
              <video
                className="w-full h-full object-cover pointer-events-none"
                src={`${item.videoUrl}#t=0.001`}
                muted
                playsInline
                preload="metadata"
              />
            </div>
          ) : (
            <div className="w-[76px] h-[76px] rounded-[8px] bg-ds-surface-1 shrink-0 border border-ds-border flex items-center justify-center">
              <CommentMediaIcon className="w-8 h-8 text-ds-accent" fill="currentColor" />
            </div>
          )}

          {/* Right Details */}
          <div className="flex-1 inline-flex flex-col justify-start items-start gap-2 min-w-0">
            {/* Parent Post Title & Author */}
            <div className="w-full inline-flex justify-start items-center gap-2">
              {item.authorAvatarUrl ? (
                <img
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                  src={item.authorAvatarUrl}
                  alt={item.postAuthor}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-ds-surface-2 border border-ds-border text-ds-text-primary ds-text-meta font-semibold flex items-center justify-center shrink-0">
                  {(item.postAuthor || '?').charAt(0).toUpperCase()}
                </div>
              )}
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
              {item.commenterAvatarUrl ? (
                <img
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                  src={item.commenterAvatarUrl}
                  alt={item.commenter}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-ds-surface-2 border border-ds-border text-ds-text-primary ds-text-meta font-semibold flex items-center justify-center shrink-0">
                  {(item.commenter || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center items-start gap-2">
                <div className="w-full">
                  <span className="text-ds-text-primary ds-text-body-2 leading-6 mr-2 font-medium">
                    {item.commenter}
                  </span>
                  <span className="text-ds-text-primary ds-text-secondary leading-5 line-clamp-4 break-words">
                    {item.commentText}
                  </span>
                </div>

                {/* Comment Metadata Action Row */}
                <div className="inline-flex justify-start items-center gap-4 ds-text-small text-ds-text-secondary leading-4">
                  <div className="flex justify-start items-center gap-2">
                    <span className="text-ds-text-primary">Like</span>
                    <span className="text-ds-text-primary">-</span>
                    <span className="text-ds-text-secondary">{item.likesCount} likes</span>
                  </div>
                  <div className="w-[1px] h-3 bg-ds-border" />
                  <div className="flex justify-start items-center gap-2">
                    <span className="text-ds-text-primary">Reply</span>
                    <span className="text-ds-text-primary">-</span>
                    <span className="text-ds-text-secondary">{item.repliesCount} reply</span>
                  </div>
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
