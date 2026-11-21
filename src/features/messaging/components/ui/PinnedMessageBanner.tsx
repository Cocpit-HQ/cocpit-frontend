"use client";

import React from "react";
import { Message } from "@/types/messaging";
import { PinIcon, PollIcon, FileTextIcon, BriefcaseIcon } from "@/components/icons";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { stripMentionSyntax } from "@/lib/mentions";
import { useQuery } from "@tanstack/react-query";

interface PinnedMessageBannerProps {
  message?: Message | null;
  pinnedMessageId: string | null;
  onScrollToMessage: (messageId: string) => void;
  onUnpin?: () => void;
  className?: string;
}

export function PinnedMessageBanner({
  message,
  pinnedMessageId,
  onScrollToMessage,
  onUnpin,
  className,
}: PinnedMessageBannerProps) {
  if (!pinnedMessageId) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onScrollToMessage(pinnedMessageId);
  };

  const rawText = message?.text || message?.text_content || "";
  const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:posts?))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i;
  const match = rawText.match(postUrlRegex);
  const effectivePostId =
    message?.sharedPostId ||
    (message as any)?.shared_post_id ||
    ((message?.entityType === "post" || message?.entityType === "article") ? message?.entityId : null) ||
    match?.[1] ||
    null;

  const { data: asyncPost } = useQuery({
    queryKey: ["repliedPostPreview", effectivePostId],
    queryFn: async () => {
      if (!effectivePostId) return null;
      const { getPostById } = await import("@/services/api/posts");
      const backendPost = await getPostById(effectivePostId);
      if (!backendPost || (backendPost as any).is_active === false || (backendPost as any).is_removed) {
        return null;
      }
      const media =
        backendPost.media?.map((m: any) => ({
          url: m.url || m.media_url || m.thumbnail_url || "",
          type: (m.media_type || m.type || (m.duration_seconds || (m.url && /\.(mp4|webm|mov)(\?|#|$)/i.test(m.url)) ? "video" : "image")) as "image" | "video",
        })) || [];
      return {
        id: backendPost.post_id,
        content: backendPost.content || "",
        post_type: backendPost.post_type,
        poll: backendPost.poll,
        title: backendPost.title,
        media,
      };
    },
    enabled: Boolean(effectivePostId),
    staleTime: 300000,
    gcTime: 600000,
  });

  const isJobEntity =
    message?.entityType === "job" ||
    message?.entityType === "offer" ||
    (message as any)?.entity_type === "job" ||
    (message as any)?.entity_type === "offer";
  const jobUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/jobs\/([a-zA-Z0-9_-]+)/i;
  const matchJobUrl = rawText.match(jobUrlRegex);
  const effectiveJobId =
    (isJobEntity && (message?.entityId || (message as any)?.entity_id)) ||
    matchJobUrl?.[1] ||
    null;
  const isJob = Boolean(effectiveJobId);

  const hasJobMessageText = Boolean(
    rawText &&
    !rawText.startsWith("http://") &&
    !rawText.startsWith("https://") &&
    ![
      "",
      "shared a job",
      "shared job",
      "shared an offer",
      "job",
      "offer",
    ].includes(rawText.trim().toLowerCase()) &&
    !jobUrlRegex.test(rawText.trim())
  );
  const isJobCardOnly = isJob && !hasJobMessageText;

  const { data: asyncJob } = useQuery({
    queryKey: ["jobContext", message?.entityType || "job", effectiveJobId],
    queryFn: async () => {
      if (!effectiveJobId) return null;
      const { safeGetJobById } = await import("../messages/SharedJobMessage");
      const jobData = await safeGetJobById(effectiveJobId);
      if (jobData && !("notFound" in jobData)) {
        return jobData;
      }
      return null;
    },
    enabled: Boolean(effectiveJobId),
    staleTime: 300000,
  });

  const effectiveSharedPost = message?.sharedPost || asyncPost;
  const effectiveSharedProfile = message?.sharedProfile;

  const normType = ((message as any)?.mediaType || (message?.media?.[0] as any)?.type || (message?.media?.[0] as any)?.media_type || "").toLowerCase();
  const nameStr = (message?.media?.[0]?.name || "").toLowerCase();
  const contentStr = rawText.toLowerCase().trim();

  // 1. Poll variant
  const pollData = (message as any)?.poll || effectiveSharedPost?.poll || (effectiveSharedPost?.post_type === "poll" ? { question: effectiveSharedPost.content } : null);
  const isPoll = Boolean(pollData || effectiveSharedPost?.post_type === "poll" || normType === "poll");
  const rawPollQuestion =
    (typeof pollData?.question === "string" && pollData.question && pollData.question.trim().toLowerCase() !== "poll" && !pollData.question.startsWith("http") ? pollData.question : null) ||
    (effectiveSharedPost?.content && !effectiveSharedPost.content.startsWith("http") && effectiveSharedPost.content.trim().toLowerCase() !== "poll" ? effectiveSharedPost.content : null) ||
    ((effectiveSharedPost as any)?.title && !(effectiveSharedPost as any).title.startsWith("http") && (effectiveSharedPost as any).title.trim().toLowerCase() !== "poll" ? (effectiveSharedPost as any).title : null) ||
    (!contentStr.startsWith("http") && contentStr !== "poll" ? rawText : null) ||
    "Poll";
  const pollQuestion = rawPollQuestion.startsWith("http") ? "Poll" : rawPollQuestion;

  // 2. Profile variant
  const isProfile = Boolean(
    effectiveSharedProfile ||
    message?.sharedProfileId ||
    ["profile", "company"].includes((message?.entityType || "").toLowerCase()) ||
    contentStr.includes("/profile/") ||
    contentStr.includes("/organization/") ||
    contentStr.includes("/company/")
  );

  // 3. Document variant
  const isDocType = normType === "document" || normType === "file";
  const hasDocExt = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i.test(nameStr || contentStr);
  const isDocument = !isPoll && !isProfile && (isDocType || hasDocExt);

  // 4. Post / Media variant (all post with content or without and for only image or video)
  const effectiveMediaUrl =
    message?.media?.[0]?.url ||
    effectiveSharedPost?.media?.[0]?.url ||
    ((effectiveSharedPost as any)?.media?.[0]?.media_url ?? null) ||
    ((effectiveSharedPost as any)?.media?.[0]?.thumbnail_url ?? null) ||
    ((effectiveSharedPost as any)?.image ?? null);

  const rawMediaType = (effectiveSharedPost?.media?.[0]?.type || (effectiveSharedPost as any)?.media?.[0]?.media_type || normType || "").toLowerCase();
  const isVideo = !isPoll && !isProfile && !isDocument && (
    rawMediaType === "video" ||
    normType === "video" ||
    nameStr.endsWith(".mp4") || nameStr.endsWith(".mov") || nameStr.endsWith(".webm") ||
    contentStr.endsWith(".mp4") || contentStr.endsWith(".mov") || contentStr.endsWith(".webm") ||
    Boolean(effectiveMediaUrl && /\.(mp4|webm|mov)(\?|#|$)/i.test(effectiveMediaUrl))
  );

  const isPostOrMedia = !isPoll && !isProfile && !isDocument && Boolean(
    effectivePostId ||
    effectiveSharedPost ||
    effectiveMediaUrl ||
    (message?.media && message.media.length > 0)
  );

  function isGenericMediaText(str: string) {
    return [
      "poll",
      "attachment",
      "photo",
      "video",
      "document",
      "sent a photo",
      "sent a video",
      "sent a document",
      "shared a post",
    ].includes((str || "").trim().toLowerCase());
  }

  const postTextToDisplay =
    (effectiveSharedPost?.content && !effectiveSharedPost.content.startsWith("http") && !isGenericMediaText(effectiveSharedPost.content) ? effectiveSharedPost.content : null) ||
    ((effectiveSharedPost as any)?.title && !(effectiveSharedPost as any).title.startsWith("http") ? (effectiveSharedPost as any).title : null) ||
    (rawText && !rawText.startsWith("http") && !isGenericMediaText(contentStr) && rawText.trim() !== nameStr ? rawText : null) ||
    (isVideo ? "Video" : "Photo");

  return (
    <div
      role="region"
      aria-label="Pinned message banner"
      className={cn(
        "w-full px-4 py-2 flex items-center bg-[var(--ds-surface-1)] border-b border-[var(--ds-border)] select-none z-20 shrink-0 self-stretch",
        className
      )}
    >
      {/* Message row (Frame 2610125) */}
      <div className="w-full flex items-center justify-between gap-[10px] shrink-0 self-stretch">
        {isJobCardOnly ? (
          /* Job Variant */
          <button
            type="button"
            onClick={handleClick}
            aria-label={`Scroll to pinned job: ${asyncJob?.title || "Job"}`}
            title="Scroll to pinned job"
            className="box-border min-w-[219px] max-w-[calc(100%-34px)] sm:max-w-[340px] h-[54px] p-[8px_12px] flex flex-row items-center gap-2 rounded-[16px] border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-2)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)]"
          >
            <div className="w-9 h-9 rounded-[8px] bg-[var(--ds-surface-2)] flex items-center justify-center shrink-0">
              <BriefcaseIcon className="w-4 h-4 text-[var(--ds-text-primary)]" size={18} />
            </div>
            <div className="flex flex-col justify-center items-start min-w-0 flex-1 overflow-hidden">
              <div className="flex flex-row items-center min-w-0 max-w-full">
                <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-[var(--ds-text-primary)] truncate shrink-0 max-w-[140px]">
                  {asyncJob?.title || "Job"}
                </span>
                {(asyncJob?.company || (asyncJob as any)?.company_name) && (
                  <>
                    <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-[var(--ds-text-secondary)] mx-1 shrink-0">
                      •
                    </span>
                    <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-[var(--ds-text-secondary)] truncate min-w-0">
                      {asyncJob?.company || (asyncJob as any)?.company_name}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-row items-center min-w-0 max-w-full">
                <span className="font-['DM_Sans'] font-normal text-[11px] leading-3 text-[var(--ds-text-secondary)] truncate">
                  {[
                    asyncJob?.workMode || (asyncJob as any)?.work_mode || "Hybrid",
                    asyncJob?.location?.split(",")[0]?.trim() || "Remote",
                    asyncJob?.experience || (asyncJob as any)?.experience_level || "0-2Yrs",
                  ].filter(Boolean).join(" • ")}
                </span>
              </div>
            </div>
          </button>
        ) : isProfile ? (
          /* Profile Variant (Frame 2610036 + Frame 2608571) */
          <button
            type="button"
            onClick={handleClick}
            aria-label="Scroll to pinned profile"
            title="Scroll to pinned profile"
            className="box-border w-[178px] min-w-[178px] h-[54px] p-[8px_12px] flex flex-row items-center gap-[10px] rounded-[16px] border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-2)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)]"
          >
            <div className="w-[152px] h-[36px] flex flex-row items-center gap-2">
              {/* Rectangle 29 */}
              {effectiveSharedProfile?.avatar ? (
                <img
                  src={effectiveSharedProfile.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--ds-border-subtle)]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--ds-surface-2)] flex items-center justify-center shrink-0 border border-[var(--ds-border-subtle)]">
                  <Icon icon="solar:user-bold" className="w-4 h-4 text-[var(--ds-text-secondary)]" />
                </div>
              )}
              {/* Frame 2608568 */}
              <div className="w-[112px] h-[36px] flex flex-col items-start justify-center min-w-0 flex-1">
                <span className="w-full font-['DM_Sans'] font-semibold text-base leading-6 text-[var(--ds-text-primary)] truncate text-left">
                  {effectiveSharedProfile?.name || (!contentStr.startsWith("http") && !isGenericMediaText(contentStr) ? rawText : "Profile")}
                </span>
                <span className="w-full font-['DM_Sans'] font-normal text-[10px] leading-3 text-[var(--ds-text-secondary)] truncate text-left">
                  {effectiveSharedProfile?.headline || "Member"}
                </span>
              </div>
            </div>
          </button>
        ) : isPostOrMedia ? (
          /* Post / Image / Video Variant (Frame 2610036 + Frame 2610126) */
          <button
            type="button"
            onClick={handleClick}
            aria-label="Scroll to pinned post"
            title="Scroll to pinned post"
            className="box-border w-[257px] min-w-[257px] h-[58px] p-[8px_12px] flex flex-row items-center gap-[10px] rounded-[16px] border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-2)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)]"
          >
            {/* Frame 2610126 */}
            <div className="w-[231px] h-10 flex flex-row items-start gap-1">
              {/* Rectangle 89 */}
              {effectiveMediaUrl ? (
                isVideo ? (
                  <div className="relative w-10 h-10 rounded-[8px] overflow-hidden shrink-0 bg-black/40">
                    <video
                      src={`${effectiveMediaUrl}#t=0.001`}
                      preload="metadata"
                      className="w-10 h-10 object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Icon icon="solar:play-bold" className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={effectiveMediaUrl}
                    alt=""
                    className="w-10 h-10 rounded-[8px] object-cover shrink-0"
                  />
                )
              ) : (
                <div className="w-10 h-10 rounded-[8px] bg-[var(--ds-surface-2)] flex items-center justify-center shrink-0">
                  <Icon icon="solar:gallery-linear" className="w-5 h-5 text-[var(--ds-text-secondary)]" />
                </div>
              )}
              {/* Frame 2610110 */}
              <div className="w-[187px] h-8 flex flex-col justify-center items-start min-w-0 flex-1">
                <span className="w-[187px] font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] line-clamp-2 break-words text-left">
                  {stripMentionSyntax(postTextToDisplay)}
                </span>
              </div>
            </div>
          </button>
        ) : isPoll ? (
          /* Poll Variant */
          <button
            type="button"
            onClick={handleClick}
            aria-label={`Scroll to pinned poll: ${pollQuestion}`}
            title="Scroll to pinned poll"
            className="box-border min-w-[178px] max-w-[calc(100%-34px)] h-[54px] p-[8px_12px] flex flex-row items-center gap-2 rounded-[16px] border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-2)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)]"
          >
            <PollIcon className="w-5 h-5 shrink-0 text-[var(--ds-text-primary)]" />
            <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-[var(--ds-text-primary)] truncate text-left flex-1 min-w-0">
              {pollQuestion}
            </span>
          </button>
        ) : isDocument ? (
          /* Document Variant */
          <button
            type="button"
            onClick={handleClick}
            aria-label="Scroll to pinned document"
            title="Scroll to pinned document"
            className="box-border min-w-[178px] max-w-[calc(100%-34px)] h-[54px] p-[8px_12px] flex flex-row items-center gap-2 rounded-[16px] border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-2)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)]"
          >
            <FileTextIcon className="w-5 h-5 shrink-0 text-[var(--ds-text-primary)]" size={20} />
            <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] truncate text-left flex-1 min-w-0">
              {nameStr || rawText || "Document"}
            </span>
          </button>
        ) : (
          /* Standard Text Message Variant (Single-line truncated message bubble pill) */
          <button
            type="button"
            onClick={handleClick}
            aria-label={`Scroll to pinned message: ${rawText}`}
            title="Scroll to pinned message"
            className="h-[34px] min-w-0 max-w-[calc(100%-34px)] px-3.5 flex items-center rounded-full bg-[var(--ds-surface-2)] border border-[var(--ds-border)] hover:border-[var(--ds-accent)]/50 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)]"
          >
            <span className="font-['DM_Sans'] text-xs font-normal text-[var(--ds-text-primary)] leading-4 truncate text-left">
              {stripMentionSyntax(rawText) || "Pinned message"}
            </span>
          </button>
        )}

        {/* Pin icon (Frame 2610125 child 1) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnpin?.();
          }}
          aria-label="Unpin message"
          title="Unpin message"
          className="w-5 h-5 flex items-center justify-center shrink-0 text-[var(--ds-text-primary)] hover:text-[var(--ds-accent)] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)] rounded"
        >
          <PinIcon className="w-5 h-5" size={20} />
        </button>
      </div>
    </div>
  );
}

export default PinnedMessageBanner;
