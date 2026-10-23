import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyProfileService } from '@/features/businessProfile';
import RichTextRenderer from '@/features/feed/components/parts/RichTextRenderer';
import { PostBody } from '../parts/PostBody';
import { saveScrollPosition } from '@/hooks/use-scroll-restoration';
import { UserIcon, BusinessBuildingIcon } from '@/components/icons';
import { useCompanyFollowPermission } from '@/hooks/useCompanyFollowPermission';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
interface SharedPreviewProps {
  sharedPost: any;
  sharedPostId?: string;
  sharedJobId?: string;
  isMobile: boolean;
  clickable?: boolean;
  showFollow?: boolean;
  disableNavigation?: boolean;
  onSeeMoreClick?: (e: React.MouseEvent) => void;
}

/** Changed: Added SharedVideoPreview component with IntersectionObserver for auto-playing shared post videos when in viewport */
const SharedVideoPreview = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.play().catch(() => { });
          } else {
            el.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div className="rounded-[4px] overflow-hidden bg-black relative flex justify-center items-center w-full h-[249px] shrink-0">
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        loop
        className="w-full h-full object-cover rounded-[4px]"
      />
    </div>
  );
};

const SharedPreview = ({ sharedPost, sharedPostId, sharedJobId, isMobile, clickable = true, showFollow, disableNavigation, onSeeMoreClick }: SharedPreviewProps) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  if (!sharedPost) return null;

  // disableNavigation is shorthand for clickable=false + showFollow=false (used in composer/edit contexts)
  const effectiveClickable = disableNavigation ? false : clickable;
  const canShowFollow = disableNavigation ? false : (showFollow !== undefined ? showFollow : clickable);

  // Job Preview
  if (sharedPost.isJob) {
    const jobId = sharedJobId || sharedPost?.jobId || sharedPost?.job_id || sharedPost?.id;
    return (
      <div
        onClick={(e) => {
          if (!effectiveClickable) return;
          if ((e.target as HTMLElement).closest('button, a')) return;
          if (jobId) {
            e.stopPropagation();
            router.push(`/jobs/${jobId}`);
          }
        }}
        className={`mt-4 border border-ds-border rounded-xl overflow-hidden bg-ds-surface-1 p-4 flex gap-4 items-center animate-in fade-in slide-in-from-top-2 ${effectiveClickable && jobId ? 'cursor-pointer hover:bg-ds-surface-2 transition-colors' : ''
          }`}
      >
        <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg bg-ds-surface-2 overflow-hidden flex items-center justify-center border border-ds-border shadow-sm">
          {sharedPost.jobLogo ? (
            <img src={sharedPost.jobLogo} alt={sharedPost.jobCompany || "Company"} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-2xl font-bold text-ds-text-muted">{sharedPost.jobCompany?.charAt(0) || "J"}</span>
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h4 className="text-base font-semibold text-ds-text-primary truncate">{sharedPost.jobTitle}</h4>
          <p className="text-sm text-ds-text-secondary truncate font-medium">{sharedPost.jobCompany}</p>
          <p className="text-xs text-ds-text-muted truncate mt-0.5">
            {sharedPost.jobLocation}
            {sharedPost.jobWorkMode ? ` (${sharedPost.jobWorkMode})` : ''}
          </p>
        </div>
        {!isMobile && (
          <div className="shrink-0 ml-4 hidden sm:block">
            <div className="px-4 py-1.5 rounded-full border border-[var(--ds-accent)] text-[var(--ds-accent)] text-sm font-medium shadow-sm">
              View job
            </div>
          </div>
        )}
      </div>
    );
  }

  // Post Preview
  console.log('sharedPost:', sharedPost);

  const sharedUser = sharedPost?.user
    || (typeof sharedPost?.author === 'object' ? sharedPost?.author : null)
    || sharedPost?.created_by
    || sharedPost?.posted_by;

  const sharedName = sharedUser?.name
    || sharedUser?.full_name
    || (sharedUser?.firstName && sharedUser?.lastName ? `${sharedUser.firstName} ${sharedUser.lastName}` : null)
    || (typeof sharedPost?.author === 'string' ? sharedPost?.author : null)
    || sharedPost?.userName
    || sharedPost?.authorName
    || sharedPost?.name;

  const sharedAvatar = sharedUser?.image
    || sharedUser?.avatar
    || sharedUser?.avatar_url
    || sharedUser?.profile_picture
    || sharedUser?.photo
    || sharedPost?.authorAvatar
    || sharedPost?.author_avatar
    || sharedPost?.authorImg
    || sharedPost?.image
    || sharedPost?.avatar_url;

  const sharedRole = sharedUser?.title
    || sharedUser?.role
    || sharedUser?.designation
    || sharedUser?.headline
    || sharedPost?.authorHeadline;

  const sharedLocation = sharedUser?.location
    || sharedPost?.location;

  const sharedSlug = sharedUser?.slug
    || sharedUser?.user_name
    || sharedUser?.username
    || sharedPost?.authorSlug;

  const sharedTime = sharedPost?.timeAgo
    || sharedPost?.created_at
    || sharedPost?.createdAt;

  // Normalize media
  const rawMediaList = Array.isArray(sharedPost?.images) && sharedPost.images.length > 0
    ? sharedPost.images
    : Array.isArray(sharedPost?.media) && sharedPost.media.length > 0
      ? sharedPost.media
      : Array.isArray(sharedPost?.media_urls) && sharedPost.media_urls.length > 0
        ? sharedPost.media_urls
        : [];

  const mediaUrls: string[] = rawMediaList
    .map((item: any) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        if (item.media_type === 'video' || item.type === 'video') return null;
        return item.url || item.src || null;
      }
      return null;
    })
    .filter(Boolean) as string[];

  if (mediaUrls.length === 0) {
    const singleImage = sharedPost?.imageSrc || sharedPost?.image || sharedPost?.achievement_image_url;
    if (typeof singleImage === 'string') {
      mediaUrls.push(singleImage);
    }
  }

  const videoSrc = sharedPost?.videoSrc
    || (typeof sharedPost?.video === 'string' ? sharedPost.video : null)
    || (Array.isArray(sharedPost?.media) ? sharedPost.media.find((m: any) => m?.media_type === 'video' || m?.type === 'video')?.url : null);

  // Poll Data Extraction
  const pollData = sharedPost?.poll || sharedPost?.pollData;
  const rawPollOptions: any[] = (Array.isArray(pollData?.options) && pollData.options.length > 0)
    ? pollData.options
    : (Array.isArray(sharedPost?.poll_options) && sharedPost.poll_options.length > 0)
      ? sharedPost.poll_options
      : (Array.isArray(sharedPost?.pollOptions) && sharedPost.pollOptions.length > 0)
        ? sharedPost.pollOptions
        : (Array.isArray((sharedPost as any)?.options) && (sharedPost as any).options.length > 0)
          ? (sharedPost as any).options
          : [];

  const contentText = sharedPost?.content
    || sharedPost?.description
    || sharedPost?.text
    || sharedPost?.title
    || sharedPost?.poll_question
    || pollData?.question
    || pollData?.poll_question;

  const { user: currentUser } = useAuth();
  const { followUser, unfollowUser, isFollowing, isFollowLoading, syncFollowStatus } = useSocial();
  const queryClient = useQueryClient();

  const authorUserId = sharedUser?.id?.toString()
    || sharedPost?.author_id?.toString()
    || sharedPost?.authorId?.toString()
    || sharedPost?.orgId?.toString();

  const isMe = currentUser?.id?.toString() === authorUserId;
  const { isCompanyActor, canFollow, message: noFollowMessage } = useCompanyFollowPermission();
  const isAuthorFollowing = authorUserId ? isFollowing(authorUserId) : false;
  const isAuthorFollowLoading = authorUserId ? isFollowLoading(authorUserId) : false;
  const isCompanyPost = sharedPost?.isCompanyPost || false;

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

  const handleToggleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompanyActor && !canFollow) {
      toast.error(noFollowMessage);
      return;
    }
    if (!authorUserId || isFollowActionLoading) return;
    setHasInteracted(true);
    if (isCompanyPost) {
      if (isAuthorFollowing) unfollowCompanyMutation.mutate(authorUserId);
      else followCompanyMutation.mutate({ orgId: authorUserId, sourcePostId: sharedPostId || sharedPost?.id?.toString() });
    } else {
      if (isAuthorFollowing) unfollowUser(authorUserId);
      else followUser(authorUserId, sharedPostId || sharedPost?.id?.toString());
    }
  };

  const targetPostId = sharedPostId || sharedPost?.id || sharedPost?.post_id || sharedPost?._id || sharedPost?.postId;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetSlug = sharedSlug || authorUserId;
    if (targetSlug) {
      router.push(isCompanyPost ? `/organization/${targetSlug}` : `/profile/${targetSlug}`);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!effectiveClickable) return;
    if ((e.target as HTMLElement).closest('button, a, [role="button"], [role="slider"], .prevent-card-click')) {
      return;
    }
    if (targetPostId) {
      e.stopPropagation();
      // Purpose of Bug Fix: Save current scroll position before navigating to original post from repost
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/post/') && !window.location.pathname.startsWith('/article/')) {
        saveScrollPosition("post", targetPostId.toString());
      }
      router.push(`/post/${targetPostId}`);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Card */}
      <div
        onClick={handleCardClick}
        className={`self-stretch py-[8px] px-[12px] rounded-[8px] border-[0.5px] border-ds-border flex flex-col gap-[12px] ${effectiveClickable && targetPostId ? 'cursor-pointer hover:border-ds-border transition-colors' : ''
          }`}
      >
        {/* Author row */}
        <div className="flex flex-row items-center gap-[8px] w-full">
          <div 
            onClick={handleProfileClick}
            className={`w-[32px] h-[32px] ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'} bg-ds-surface-2 text-ds-text-primary flex items-center justify-center font-semibold text-[14px] overflow-hidden flex-shrink-0 font-dmsans select-none cursor-pointer`}
          >
            {sharedAvatar && sharedAvatar !== '/assets/pngegg.png' && sharedAvatar !== '/images/companyonboarding/companyprofileDefault.jpg' && sharedAvatar !== 'null' && !avatarError ? (
              <img
                className={`w-full h-full object-cover ${isCompanyPost ? 'rounded-[8px]' : 'rounded-full'}`}
                src={sharedAvatar}
                alt={sharedName || 'avatar'}
                onError={() => setAvatarError(true)}
              />
            ) : isCompanyPost ? (
              <BusinessBuildingIcon className="w-[60%] h-[60%] text-current" />
            ) : (
              <UserIcon className="w-[60%] h-[60%] text-current" />
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span 
              onClick={handleProfileClick}
              className="text-ds-text-primary text-[16px] font-semibold font-dmsans leading-[24px] truncate cursor-pointer hover:opacity-80 transition-opacity"
            >
              {sharedName || 'Unknown User'}
            </span>
            {sharedRole && (
              <span className="text-ds-text-secondary text-[10px] font-normal font-dmsans leading-[12px] truncate">
                {sharedRole}
              </span>
            )}
            <div className="inline-flex items-center gap-[6px] mt-[2px]">
              {sharedLocation && (
                <span className="text-ds-text-secondary text-[10px] font-normal font-dmsans leading-[12px] truncate max-w-[120px]">
                  {sharedLocation}
                </span>
              )}
            </div>
          </div>

          {/* Follow Action */}
          {canShowFollow && !isMe && (!isAuthorFollowing || hasInteracted) && (
            <div className="flex flex-row items-center shrink-0 h-[24px] ml-auto">
              {isCompanyActor && !canFollow ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed">
                        <button
                          type="button"
                          disabled
                          className={cn(
                            isAuthorFollowing
                              ? `w-[65px] h-[24px] flex items-center justify-center font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center shrink-0 flex-none opacity-50 pointer-events-none rounded text-ds-text-primary`
                              : `h-[24px] px-1 flex items-center justify-center font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-[var(--ds-accent)] shrink-0 opacity-50 pointer-events-none rounded`
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
                      ? `w-[65px] h-[24px] cursor-pointer flex items-center justify-center font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center shrink-0 flex-none disabled:opacity-50 disabled:cursor-default outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded transition-opacity hover:opacity-80 text-ds-text-primary`
                      : `h-[24px] px-1 cursor-pointer flex items-center justify-center font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-[var(--ds-accent)] shrink-0 disabled:opacity-50 disabled:cursor-default outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded transition-opacity hover:opacity-90`
                  }
                >
                  {isAuthorFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          )}
        </div>
        {/* Content */}
        {contentText && (
          rawPollOptions.length > 0 ? (
            <div className="self-stretch justify-start text-[14px] font-medium font-dmsans leading-[20px] text-left text-ds-text-primary whitespace-pre-wrap break-words">
              {contentText}
            </div>
          ) : (
            <PostBody
              content={contentText}
              author={sharedName || 'Unknown User'}
              authorSlug={sharedSlug}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
              onSeeMoreClick={onSeeMoreClick}
              hasMedia={mediaUrls.length > 0 || !!videoSrc}
              maxLines={mediaUrls.length > 0 || !!videoSrc ? 2 : 15}
              disableLinks={disableNavigation}
              mentionedUsers={sharedPost.mentioned_users}
            />
          )
        )}

        {/* Poll Options Capsules (if poll) */}
        {rawPollOptions.length > 0 && (
          <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
            {rawPollOptions.map((opt: any, index: number) => {
              const optText = typeof opt === 'string'
                ? opt
                : (opt?.option_text || opt?.text || opt?.title || opt?.name || `Option ${index + 1}`);
              const optionId = opt?.option_id || opt?.id || String(index);
              const isSelected = pollData?.user_vote && pollData.user_vote === optionId;
              const hasVotes = pollData && typeof pollData.total_votes === 'number' && pollData.total_votes > 0;
              const voteCount = typeof opt?.vote_count === 'number' ? opt.vote_count : 0;
              const percentage = hasVotes ? Math.round((voteCount / pollData.total_votes) * 100) : 0;
              const showResult = Boolean(pollData?.user_vote || pollData?.is_active === false);

              if (showResult && hasVotes) {
                return (
                  <div
                    key={optionId}
                    className="self-stretch inline-flex justify-start items-center gap-2 w-full"
                  >
                    <div
                      className={`relative flex-1 px-3 py-1.5 rounded-[100px] border border-ds-border overflow-hidden flex justify-start items-center gap-2.5 min-w-0 ${isSelected ? 'border-ds-border' : 'bg-transparent'
                        }`}
                    >
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-300 ease-out rounded-[100px] ${
                          isSelected ? 'bg-ds-surface-2' : 'bg-ds-surface-1'
                        }`}
                        style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                      />
                      <span className="relative z-10 justify-start text-ds-text-primary text-[12px] font-normal font-dmsans leading-[16px] truncate">
                        {optText}
                      </span>
                    </div>
                    <div className="w-10 flex justify-end items-center gap-0.5 shrink-0">
                      <span className="text-ds-text-primary text-[12px] font-medium font-dmsans leading-[16px]">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={optionId}
                  className="self-stretch w-full px-3 py-1.5 rounded-[100px] border border-ds-border bg-transparent flex justify-start items-center gap-2.5 select-none"
                >
                  <span className="justify-start text-ds-text-primary text-[12px] font-normal font-dmsans leading-[16px] truncate">
                    {optText}
                  </span>
                </div>
              );
            })}

            {/* Poll Footer Info: Votes • Duration / Status */}
            {(pollData?.total_votes !== undefined || pollData?.duration || pollData?.is_active === false) && (
              <div className="inline-flex items-center gap-2 text-[11px] font-normal font-dmsans text-ds-text-muted mt-0.5">
                <span>
                  {`${pollData?.total_votes || 0} ${pollData?.total_votes === 1 ? 'vote' : 'votes'}`}
                </span>
                <span className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
                <span>
                  {pollData?.is_active === false
                    ? 'Poll closed'
                    : pollData?.duration
                    ? (pollData.duration.toLowerCase().includes('left')
                        ? pollData.duration
                        : `${pollData.duration} left`)
                    : '1 week left'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Nested Shared Post */}
        {sharedPost.shared_post && (
          <div className="w-full mt-2 pointer-events-none">
            <SharedPreview
              sharedPost={sharedPost.shared_post}
              isMobile={isMobile}
              clickable={false}
              showFollow={false}
            />
          </div>
        )}

        {/* Optional Media */}
        {mediaUrls.length > 0 ? (
          <div className="rounded-[4px] overflow-hidden bg-black/5 relative flex justify-center items-center w-full h-[249px] shrink-0">
            <img
              src={mediaUrls[0]}
              className="w-full h-full object-cover rounded-[4px]"
              alt="Shared Media"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            {mediaUrls.length > 1 && (
              <div className="absolute bottom-[8px] right-[8px] bg-black/60 text-[#FFECE6] text-[12px] px-[8px] py-[4px] rounded-full font-dmsans">
                +{mediaUrls.length - 1}
              </div>
            )}
          </div>
        ) : videoSrc ? (
          <SharedVideoPreview src={videoSrc} />
        ) : null}
      </div>
    </div>
  );
};

export default SharedPreview;
