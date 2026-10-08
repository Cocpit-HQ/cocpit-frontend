"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TagUserIcon, Icon } from '@/components/icons';
import { TagActivityItem } from './activity.types';
import { extractPostMedia, cleanActivityText } from './activityUtils';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TagsActivityTabProps {
  data?: any[];
  removedItemIds: Set<string | number>;
  onRemove: (e: React.MouseEvent, id: string | number, postId?: string) => void;
}


export function TagsEmptyState() {
  return (
    <div className="w-full max-w-[680px] px-5 py-16 flex flex-col justify-center items-center gap-4 mx-auto select-none">
      <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
        <TagUserIcon size={32} className="size-8 text-ds-text-secondary shrink-0" fill="currentColor" />
      </div>
      <div className="self-stretch flex flex-col justify-start items-center gap-1.5 text-center">
        <h3 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6 m-0">
          No tagged posts yet
        </h3>
        <p className="max-w-[320px] text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 m-0">
          Posts where you're mentioned or tagged will appear here.
        </p>
      </div>
    </div>
  );
}

export function TagsActivityTab({ data, removedItemIds, onRemove }: TagsActivityTabProps) {
  const router = useRouter();

  const tagsList = useMemo<TagActivityItem[]>(() => {
    if (!data || data.length === 0) return [];
    return data
      .filter((item) => !removedItemIds.has(item.id))
      .map((item) => {
        const media = extractPostMedia(item);
        return {
          id: item.id,
          postId: media.postId,
          user: item.user || item.author?.name || item.author?.fullName || 'User',
          role: (item.role === 'Member' ? '' : item.role) || (item.author?.headline === 'Member' ? '' : item.author?.headline) || '',
          avatarUrl: item.avatarUrl || item.author?.avatarUrl || item.author?.avatar || '',
          content: cleanActivityText(item.content || item.text || item.post?.content || item.post?.text || ''),
          type: (media.hasPoll ? 'poll' : (media.thumbnailUrl || media.videoUrl) ? 'media' : 'text') as 'media' | 'text' | 'poll',
          imageUrl: media.thumbnailUrl,
          videoUrl: media.videoUrl,
          pollQuestion: cleanActivityText(media.pollQuestion || item.content),
          pollMeta: media.pollMeta,
        };
      });
  }, [data, removedItemIds]);

  if (tagsList.length === 0) {
    return <TagsEmptyState />;
  }

  return (
    <div className="w-full flex flex-col justify-start items-start gap-4">
      {tagsList.map((item, index) => (
        <div
          key={`tag-${item.id}-${index}`}
          onClick={() => {
            const targetId = item.postId || item.id;
            if (targetId && (typeof targetId === 'number' || !String(targetId).startsWith('tag-'))) {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('cocpit_scroll_path', window.location.pathname);
              }
              router.push(`/post/${targetId}`);
            }
          }}
          className="w-full pb-4 border-b border-ds-border last:border-b-0 last:pb-0 flex flex-col justify-start items-start gap-3 cursor-pointer group"
        >
          {/* Post Header */}
          <div className="w-full inline-flex justify-between items-center">
            <div className="flex justify-start items-center gap-2 min-w-0">
              <Avatar className="size-8 rounded-full shrink-0">
                <AvatarImage
                  src={(item.avatarUrl && item.avatarUrl !== "null") ? item.avatarUrl : ""}
                  alt={item.user}
                  className="object-cover"
                />
                <AvatarFallback />
              </Avatar>
              <div className="inline-flex flex-col justify-center items-start min-w-0">
                <span className="text-ds-text-primary ds-text-body-2 leading-6 group-hover:text-ds-text-primary truncate w-full max-w-[200px] sm:max-w-[300px]">
                  {item.user}
                </span>
                {item.role && (
                  <span className="text-ds-text-secondary ds-text-meta leading-3 truncate w-full max-w-[200px] sm:max-w-[300px]">
                    {item.role}
                  </span>
                )}
              </div>
            </div>

            {/* Tag User SVG Icon Button with accessible hit area */}
            <button
              type="button"
              onClick={(e) => onRemove(e, item.id, item.postId ? String(item.postId) : undefined)}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-ds-accent transition-transform hover:scale-110 active:scale-95 cursor-pointer bg-transparent border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-md"
              aria-label="Remove tag"
            >
              <TagUserIcon className="w-5 h-5 text-ds-accent" fill="currentColor" />
            </button>
          </div>

          {/* Post Content */}
          {item.type === 'media' && (item.imageUrl || item.videoUrl) ? (
            <div className="w-full inline-flex justify-start items-center gap-4">
              <div className="relative w-[76px] h-[76px] rounded-[8px] overflow-hidden shrink-0 bg-ds-surface-1 border border-ds-border flex items-center justify-center">
                {(() => {
                  const isVideo = !!item.videoUrl || (item.imageUrl && typeof item.imageUrl === 'string' && !!item.imageUrl.match(/\.(mp4|mov|webm)(\?|#|$)/i));
                  const displayUrl = isVideo ? (item.videoUrl || item.imageUrl) : item.imageUrl;

                  return isVideo ? (
                    <>
                      <video
                        className="w-full h-full object-cover"
                        src={displayUrl}
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/20">
                          <Icon name="play" className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      className="w-full h-full object-cover"
                      src={displayUrl}
                      alt="Thumbnail"
                    />
                  );
                })()}
              </div>
              <div className="flex-1 self-stretch inline-flex flex-col justify-start items-start gap-2 min-w-0">
                <p className="w-full text-ds-text-primary ds-text-secondary leading-5 line-clamp-4 break-words">
                  {item.content}
                </p>
              </div>
            </div>
          ) : item.type === 'poll' ? (
            <div className="w-full p-3 bg-ds-surface-1 rounded-[8px] border border-ds-border flex flex-col justify-center items-start gap-1">
              <p className="w-full text-ds-text-primary ds-text-secondary leading-5 line-clamp-4 break-words">
                {item.pollQuestion || item.content}
              </p>
              <span className="w-full text-ds-text-secondary ds-text-meta-1 leading-3">
                {item.pollMeta || '0 votes'}
              </span>
            </div>
          ) : (
            <p className="w-full text-ds-text-primary ds-text-secondary leading-5 line-clamp-4 break-words">
              {item.content}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
export default TagsActivityTab;
