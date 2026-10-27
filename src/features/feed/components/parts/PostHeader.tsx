import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon, BusinessBuildingIcon } from '@/components/icons';
import { useSocial } from '@/context/SocialContext';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyProfileService, businessProfileService } from '@/features/businessProfile';
import { PostMenuAccess } from '../../utils/postMenuAccess';
import { useCompanyFollowPermission } from '@/hooks/useCompanyFollowPermission';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PostHeaderProps {
  id: string | number;
  author: string;
  authorId?: string | number;
  authorAvatar?: string;
  authorSlug?: string;
  authorRole?: string;
  location?: string;
  timeAgo?: string;
  visibility?: string;
  isMe: boolean;
  menuAccess?: PostMenuAccess;
  isCompanyPost?: boolean;
  optionsBtnRef: React.RefObject<HTMLButtonElement | null>;
  showOptions: boolean;
  setShowOptions: (val: boolean) => void;
  setOptionsPos: (pos: { top: number; right: number } | null) => void;
  variant?: 'default' | 'overlay';
  hideMenu?: boolean;
}

export const PostHeader = ({
  id, author, authorId, authorAvatar, authorSlug, authorRole, location, timeAgo,
  isMe, menuAccess, isCompanyPost, optionsBtnRef, showOptions, setShowOptions, setOptionsPos,
  variant = 'default',
  hideMenu
}: PostHeaderProps) => {
  const [imgError, setImgError] = useState(false);
  const hideMenuEntirely = menuAccess === 'internal' || !!hideMenu;
  const queryClient = useQueryClient();
  const initial = author ? author.charAt(0).toUpperCase() : '?';

  const { followUser, unfollowUser, isFollowing, isFollowLoading, syncFollowStatus, isFollowingInitialized } = useSocial();
  const { isCompanyActor, canFollow, message: noFollowMessage } = useCompanyFollowPermission();
  const authorUserId = authorId?.toString();
  const isAuthorFollowing = authorUserId ? isFollowing(authorUserId) : false;
  const isAuthorFollowLoading = authorUserId ? isFollowLoading(authorUserId) : false;

  const subtitleItems: React.ReactNode[] = [];

  if (authorRole) {
    subtitleItems.push(
      <span key="headline" title={authorRole} className="block w-full truncate">
        {authorRole}
      </span>
    );
  }
  if (location) {
    const displayLocation = location.split(',')[0].trim();
    subtitleItems.push(
      <span key="location" title={location} className="block w-full truncate">
        {displayLocation}
      </span>
    );
  }
  if (timeAgo) {
    subtitleItems.push(
      <span key="time" className="block w-full truncate">
        {timeAgo}
      </span>
    );
  }

  const shouldAnimate = subtitleItems.length > 1;
  const [shiftCount, setShiftCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!shouldAnimate) return;
    let timeout: NodeJS.Timeout;
    const interval = setInterval(() => {
      setIsAnimating(true);
      timeout = setTimeout(() => {
        setIsAnimating(false);
        setShiftCount((prev) => prev + 1);
      }, 1000); // Exactly match the CSS transition duration
    }, 3000); // 3 seconds per cycle
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [shouldAnimate, subtitleItems.length]);

  const actualShift = shiftCount % subtitleItems.length;
  const displayItems = shouldAnimate
    ? [
      ...subtitleItems.slice(actualShift),
      ...subtitleItems.slice(0, actualShift),
    ]
    : subtitleItems;

  const { activeProfile, isCompany } = useActiveProfile();

  const followCompanyMutation = useMutation({
    mutationFn: ({ orgId, sourcePostId }: { orgId: string; sourcePostId?: string }) => {
      if (isCompany && activeProfile?.id) {
        return businessProfileService.organizationFollowOrganization(activeProfile.id, orgId, sourcePostId);
      }
      return companyProfileService.followOrganization(orgId, sourcePostId);
    },
    onSuccess: (_, { orgId }) => {
      syncFollowStatus(orgId, true);
      queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
      queryClient.invalidateQueries({ queryKey: ["company_followers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org_following", activeProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ["profileStats"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    }
  });

  const unfollowCompanyMutation = useMutation({
    mutationFn: (orgId: string) => {
      if (isCompany && activeProfile?.id) {
        return businessProfileService.organizationUnfollowOrganization(activeProfile.id, orgId);
      }
      return companyProfileService.unfollowOrganization(orgId);
    },
    onSuccess: (_, orgId) => {
      syncFollowStatus(orgId, false);
      queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
      queryClient.invalidateQueries({ queryKey: ["company_followers", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org_following", activeProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ["profileStats"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    }
  });

  const [hasInteracted, setHasInteracted] = useState(false);
  const isFollowActionLoading = isAuthorFollowLoading || followCompanyMutation.isPending || unfollowCompanyMutation.isPending;

  useEffect(() => {
    setHasInteracted(false);
  }, [id, authorUserId]);

  const handleToggleFollow = () => {
    if (isCompanyActor && !canFollow) {
      toast.error(noFollowMessage);
      return;
    }
    if (!authorUserId || isFollowActionLoading) return;
    setHasInteracted(true);
    if (isCompanyPost) {
      if (isAuthorFollowing) unfollowCompanyMutation.mutate(authorUserId);
      else followCompanyMutation.mutate({ orgId: authorUserId, sourcePostId: id.toString() });
    } else {
      if (isAuthorFollowing) unfollowUser(authorUserId);
      else followUser(authorUserId, id.toString());
    }
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

  const isOwnerOrInternal = isMe || menuAccess === 'owner' || menuAccess === 'internal';

  const profileHref = isCompanyPost
    ? (authorSlug ? `/organization/${authorSlug}` : '/business-profile')
    : (isMe ? '/profile' : `/profile/${authorUserId}`);

  return (
    <div className="flex flex-row justify-between items-center w-full min-h-[40px]">
      <div className="flex flex-row items-center gap-2 flex-grow min-w-0 pr-2">
        {/* Avatar */}
        <Link href={profileHref} className={`shrink-0 flex-none block outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'}`}>
          <div className={`w-[32px] h-[32px] overflow-hidden flex items-center justify-center shrink-0 flex-none ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} ${variant === 'overlay' ? 'bg-black/40 border border-white/30 shadow-md' : 'bg-ds-surface-2'
            }`}>
            {authorAvatar && authorAvatar !== "/images/companyonboarding/companyprofileDefault.jpg" && !imgError ? (
              <img
                src={authorAvatar}
                alt={author}
                className={`w-full h-full object-cover ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'}`}
                onError={() => setImgError(true)}
              />
            ) : isCompanyPost ? (
              <BusinessBuildingIcon className="w-full h-full p-1 text-ds-text-primary" />
            ) : (
              <Icon name="user" className="w-full h-full p-1 text-ds-text-primary" />
            )}
          </div>
        </Link>

        {/* Name and Subtitle */}
        <div className="flex flex-col items-start min-w-0 flex-1">
          <Link href={profileHref} className="block w-full outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded">
            <span className={`block w-full font-['DM_Sans'] font-semibold text-[16px] leading-[24px] truncate ${variant === 'overlay' ? 'text-white' : 'text-ds-text-primary'
              }`}>
              {author}
            </span>
          </Link>

          {/* Subtitle Area (Animated) */}
          {subtitleItems.length > 0 && (
            <div className="relative w-[50vw] md:w-[50%] h-[14px] mt-[2px] overflow-hidden">
              <div
                className="w-full flex flex-col transition-transform ease-in-out"
                style={{
                  transform: isAnimating ? 'translateY(-14px)' : 'translateY(0)',
                  transitionDuration: isAnimating ? '1000ms' : '0ms'
                }}
              >
                {displayItems.map((item, index) => {
                  let opacityClass = 'opacity-100';
                  if (shouldAnimate) {
                    if (isAnimating && index === 0) opacityClass = 'opacity-0';
                    else if (isAnimating && index === 1) opacityClass = 'opacity-100';
                    else if (!isAnimating && index === 0) opacityClass = 'opacity-100';
                    else opacityClass = 'opacity-0';
                  }

                  return (
                    <div
                      key={index}
                      className={`w-full h-[14px] flex items-center font-['DM_Sans'] font-normal text-[10px] leading-[14px] shrink-0 transition-opacity ease-in-out ${opacityClass} ${variant === 'overlay' ? 'text-white/80' : 'text-ds-text-secondary'
                        }`}
                      style={{ transitionDuration: isAnimating ? '1000ms' : '0ms' }}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Follow and Menu Actions */}
      <div className="flex flex-row items-center gap-2 shrink-0 h-[24px]">
        {!isOwnerOrInternal && isFollowingInitialized && (!isAuthorFollowing || hasInteracted) && (
          isCompanyActor && !canFollow ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip enableTouch>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-not-allowed">
                    <button
                      type="button"
                      disabled
                      className={cn(
                        isAuthorFollowing
                          ? `w-[65px] h-[24px] flex items-center justify-center font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-center shrink-0 flex-none pointer-events-none rounded ${variant === 'overlay' ? 'text-white' : 'text-ds-text-primary'}`
                          : `h-[24px] px-1 flex items-center justify-center font-['DM_Sans'] font-semibold text-[14px] leading-[20px] text-[var(--ds-accent)] shrink-0 pointer-events-none rounded`
                      )}
                    >
                      {isAuthorFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-['DM_Sans'] z-50">
                  {noFollowMessage}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              onClick={handleToggleFollow}
              disabled={isFollowActionLoading}
              className={
                isAuthorFollowing
                  ? `w-[65px] h-[24px] cursor-pointer flex items-center justify-center font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-center shrink-0 flex-none disabled:opacity-50 disabled:cursor-default outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded transition-opacity hover:opacity-80 ${variant === 'overlay' ? 'text-white' : 'text-ds-text-primary'
                  }`
                  : `h-[24px] px-1 cursor-pointer flex items-center justify-center font-['DM_Sans'] font-semibold text-[14px] leading-[20px] text-[var(--ds-accent)] shrink-0 disabled:opacity-50 disabled:cursor-default outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded transition-opacity hover:opacity-90`
              }
            >
              {isAuthorFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )
        )}

        {!hideMenuEntirely && (
          <button
            ref={optionsBtnRef}
            onClick={handleOptionsClick}
            className={`w-[20px] h-[20px] cursor-pointer flex items-center justify-center outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded ${variant === 'overlay' ? 'text-white' : 'text-ds-text-primary'
              }`}
            aria-label="Post options"
          >
            <Icon name="menu" className="w-[20px] h-[20px]" />
          </button>
        )}
      </div>
    </div>
  );
};
