'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PollCard } from '@/components/home/PollCard';

const formatCompanyName = (name?: string): string => {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  if (words.length > 2) {
    return `${words[0]} ${words[1]}...`;
  }
  return name;
};

interface PostSharedContentProps {
  shared_post: any;
  sharedPollData?: any;
  isSharedVoting?: boolean;
  handleSharedVote?: (optionId: string) => void;
  isProfileView?: boolean;
}

export const PostSharedContent = ({
  shared_post,
  sharedPollData,
  isSharedVoting,
  handleSharedVote,
  isProfileView
}: PostSharedContentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!shared_post) return null;

  return (
    <div className="w-full mx-0 px-0 box-border mb-0 relative group/shared">
      {shared_post.isAvailable === false ? (
        <div className="p-6 rounded-xl border border-border bg-muted/40 backdrop-blur-md flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-1 text-2xl">
            {shared_post.unavailableReason === 'deleted' ? '🗑️' : '🔒'}
          </div>
          <p className="text-sm font-medium text-foreground">
            {shared_post.unavailableReason === 'deleted' ? 'Post Deleted' : 'Content Unavailable'}
          </p>
          {shared_post.unavailableReason === 'deleted' ? (
            <p className="text-xs text-muted-foreground mt-2">This post has been deleted by the original author.</p>
          ) : shared_post.unavailableReason === 'personal_connection' ? (
            <div className="flex flex-col items-center mt-2">
              <p className="text-xs text-muted-foreground">This is a Personal post.</p>
              <p className="text-xs text-muted-foreground">Connect with the author to view it.</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">This post is Private or restricted.</p>
          )}
          {shared_post.author && shared_post.author !== 'Unknown' && (
            <Link 
              href={shared_post.isCompanyPost ? `/organization/${shared_post.authorSlug}` : `/profile/${shared_post.authorSlug || shared_post.authorId}`} 
              className="text-sm text-primary hover:underline mt-2"
            >
              View {shared_post.author}&apos;s Profile
            </Link>
          )}
        </div>
      ) : shared_post.isJob ? (
        <Link href={`/jobs/${shared_post.jobId}`} className="block" onClick={(e) => e.stopPropagation()}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-md overflow-hidden p-4 flex gap-4 items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg bg-card overflow-hidden flex items-center justify-center border border-border/50 shadow-sm">
              {shared_post.jobLogo ? (
                <img src={shared_post.jobLogo} alt={shared_post.jobCompany || "Company logo"} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{shared_post.jobCompany?.charAt(0) || "J"}</span>
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <h4 className="text-base font-semibold text-foreground truncate">{shared_post.jobTitle}</h4>
              <p className="text-sm text-foreground/90 truncate font-medium">{formatCompanyName(shared_post.jobCompany)}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{shared_post.jobLocation}{shared_post.jobWorkMode ? ` (${shared_post.jobWorkMode})` : ''}</p>
            </div>
          </div>
        </Link>
      ) : (
        <Link href={`/post/${shared_post.id}`} className="block">
          <div className="feed-card-shell box-border flex flex-row items-start p-[16px] gap-[16px] w-full border border-transparent border-l-[1px] border-l-[#000000] bg-[#F3F5F7] dark:bg-zinc-800/50 rounded-[24px] rounded-tl-none mt-[8px] overflow-hidden transition-all hover:bg-gray-100 dark:hover:bg-zinc-800">
            
            {/* Left Column: Author Info & Text Content */}
            <div className="flex flex-col flex-1 min-w-0 justify-start gap-[8px]">
              {/* Header */}
              <div className="flex flex-row items-center gap-[8px] w-full">
                <div className="flex flex-row items-center gap-[8px]">
                  <div className="relative w-[32px] h-[32px] rounded-full overflow-hidden flex-shrink-0 bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-xs font-['Poppins'] select-none">
                    <span>{(shared_post.author || 'U').charAt(0).toUpperCase()}</span>
                    {shared_post.authorAvatar && shared_post.authorAvatar !== '/assets/pngegg.png' ? (
                      <img src={shared_post.authorAvatar} alt={shared_post.author} className="absolute inset-0 w-full h-full object-cover z-10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start min-w-0 overflow-hidden">
                    <span className="text-[14px] leading-[20px] font-[family-name:var(--font-poppins)] font-normal text-[#000000] dark:text-foreground truncate w-full block">
                      {shared_post.isCompanyPost ? formatCompanyName(shared_post.author) : shared_post.author}
                    </span>
                    <div className="flex flex-row items-center gap-[8px] text-[8px] leading-[12px] text-[#6B7280] font-normal font-[family-name:var(--font-poppins)]">
                      {shared_post.location && (() => {
                        const displayLocation = shared_post.location.split(',')[0].trim();
                        const truncatedLocation = displayLocation.length > 15 ? displayLocation.slice(0, 15) + '..' : displayLocation;
                        return <span className="truncate">{truncatedLocation}</span>;
                      })()}
                      {shared_post.location && (shared_post.timeAgo || 'Recently') && (
                        <span className="w-[4px] h-[4px] rounded-full bg-[#6B7280] shrink-0" />
                      )}
                      <span className="shrink-0">{shared_post.timeAgo || 'Recently'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Content */}
              {shared_post.content && (
                <div className="w-full relative mt-1">
                  <p className="text-[12px] md:text-[13px] leading-[18px] md:leading-[20px] font-[family-name:var(--font-poppins)] font-normal text-[#000000] dark:text-foreground w-full whitespace-pre-wrap line-clamp-3">
                    {(() => {
                      let c = shared_post.content;
                      if (!c) return c;
                      // Only replace trailing newlines and ellipsis if it ends with one
                      if (/[\s\r\n]+(…|\.{3})[\s\r\n]*$/.test(c)) {
                        return c.replace(/[\s\r\n]+(…|\.{3})[\s\r\n]*$/, '...');
                      }
                      return c;
                    })()}
                  </p>
                </div>
              )}

              {sharedPollData && (
                <div className="w-full mt-3" onClick={(e) => e.stopPropagation()}>
                  <PollCard poll={sharedPollData} onVote={handleSharedVote!} isLoading={isSharedVoting!} votedOptionId={sharedPollData.user_vote} />
                </div>
              )}
            </div>

            {/* Right Column: Media Thumbnail */}
            {(shared_post.imageSrc || shared_post.videoSrc) && (
              <div className="flex-none relative w-[88px] h-[88px] rounded-[16px] overflow-hidden self-start bg-[#D9D9D9]">
                {shared_post.videoSrc ? (
                  <video src={shared_post.videoSrc} className="w-full h-full object-cover" preload="metadata" playsInline />
                ) : shared_post.imageSrc ? (
                  <Image src={shared_post.imageSrc} alt="Shared post media" fill className="object-cover" sizes="88px" />
                ) : null}
              </div>
            )}
          </div>
        </Link>
      )}
    </div>
  );
};
