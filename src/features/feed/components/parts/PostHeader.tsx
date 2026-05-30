'use client';

import React from 'react';
import Link from 'next/link';
import { EyeOff, Edit2, BarChart2, Trash2, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Icon } from "@iconify/react";
import { TaggedPeoplePopover } from "@/shared/commonComponents/TaggedPeoplePopover";
import { useSocial } from '@/context/SocialContext';

interface PostHeaderProps {
  id: string | number;
  author: string;
  authorId?: string | number;
  authorAvatar?: string;
  authorSlug?: string;
  timeAgo: string;
  visibility: string;
  isMe: boolean;
  isOwnPost?: boolean;
  isCompanyPost?: boolean;
  poll?: any;
  shared_post?: any;
  optionsBtnRef: React.RefObject<HTMLButtonElement | null>;
  showOptions: boolean;
  setShowOptions: (val: boolean) => void;
  optionsPos: { top: number; right: number } | null;
  setOptionsPos: (pos: { top: number; right: number } | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onShowAnalytics: () => void;
  onReport: () => void;
  location?: string;
  tags?: any[];
  authorRole?: string;
  title?: string | null;
}

export const PostHeader = ({
  id, author, authorId, authorAvatar, authorSlug, timeAgo, visibility,
  isMe, isOwnPost, isCompanyPost, poll, shared_post,
  optionsBtnRef, showOptions, setShowOptions, optionsPos, setOptionsPos,
  onEdit, onDelete, onToggleVisibility, onShowAnalytics, onReport,
  location, tags, authorRole, title
}: PostHeaderProps) => {
  const avatarSrc = authorAvatar || '/assets/pngegg.png';
  const { followUser, unfollowUser, isFollowing, isFollowLoading } = useSocial();
  const authorUserId = authorId?.toString();
  const isAuthorFollowing = authorUserId ? isFollowing(authorUserId) : false;
  const isAuthorFollowLoading = authorUserId ? isFollowLoading(authorUserId) : false;

  const handleToggleFollowAuthor = () => {
    if (!authorUserId || isAuthorFollowLoading || isCompanyPost) return;

    if (isAuthorFollowing) {
      unfollowUser(authorUserId);
    } else {
      followUser(authorUserId);
    }
    setShowOptions(false);
  };

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showOptions) {
      const rect = optionsBtnRef.current?.getBoundingClientRect();
      if (rect) {
        setOptionsPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
      }
    }
    setShowOptions(!showOptions);
  };

  const authorLink = isCompanyPost ? `/organization/${authorSlug}` : `/profile/${authorSlug || authorId}`;

  return (
    <div className="flex flex-row justify-between items-start p-0 gap-[8px] w-full">
      {/* Author Info (Frame 2608571) */}
      <div className="flex flex-row items-center p-0 gap-[8px] flex-1 min-w-0 overflow-hidden">
        {/* Avatar (Ellipse 10) */}
        <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex-shrink-0 bg-muted">
          <img src={avatarSrc} alt={author} className="w-full h-full object-cover" />
        </div>

        {/* Name & Role (Frame 2608568) */}
        <div className="flex flex-col items-start p-0 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1 h-[24px]">
            {isMe || (!isCompanyPost && !authorId) ? (
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-foreground text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)] cursor-default">
                  {author}
                </h3>
                {authorSlug && (
                  <span className="text-[12px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)]">
                    @{authorSlug}
                  </span>
                )}
              </div>
            ) : (
              <Link href={authorLink} className="hover:underline flex items-baseline gap-1.5" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-foreground text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)]">
                  {author}
                </h3>
                {authorSlug && (
                  <span className="text-[12px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)]">
                    @{authorSlug}
                  </span>
                )}
              </Link>
            )}
            {isCompanyPost && (
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-primary" />
            )}
            {shared_post && (
              <span className="text-muted-foreground text-[14px] leading-[24px] font-normal font-[family-name:var(--font-poppins)] ml-1">
                reposted
              </span>
            )}
          </div>
          <Link href={`/post/${id}`} className="text-[10px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground truncate w-full block cursor-pointer" title={authorRole || title || ''} onClick={(e) => e.stopPropagation()}>
            {authorRole || title || ''}
          </Link>
          {(location || timeAgo) && (
            <div className="flex items-center gap-1.5 text-[10px] leading-[16px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)]">
              {location && <span>{location}</span>}
              {location && timeAgo && <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />}
              {timeAgo && <span>{timeAgo}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Metadata & Menu (Right side) */}
      <div className="flex flex-row items-center gap-[12px] h-[40px] flex-shrink-0">
        <div className="flex items-center gap-1">
          {/* Tag icon */}
          {tags && tags.length > 0 && (
            <TaggedPeoplePopover tags={tags} />
          )}

          <div className="relative">
            <button
              ref={optionsBtnRef}
              onClick={handleOptionsClick}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
            </button>

            {showOptions && optionsPos && typeof document !== 'undefined' && createPortal(
              <>
                <div className="fixed inset-0 z-[199]" onClick={() => setShowOptions(false)} />
                <div
                  className="fixed w-44 p-2 bg-card border border-indigo-200 dark:border-[#818CF8] rounded-tl-3xl rounded-bl-3xl rounded-br-3xl rounded-tr-none shadow-lg z-[200]"
                  style={{ top: optionsPos.top, right: optionsPos.right }}
                >
                  {!isOwnPost && (
                    <>
                      <button
                        onClick={handleToggleFollowAuthor}
                        disabled={!authorUserId || isAuthorFollowLoading || isCompanyPost}
                        className="flex items-center justify-between w-full px-4 py-2 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-3xl outline-none transition-colors"
                      >
                        <span className="text-sm font-normal font-poppins text-foreground truncate pr-2">
                          {isAuthorFollowing ? `Remove ${author}` : `Follow ${author}`}
                        </span>
                        <img src={avatarSrc} alt={author} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                      </button>
                      <button
                        onClick={() => { onReport(); setShowOptions(false); }}
                        className="flex items-center justify-between w-full px-4 py-2 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-3xl outline-none transition-colors"
                      >
                        <span className="text-sm font-normal font-poppins text-foreground">Report post</span>
                        <Icon icon="mdi:information-outline" className="w-6 h-6 text-foreground" />
                      </button>
                      <button
                        onClick={() => setShowOptions(false)}
                        className="flex items-center justify-between w-full px-4 py-2 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-3xl outline-none transition-colors"
                      >
                        <span className="text-sm font-normal font-poppins text-foreground">Not interested</span>
                        <Icon icon="hugeicons:cancel-01" className="w-6 h-6 text-foreground" style={{ strokeWidth: '1.5px' }} />
                      </button>
                    </>
                  )}

                  {isOwnPost && (
                    <>
                      {!poll && (
                        <button
                          onClick={() => { onEdit(); setShowOptions(false); }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit Post</span>
                        </button>
                      )}
                      {poll && (
                        <button
                          onClick={() => { onShowAnalytics(); setShowOptions(false); }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors border-b border-border"
                        >
                          <BarChart2 className="w-4 h-4" />
                          <span>View Poll Analytics</span>
                        </button>
                      )}
                      <button
                        onClick={onToggleVisibility}
                        className={cn(
                          "w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-b border-border text-foreground hover:bg-muted"
                        )}
                      >
                        {visibility === 'private' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        <span>{visibility === 'private' ? 'Make Public' : 'Make Private'}</span>
                      </button>
                      <button
                        onClick={onDelete}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </>,
              document.body
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
