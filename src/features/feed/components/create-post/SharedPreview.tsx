import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyProfileService } from '@/features/companyprofile/services/companyprofile.service';
interface SharedPreviewProps {
  sharedPost: any;
  sharedPostId?: string;
  sharedJobId?: string;
  isMobile: boolean;
  clickable?: boolean;
  showFollow?: boolean;
  disableNavigation?: boolean;
}

const SharedPreview = ({ sharedPost, sharedPostId, sharedJobId, isMobile, clickable = true, showFollow, disableNavigation }: SharedPreviewProps) => {
  const router = useRouter();
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
        className={`mt-4 border border-ds-border rounded-xl overflow-hidden bg-ds-surface-1 p-4 flex gap-4 items-center animate-in fade-in slide-in-from-top-2 ${
          effectiveClickable && jobId ? 'cursor-pointer hover:bg-ds-surface-2 transition-colors' : ''
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
    || sharedPost?.authorImg
    || sharedPost?.image;

  const sharedRole = sharedUser?.title 
    || sharedUser?.role 
    || sharedUser?.designation
    || sharedUser?.headline
    || sharedPost?.authorHeadline;

  const sharedLocation = sharedUser?.location 
    || sharedPost?.location;

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

  const handleCardClick = (e: React.MouseEvent) => {
    if (!effectiveClickable) return;
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    if (targetPostId) {
      e.stopPropagation();
      router.push(`/post/${targetPostId}`);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Card */}
      <div 
        onClick={handleCardClick}
        className={`self-stretch py-[8px] px-[12px] rounded-[8px] border-[0.5px] border-ds-border flex flex-col gap-[12px] ${
          effectiveClickable && targetPostId ? 'cursor-pointer hover:border-ds-border transition-colors' : ''
        }`}
      >
        {/* Author row */}
        <div className="flex flex-row items-center gap-[8px] w-full">
          <div className="w-[32px] h-[32px] rounded-full bg-ds-surface-2 text-ds-text-primary flex items-center justify-center font-semibold text-[14px] overflow-hidden flex-shrink-0 font-dmsans select-none">
            {sharedAvatar && sharedAvatar !== '/assets/pngegg.png' ? (
              <img
                className="w-full h-full object-cover"
                src={sharedAvatar}
                alt={sharedName || 'avatar'}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span>{(sharedName || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-ds-text-primary text-[16px] font-semibold font-dmsans leading-[24px] truncate">
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
              <button 
                onClick={handleToggleFollow}
                disabled={isFollowActionLoading}
                className={
                  isAuthorFollowing
                    ? `w-[65px] h-[24px] cursor-pointer flex items-center justify-center font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center shrink-0 flex-none disabled:opacity-50 disabled:cursor-not-allowed outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded transition-opacity hover:opacity-80 text-ds-text-primary`
                    : `h-[24px] px-1 cursor-pointer flex items-center justify-center font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-[var(--ds-accent)] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed outline-none ring-0 focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded transition-opacity hover:opacity-90`
                }
              >
                {isAuthorFollowing ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          )}
        </div>
        {/* Content */}
        {contentText && (
          <p className="text-ds-text-primary text-[12px] font-normal font-dmsans leading-[16px] line-clamp-2">
            {contentText}
          </p>
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
                      className={`flex-1 px-3 py-1.5 rounded-[100px] border border-ds-border flex justify-start items-center gap-2.5 min-w-0 ${
                        isSelected ? 'bg-ds-surface-2 border-ds-border' : 'bg-transparent'
                      }`}
                    >
                      <span className="justify-start text-ds-text-primary text-[12px] font-normal font-dmsans leading-[16px] truncate">
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

            {/* Poll Footer Info: Votes • Duration */}
            {(pollData?.total_votes !== undefined || pollData?.duration) && (
              <div className="inline-flex items-center gap-2 text-[11px] font-normal font-dmsans text-ds-text-muted mt-0.5">
                <span>
                  {pollData?.is_active === false
                    ? 'Ended'
                    : `${pollData?.total_votes || 0} ${pollData?.total_votes === 1 ? 'vote' : 'votes'}`}
                </span>
                {pollData?.duration && (
                  <>
                    <span className="w-1 h-1 bg-ds-text-muted rounded-full shrink-0" />
                    <span>
                      {pollData.duration.toLowerCase().includes('left')
                        ? pollData.duration
                        : `${pollData.duration} left`}
                    </span>
                  </>
                )}
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
          <div className="rounded-[4px] overflow-hidden bg-black relative flex justify-center items-center w-full h-[249px] shrink-0">
            <video src={videoSrc} className="w-full h-full object-cover rounded-[4px]" controls={false} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SharedPreview;
