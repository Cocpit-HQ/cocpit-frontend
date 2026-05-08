import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThumbsUp, MessageCircle } from 'lucide-react';
import { PollCard } from '@/components/home/PollCard';

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
  if (!shared_post) return null;

  return (
    <div className={`${isProfileView ? 'mx-2 mb-3' : 'mx-4 md:mx-6 mb-5'} relative group/shared`}>
      {shared_post.isAvailable === false ? (
        <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-1 text-2xl">
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
            <Link href={`/profile/${shared_post.authorSlug || shared_post.authorId}`} className="text-sm text-primary hover:underline mt-2">
              View {shared_post.author}&apos;s Profile
            </Link>
          )}
        </div>
      ) : shared_post.isJob ? (
        <Link href={`/jobs/${shared_post.jobId}`} className="block" onClick={(e) => e.stopPropagation()}>
          <div className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-md overflow-hidden transition-all duration-300 hover:bg-primary/10 hover:border-primary/40 hover:shadow-md p-4 flex gap-4 items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-border/50 shadow-sm">
              {shared_post.jobLogo ? (
                <img src={shared_post.jobLogo} alt={shared_post.jobCompany || "Company logo"} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{shared_post.jobCompany?.charAt(0) || "J"}</span>
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <h4 className="text-base font-semibold text-foreground truncate">{shared_post.jobTitle}</h4>
              <p className="text-sm text-foreground/90 truncate font-medium">{shared_post.jobCompany}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{shared_post.jobLocation}{shared_post.jobWorkMode ? ` (${shared_post.jobWorkMode})` : ''}</p>
            </div>
          </div>
        </Link>
      ) : (
        <Link href={`/post/${shared_post.id}`} className="block">
          <div className="box-border flex flex-col items-start p-[8px_16px] gap-[16px] w-full bg-white border border-[#EEF2FF] shadow-[0px_2px_4px_rgba(99,102,241,0.05)] rounded-[24px] transition-all duration-300 hover:shadow-md">
            {/* Header (Frame 2608569) */}
            <div className="flex flex-row items-center p-0 gap-[8px] w-full bg-white">
              <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-[#D9D9D9]">
                <img src={shared_post.authorAvatar || '/assets/pngegg.png'} alt={shared_post.author} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start p-0">
                <span className="text-[16px] leading-[24px] font-[family-name:var(--font-poppins)] font-normal text-black text-center">
                  {shared_post.author}
                </span>
                <span className="text-[10px] leading-[16px] font-[family-name:var(--font-poppins)] font-normal text-[#6B7280] text-center">
                  {shared_post.authorTitle || 'Member'}
                </span>
              </div>
            </div>

            {/* Content (Frame 2608605) */}
            <div className="flex flex-col items-start p-0 gap-[8px] w-full bg-white">
              {shared_post.content && (
                <p className="text-[12px] leading-[16px] font-[family-name:var(--font-poppins)] font-normal text-black w-full line-clamp-3">
                  {shared_post.content}
                </p>
              )}
              
              {sharedPollData && (
                <div className="w-full" onClick={(e) => e.stopPropagation()}>
                  <PollCard poll={sharedPollData} onVote={handleSharedVote!} isLoading={isSharedVoting!} votedOptionId={sharedPollData.user_vote} />
                </div>
              )}

              {shared_post.videoSrc ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#EEF2FF]">
                  <video src={shared_post.videoSrc} className="w-full h-full object-cover" preload="metadata" playsInline />
                </div>
              ) : shared_post.imageSrc ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#EEF2FF]">
                  <Image src={shared_post.imageSrc} alt="Shared post" fill className="object-cover" />
                </div>
              ) : null}

              {/* Metadata (Frame 2608604) */}
              <div className="flex flex-row items-center p-0 gap-[8px] w-full mt-2">
                <span className="text-[10px] leading-[16px] font-[family-name:var(--font-poppins)] font-normal text-[#6B7280]">
                  {shared_post.location || 'Global'}
                </span>
                <div className="w-[6px] h-[6px] rounded-full bg-[#6B7280]"></div>
                <span className="text-[10px] leading-[16px] font-[family-name:var(--font-poppins)] font-normal text-[#6B7280]">
                  {shared_post.timeAgo || 'Recently'}
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
};
