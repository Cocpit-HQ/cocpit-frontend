'use client';

import React, { useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from "@iconify/react";
import { TaggedPeoplePopover } from "@/shared/commonComponents/TaggedPeoplePopover";
import { useSocial } from '@/context/SocialContext';
import { companyProfileService } from '@/features/companyprofile/services/companyprofile.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  hideOptions?: boolean;
  variant?: 'default' | 'overlay';
}

const formatCompanyName = (name?: string): string => {
  return name || "";
};

export const PostHeader = ({
  id, author, authorId, authorAvatar, authorSlug, timeAgo, visibility,
  isMe, isOwnPost, isCompanyPost, poll, shared_post, content,
  optionsBtnRef, showOptions, setShowOptions, optionsPos, setOptionsPos,
  onEdit, onDelete, onToggleVisibility, onShowAnalytics, onReport, onNotInterested,
  location, tags, authorRole, title, hideOptions, variant = 'default'
}: PostHeaderProps) => {
  const [imgError, setImgError] = React.useState(false);
  const hasValidAvatar = Boolean(authorAvatar && authorAvatar !== '/assets/pngegg.png' && !imgError);
  const initial = author ? author.charAt(0).toUpperCase() : 'U';
  const { followUser, unfollowUser, isFollowing, isFollowLoading, syncFollowStatus } = useSocial();
  const isRepostWithoutThoughts = !!shared_post && (!content || content.trim() === '');
  const authorUserId = authorId?.toString();
  const isAuthorFollowing = authorUserId ? isFollowing(authorUserId) : false;
  const isAuthorFollowLoading = authorUserId ? isFollowLoading(authorUserId) : false;
  const router = useRouter();
  const queryClient = useQueryClient();

  const followCompanyMutation = useMutation({
    mutationFn: (orgId: string) => companyProfileService.followOrganization(orgId),
    onSuccess: (_, orgId) => {
      // Opt-in sync for SocialContext if we decide to store company IDs there
      syncFollowStatus(orgId, true);
      // Update state instead of invalidating to prevent "Organization not found" flicker
      if (authorSlug) {
        queryClient.setQueryData(["company", authorSlug], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            relationship: {
              ...(oldData.relationship || {}),
              is_following: true
            }
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
      queryClient.invalidateQueries({ queryKey: ["company_followers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    }
  });

  const unfollowCompanyMutation = useMutation({
    mutationFn: (orgId: string) => companyProfileService.unfollowOrganization(orgId),
    onSuccess: (_, orgId) => {
      syncFollowStatus(orgId, false);
      if (authorSlug) {
        queryClient.setQueryData(["company", authorSlug], (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            relationship: {
              ...(oldData.relationship || {}),
              is_following: false
            }
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
      queryClient.invalidateQueries({ queryKey: ["company_followers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["profileStats"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    }
  });

  const handleToggleFollowAuthor = () => {
    if (!authorUserId || isAuthorFollowLoading) return;

    if (isCompanyPost) {
      if (isAuthorFollowing) {
        unfollowCompanyMutation.mutate(authorUserId);
      } else {
        followCompanyMutation.mutate(authorUserId);
      }
    } else {
      if (isAuthorFollowing) {
        unfollowUser(authorUserId);
      } else {
        followUser(authorUserId);
      }
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
  const isOverlay = variant === 'overlay';

  return (
    <div className={`flex flex-row justify-between p-0 gap-[8px] w-full ${hideOptions ? 'items-center h-[56px] bg-white dark:bg-card' : 'items-start'} ${isOverlay ? 'z-10' : ''}`}>
      {/* Author Info (Frame 2608571) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          router.push(authorLink);
        }}
        className="flex flex-row items-center p-0 gap-[8px] flex-1 min-w-0 overflow-hidden cursor-pointer group"
      >
        {/* Avatar (Ellipse 10) */}
        <div className="w-10 h-10 min-w-10 min-h-10 rounded-full overflow-hidden flex-shrink-0 bg-white">
          {hasValidAvatar ? (
            <img
              src={authorAvatar}
              alt={author}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-[#EEF2FF] text-[#6366F1] font-semibold text-lg flex items-center justify-center font-[family-name:var(--font-poppins)] select-none">
              {initial}
            </div>
          )}
        </div>

        {/* Name & Role (Frame 2608568) */}
        <div className="flex flex-col items-start p-0 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1 min-h-[24px]">
            {isMe || (!isCompanyPost && !authorId) ? (
              <div className="flex items-baseline gap-1.5">
                <h3 className={`text-[16px] leading-[24px] font-[family-name:var(--font-poppins)] cursor-default ${hideOptions ? 'font-normal text-[#000000] dark:text-foreground' : (isOverlay ? 'font-medium text-white' : 'font-medium text-foreground')}`}>
                  {isCompanyPost ? formatCompanyName(author) : author}
                </h3>
              </div>
            ) : (
              <Link href={authorLink} className=" flex items-baseline gap-1.5" onClick={(e) => e.stopPropagation()}>
                <h3 className={`text-[16px] leading-[24px] font-[family-name:var(--font-poppins)] ${hideOptions ? 'font-normal text-[#000000] dark:text-foreground' : (isOverlay ? 'font-medium text-white hover:underline' : 'font-medium text-foreground')}`}>
                  {isCompanyPost ? formatCompanyName(author) : author}
                </h3>
              </Link>
            )}
            {shared_post && (
              <span className={`text-[10px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] ml-1 w-[45px] h-[16px] flex-none text-center ${isOverlay ? 'text-white/80' : 'text-[#6B7280]'}`}>
                reposted
              </span>
            )}
          </div>
          {!shared_post && (
            <div className={`text-[10px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] truncate w-full block ${hideOptions ? 'text-[#6B7280]' : (isOverlay ? 'text-white/80' : 'text-muted-foreground')}`} title={authorRole || title || ''}>
              {authorRole || title || ''}
            </div>
          )}
          {(location || (timeAgo && !isRepostWithoutThoughts)) && (() => {
            const displayLocation = location ? location.split(',')[0].trim() : '';
            const truncatedLocation = displayLocation.length > 15 ? displayLocation.slice(0, 15) + '..' : displayLocation;
            return (
              <div className={`flex items-center text-[10px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] ${hideOptions ? 'gap-[8px] text-[#6B7280]' : (isOverlay ? 'gap-1.5 text-white/80' : 'gap-1.5 text-muted-foreground')}`}>
                {location && <span title={location}>{truncatedLocation}</span>}
                {location && timeAgo && !isRepostWithoutThoughts && <span className={`rounded-full shrink-0 ${hideOptions ? 'w-[6px] h-[6px] bg-[#6B7280]' : (isOverlay ? 'w-1 h-1 bg-white/60' : 'w-1 h-1 bg-muted-foreground/40')}`} />}
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

          {!hideOptions && (
          <div className="relative">
            <button
              ref={optionsBtnRef}
              onClick={handleOptionsClick}
              className={`p-1 ${isOverlay ? 'text-white' : 'text-[#000000] dark:text-white'}`}
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
                        disabled={!authorUserId || isAuthorFollowLoading || followCompanyMutation.isPending || unfollowCompanyMutation.isPending}
                        className="flex items-start justify-between w-full px-4 py-2 cursor-pointer focus:bg-primary-tint focus:text-primary-tint-foreground rounded-3xl outline-none transition-colors"
                      >
                        <span className="text-sm font-normal font-poppins text-foreground break-words text-left pr-2">
                          {isCompanyPost 
                            ? (isAuthorFollowing ? `Unfollow company` : `Follow company`)
                            : (isAuthorFollowing ? `Unfollow user` : `Follow user`)
                          }
                        </span>
                        {hasValidAvatar ? (
                          <img src={authorAvatar} alt={author} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#6366F1] font-semibold text-xs flex items-center justify-center font-[family-name:var(--font-poppins)] select-none flex-shrink-0">
                            {initial}
                          </div>
                        )}
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
          )}
        </div>
      </div>
    </div>
  );
};
