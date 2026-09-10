import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { useSocial } from '@/context/SocialContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyProfileService } from '@/features/companyprofile/services/companyprofile.service';
import { PostMenuAccess } from '../../utils/postMenuAccess';

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
}

export const PostHeader = ({
  id, author, authorId, authorAvatar, authorSlug, authorRole, location, timeAgo,
  isMe, menuAccess, isCompanyPost, optionsBtnRef, showOptions, setShowOptions, setOptionsPos,
  variant = 'default'
}: PostHeaderProps) => {
  const [imgError, setImgError] = useState(false);
  const hideMenuEntirely = menuAccess === 'internal';
  const queryClient = useQueryClient();
  const initial = author ? author.charAt(0).toUpperCase() : '?';
  
  const { followUser, unfollowUser, isFollowing, isFollowLoading, syncFollowStatus } = useSocial();
  const authorUserId = authorId?.toString();
  const isAuthorFollowing = authorUserId ? isFollowing(authorUserId) : false;
  const isAuthorFollowLoading = authorUserId ? isFollowLoading(authorUserId) : false;
  
  const subtitleItems: React.ReactNode[] = [];
  
  if (authorRole) {
    subtitleItems.push(
      <span key="headline" title={authorRole} className="truncate">
        {authorRole}
      </span>
    );
  }
  if (location) {
    const displayLocation = location.split(',')[0].trim();
    const truncatedLocation = displayLocation.length > 15 ? displayLocation.slice(0, 15) + '..' : displayLocation;
    subtitleItems.push(
      <span key="location" title={location} className="truncate">
        {truncatedLocation}
      </span>
    );
  }
  if (timeAgo) {
    subtitleItems.push(
      <span key="time" className="truncate">
        {timeAgo}
      </span>
    );
  }

  const shouldAnimate = subtitleItems.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % subtitleItems.length);
    }, 3000); // Wait 3s before swapping
    return () => clearInterval(interval);
  }, [shouldAnimate, subtitleItems.length]);

  const followCompanyMutation = useMutation({
    mutationFn: ({ orgId, sourcePostId }: { orgId: string; sourcePostId?: string }) => companyProfileService.followOrganization(orgId, sourcePostId),
    onSuccess: (_, { orgId }) => {
      syncFollowStatus(orgId, true);
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
      queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
      queryClient.invalidateQueries({ queryKey: ["company_followers", orgId] });
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

  const profileHref = isCompanyPost && authorSlug
    ? `/organization/${authorSlug}`
    : `/profile/${authorUserId}`;

  return (
    <div className="flex flex-row justify-between items-center w-full min-h-[40px]">
      <div className="flex flex-row items-center gap-2 flex-grow pr-2">
        {/* Avatar */}
        <Link href={profileHref} className="shrink-0 flex-none block outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded-full">
          <div className={`w-[32px] h-[32px] rounded-full overflow-hidden flex items-center justify-center shrink-0 flex-none ${
            variant === 'overlay' ? 'bg-black/40 border border-white/30 shadow-md' : 'bg-ds-surface-2'
          }`}>
            {authorAvatar && !imgError ? (
              <img 
                src={authorAvatar} 
                alt={author} 
                className="w-full h-full object-cover rounded-full" 
                onError={() => setImgError(true)} 
              />
            ) : (
              <span className={`text-[11px] font-medium ${variant === 'overlay' ? 'text-white' : 'text-ds-text-primary'}`}>{initial}</span>
            )}
          </div>
        </Link>
        
        {/* Name and Subtitle */}
        <div className="flex flex-col items-start min-w-0">
          <Link href={profileHref} className="block w-full outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded">
            <span className={`block w-full font-['DM_Sans'] font-semibold text-[16px] leading-[24px] truncate ${
              variant === 'overlay' ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-ds-text-primary'
            }`}>
              {author}
            </span>
          </Link>
          
          {/* Subtitle Area (Animated) */}
          {subtitleItems.length > 0 && (
            <div className="relative w-full h-[14px] mt-[2px] overflow-hidden">
              {subtitleItems.map((item, index) => (
                <div 
                  key={index}
                  className={`absolute inset-0 w-full flex items-center font-['DM_Sans'] font-normal text-[10px] leading-[14px] truncate transition-all duration-[800ms] ease-in-out ${
                    variant === 'overlay' ? 'text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-ds-text-secondary'
                  } ${
                    !shouldAnimate || activeIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Follow and Menu Actions */}
      <div className="flex flex-row items-center gap-2 shrink-0 h-[24px]">
        {!isMe && (!isAuthorFollowing || hasInteracted) && (
          <button 
            onClick={handleToggleFollow}
            disabled={isFollowActionLoading}
            className={
              isAuthorFollowing
                ? `w-[65px] h-[24px] cursor-pointer flex items-center justify-center font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-center shrink-0 flex-none disabled:opacity-50 disabled:cursor-not-allowed outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded transition-opacity hover:opacity-80 ${
                    variant === 'overlay' ? 'text-white' : 'text-ds-text-primary'
                  }`
                : `h-[24px] px-1 cursor-pointer flex items-center justify-center font-['DM_Sans'] font-semibold text-[14px] leading-[20px] text-[var(--ds-accent)] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded transition-opacity hover:opacity-90`
            }
          >
            {isAuthorFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
        
        {!hideMenuEntirely && (
          <button 
            ref={optionsBtnRef}
            onClick={handleOptionsClick}
            className={`w-[20px] h-[20px] cursor-pointer flex items-center justify-center outline-none ring-0 focus-visible:ring-2 focus-visible:ring-ds-accent rounded ${
              variant === 'overlay' ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : 'text-ds-text-primary'
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
