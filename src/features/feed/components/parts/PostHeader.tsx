'use client';

import React, { useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  onNotInterested?: () => void;
  content?: string;
}

export const PostHeader = ({
  id, author, authorId, authorAvatar, authorSlug, timeAgo, visibility,
  isMe, isOwnPost, isCompanyPost, poll, shared_post, content,
  optionsBtnRef, showOptions, setShowOptions, optionsPos, setOptionsPos,
  onEdit, onDelete, onToggleVisibility, onShowAnalytics, onReport, onNotInterested,
  location, tags, authorRole, title
}: PostHeaderProps) => {
  const avatarSrc = authorAvatar || '/assets/pngegg.png';
  const { followUser, unfollowUser, isFollowing, isFollowLoading } = useSocial();
  const isRepostWithoutThoughts = !!shared_post && (!content || content.trim() === '');
  const authorUserId = authorId?.toString();
  const isAuthorFollowing = authorUserId ? isFollowing(authorUserId) : false;
  const isAuthorFollowLoading = authorUserId ? isFollowLoading(authorUserId) : false;
  const router = useRouter();

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

  useEffect(() => {
    if (!showOptions) return;

    const handleScroll = () => setShowOptions(false);

    // capture:true catches scroll on any scrollable ancestor
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [showOptions, setShowOptions]);

  const authorLink = isCompanyPost ? `/organization/${authorSlug}` : `/profile/${authorSlug || authorId}`;

  return (
    <div className="flex flex-row justify-between items-start p-0 gap-[8px] w-full">
      {/* Author Info (Frame 2608571) */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          router.push(authorLink);
        }}
        className="flex flex-row items-center p-0 gap-[8px] flex-1 min-w-0 overflow-hidden cursor-pointer group"
      >
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
              </div>
            ) : (
              <Link href={authorLink} className=" flex items-baseline gap-1.5" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-foreground text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)]">
                  {author}
                </h3>
              </Link>
            )}
            {isCompanyPost && (
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-primary" />
            )}
            {shared_post && (
              <span className="text-[#6B7280] text-[10px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] ml-1 w-[45px] h-[16px] flex-none text-center">
                reposted
              </span>
            )}
          </div>
          {!shared_post && (
            <div className="text-[10px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground truncate w-full block" title={authorRole || title || ''}>
              {authorRole || title || ''}
            </div>
          )}
          {(location || (timeAgo && !isRepostWithoutThoughts)) && (() => {
            const displayLocation = location ? location.split(',')[0].trim() : '';
            const truncatedLocation = displayLocation.length > 15 ? displayLocation.slice(0, 15) + '..' : displayLocation;
            return (
              <div className="flex items-center gap-1.5 text-[10px] leading-[16px] text-muted-foreground font-normal font-[family-name:var(--font-poppins)]">
                {location && <span title={location}>{truncatedLocation}</span>}
                {location && timeAgo && !isRepostWithoutThoughts && <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />}
                {timeAgo && !isRepostWithoutThoughts && <span className="shrink-0">{timeAgo}</span>}
              </div>
            );
          })()}
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
              className="text-[#000000] p-1"
            >
              <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
            </button>

            {showOptions && optionsPos && typeof document !== 'undefined' && createPortal(
              <>
                <div className="fixed inset-0 z-[199]" onClick={(e) => { e.stopPropagation(); setShowOptions(false); }} />
                <div
                  className="fixed w-[180px] p-2 bg-card border border-[#EEF2FF] dark:border-card-border-inner rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[0px] shadow-lg z-[200]"
                  style={{ top: optionsPos.top, right: optionsPos.right }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isOwnPost && (
                    <>
                      <button
                        onClick={handleToggleFollowAuthor}
                        disabled={!authorUserId || isAuthorFollowLoading || isCompanyPost}
                        className="flex items-start justify-between w-full px-4 py-2 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-3xl outline-none transition-colors"
                      >
                        <span className="text-sm font-normal font-poppins text-foreground break-words text-left pr-2">
                          {isAuthorFollowing ? `Unfollow user` : `Follow user`}
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
                        onClick={() => {
                          setShowOptions(false);
                          if (onNotInterested) onNotInterested();
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-3xl outline-none transition-colors"
                      >
                        <span className="text-sm font-normal font-poppins text-foreground">Not interested</span>
                        <Icon icon="fluent:eye-off-16-regular" className="w-6 h-6 text-foreground" />
                      </button>
                    </>
                  )}

                  {isOwnPost && (
                    <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(); setShowOptions(false); }}
                          className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-[#EEF2FF] hover:text-[#6366F1] focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors group"
                        >
                          <span className="text-[14px] font-[family-name:var(--font-poppins)] text-black group-hover:text-[#6366F1] group-focus:text-[#6366F1]">Edit post</span>
                          <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-black group-hover:text-[#6366F1] group-focus:text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                        </button>
                      {poll && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onShowAnalytics(); setShowOptions(false); }}
                          className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-[#EEF2FF] hover:text-[#6366F1] focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors group"
                        >
                          <span className="text-[14px] font-[family-name:var(--font-poppins)] text-black group-hover:text-[#6366F1] group-focus:text-[#6366F1]">View analytics</span>
                          <BarChart2 className="w-6 h-6 text-black group-hover:text-[#6366F1] group-focus:text-[#6366F1]" strokeWidth={1.5} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
                        className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-[#EEF2FF] hover:text-[#6366F1] focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors group"
                      >
                        <span className="text-[14px] font-[family-name:var(--font-poppins)] text-black group-hover:text-[#6366F1] group-focus:text-[#6366F1]">
                          {visibility === 'private' ? 'Make public' : 'Make private'}
                        </span>
                        {visibility === 'private' ? (
                          <Icon icon="hugeicons:view" className="w-6 h-6 text-black group-hover:text-[#6366F1] group-focus:text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                        ) : (
                          <Icon icon="hugeicons:view-off-slash" className="w-6 h-6 text-black group-hover:text-[#6366F1] group-focus:text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-red-50 focus:bg-red-50 text-[#FF6B6B] rounded-xl outline-none transition-colors"
                      >
                        <span className="text-[14px] font-[family-name:var(--font-poppins)]">Delete post</span>
                        <Icon icon="hugeicons:delete-02" className="w-6 h-6 text-[#FF6B6B]" style={{ strokeWidth: '1.5px' }} />
                      </button>
                    </div>
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
