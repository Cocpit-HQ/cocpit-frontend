"use client";

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LikeFilledIcon, LikeIcon } from '@/components/icons';
import { LikeActivityItem } from './activity.types';
import { extractPostMedia, cleanActivityText } from './activityUtils';

interface LikesActivityTabProps {
  data?: any[];
  removedItemIds: Set<string | number>;
  onRemove: (e: React.MouseEvent, id: string | number) => void;
}

export function LikesEmptyState() {
  return (
    <div className="w-full max-w-[680px] px-5 py-16 flex flex-col justify-center items-center gap-4 mx-auto select-none">
      <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center shrink-0">
        <LikeIcon size={32} className="size-8 text-ds-text-secondary shrink-0" fill="currentColor" />
      </div>
      <div className="self-stretch flex flex-col justify-start items-center gap-1.5 text-center">
        <h3 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6 m-0">
          No activity yet
        </h3>
        <p className="max-w-[320px] text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 m-0">
          Your activity will appear here when you interact with posts, comments, or content.
        </p>
      </div>
    </div>
  );
}

export function LikesActivityTab({ data, removedItemIds, onRemove }: LikesActivityTabProps) {
  const router = useRouter();

  const likesList = useMemo<LikeActivityItem[]>(() => {
    if (!data || data.length === 0) return [];
    return data
      .filter((item) => !removedItemIds.has(item.id))
      .map((item) => {
        const media = extractPostMedia(item);
        return {
          id: item.id,
          postId: media.postId,
          user: item.user || item.author?.name || item.author?.fullName || 'User',
          role: item.role || item.author?.headline || 'Designer',
          avatarUrl: item.avatarUrl || item.author?.avatarUrl || item.author?.avatar || '',
          content: cleanActivityText(item.content || item.text || item.post?.content || item.post?.text || ''),
          type: (media.hasPoll ? 'poll' : media.thumbnailUrl ? 'media' : 'text') as 'media' | 'text' | 'poll',
          imageUrl: media.thumbnailUrl,
          pollQuestion: cleanActivityText(media.pollQuestion || item.content),
          pollMeta: media.pollMeta,
        };
      });
  }, [data, removedItemIds]);

  if (likesList.length === 0) {
    return <LikesEmptyState />;
  }

  return (
    <div className="w-full flex flex-col justify-start items-start gap-4">
      {likesList.map((item, index) => (
        <div
          key={`like-${item.id}-${index}`}
          onClick={() => {
            const targetId = item.postId || item.id;
            if (targetId && (typeof targetId === 'number' || !String(targetId).startsWith('like-'))) {
              router.push(`/post/${targetId}`);
            }
          }}
          className="w-full pb-4 border-b border-ds-border last:border-b-0 last:pb-0 flex flex-col justify-start items-start gap-3 cursor-pointer group"
        >
          {/* Post Header */}
          <div className="w-full inline-flex justify-between items-center">
            <div className="flex justify-start items-center gap-2">
              {item.avatarUrl ? (
                <img
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  src={item.avatarUrl}
                  alt={item.user}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-ds-surface-2 border border-ds-border text-ds-text-primary ds-text-small font-semibold flex items-center justify-center shrink-0">
                  {(item.user || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="inline-flex flex-col justify-center items-start">
                <span className="text-ds-text-primary ds-text-body-2 leading-6 group-hover:text-ds-text-primary">
                  {item.user}
                </span>
                <span className="text-ds-text-secondary ds-text-meta leading-3">
                  {item.role}
                </span>
              </div>
            </div>

            {/* Unlike / Heart Icon Button with accessible hit area */}
            <button
              type="button"
              onClick={(e) => onRemove(e, item.id)}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-ds-accent transition-transform hover:scale-110 active:scale-95 cursor-pointer bg-transparent border-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded-md"
              aria-label="Unlike post"
            >
              <LikeFilledIcon className="w-4 h-4 text-ds-accent" fill="currentColor" />
            </button>
          </div>

          {/* Post Content based on type */}
          {item.type === 'media' && item.imageUrl ? (
            <div className="w-full inline-flex justify-start items-center gap-4">
              <div className="w-20 h-20 rounded-[8px] overflow-hidden shrink-0 bg-ds-surface-1 border border-ds-border flex items-center justify-center">
                <img
                  className="w-full h-full object-cover"
                  src={item.imageUrl}
                  alt="Thumbnail"
                />
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
                {item.pollMeta || '281 votes • Poll closed'}
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
export default LikesActivityTab;
