import React from 'react';
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { FileTextIcon, PollIcon } from '@/components/icons';
import { stripMentionSyntax } from '@/lib/mentions';
import { useQuery } from '@tanstack/react-query';

export interface RepliedMessageBoxProps {
  senderName: string;
  content?: string;
  isDeleted?: boolean;
  isSent?: boolean;
  mediaType?: 'image' | 'video' | 'document' | 'attachment' | string | null;
  mediaName?: string | null;
  mediaUrl?: string | null;
  sharedPostId?: string | null;
  sharedProfileId?: string | null;
  sharedProfileType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  isAttachment?: boolean;
  sharedProfile?: {
    name?: string;
    avatar?: string | null;
    headline?: string;
  } | null;
  sharedPost?: {
    id?: string;
    content?: string;
    caption?: string;
    media?: { url: string; type?: string; media_type?: string }[];
    poll?: any;
    post_type?: string;
  } | null;
  poll?: any;
  onClick?: () => void;
  className?: string;
  hideWrapper?: boolean;
}

export default function RepliedMessageBox({
  senderName,
  content = "",
  isDeleted = false,
  isSent,
  mediaType,
  mediaName,
  mediaUrl,
  sharedPostId,
  sharedProfileId,
  sharedProfileType,
  entityType,
  entityId,
  isAttachment,
  sharedProfile,
  sharedPost,
  poll,
  onClick,
  className,
  hideWrapper = false,
}: RepliedMessageBoxProps) {
  // Extract potential post URL/ID from content or props
  const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:posts?))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i;
  const match = (content || '').match(postUrlRegex);
  const effectivePostId = sharedPostId || (entityType === 'post' || entityType === 'article' ? entityId : null) || match?.[1] || null;

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
    enabled: Boolean(
      effectivePostId &&
      (!mediaUrl || !sharedPost?.media?.length || (!poll?.question && !sharedPost?.content))
    ),
    staleTime: 300000,
    gcTime: 600000,
  });

  if (isDeleted) {
    const innerDeleted = (
      <>
        <span className="w-full h-4 font-['DM_Sans'] font-medium text-xs leading-4 text-[var(--ds-accent)] flex items-center truncate text-left">
          {senderName}
        </span>
        <div className="w-full h-4 font-['DM_Sans'] font-normal text-xs leading-4 flex items-center text-[var(--ds-text-primary)] truncate text-left">
          <i className="opacity-80 text-[var(--ds-text-muted)] truncate">Original message was deleted</i>
        </div>
      </>
    );

    if (hideWrapper) {
      return <div className={cn("w-full flex flex-col justify-center items-start gap-1 min-w-[186px]", className)}>{innerDeleted}</div>;
    }

    return (
      <div 
        className={cn(
          "self-stretch w-full min-w-[186px] max-w-full px-2 py-1.5 bg-[var(--ds-surface-1)] rounded-[8px] flex flex-col justify-center items-start gap-1 cursor-pointer hover:bg-[var(--ds-surface-2)] transition-colors box-border select-none mb-2 min-h-[44px]",
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {innerDeleted}
      </div>
    );
  }

  const effectiveSharedPost = sharedPost || asyncPost;
  const normType = (mediaType || '').toLowerCase();
  const nameStr = (mediaName || '').toLowerCase();
  const contentStr = (content || '').toLowerCase().trim();

  // 1. Poll variant
  const pollData =
    poll ||
    effectiveSharedPost?.poll ||
    (effectiveSharedPost as any)?.poll ||
    (effectiveSharedPost?.post_type === 'poll' ? { question: effectiveSharedPost.content } : null);

  const isPoll = Boolean(
    pollData ||
    effectiveSharedPost?.post_type === 'poll' ||
    normType === 'poll' ||
    contentStr.startsWith('what skill') ||
    (typeof pollData?.question === 'string' && pollData.question.length > 0)
  );

  const rawPollQuestion =
    (typeof pollData?.question === 'string' && pollData.question && pollData.question.trim().toLowerCase() !== 'poll' ? pollData.question : null) ||
    (effectiveSharedPost?.content && !effectiveSharedPost.content.startsWith('http') && effectiveSharedPost.content.trim().toLowerCase() !== 'poll' ? effectiveSharedPost.content : null) ||
    ((effectiveSharedPost as any)?.title && !(effectiveSharedPost as any).title.startsWith('http') && (effectiveSharedPost as any).title.trim().toLowerCase() !== 'poll' ? (effectiveSharedPost as any).title : null) ||
    (!contentStr.startsWith('http') && !isGenericMediaText(contentStr) ? content : null) ||
    "Poll";
  const pollQuestion = rawPollQuestion.startsWith('http') ? "Poll" : rawPollQuestion;

  // 2. Shared Profile variant
  const isProfile = Boolean(
    sharedProfile ||
    sharedProfileId ||
    ['profile', 'company'].includes((entityType || '').toLowerCase()) ||
    contentStr.includes('/profile/') ||
    contentStr.includes('/organization/') ||
    contentStr.includes('/company/')
  );

  // 3. Document (PDF, Word, or any Doc)
  const isDocType = normType === 'document' || normType === 'file';
  const hasDocExt = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i.test(nameStr || contentStr);
  const isDocument = !isPoll && !isProfile && (isDocType || hasDocExt);

  // 4. Visual media (Image or Video)
  const effectiveMediaUrl =
    mediaUrl ||
    (effectiveSharedPost?.media?.[0]?.url ?? null) ||
    ((effectiveSharedPost as any)?.media?.[0]?.media_url ?? null) ||
    ((effectiveSharedPost as any)?.media?.[0]?.thumbnail_url ?? null) ||
    ((effectiveSharedPost as any)?.image ?? null);

  const rawMediaType = (effectiveSharedPost?.media?.[0]?.type || (effectiveSharedPost as any)?.media?.[0]?.media_type || mediaType || '').toLowerCase();
  const isVideo = !isPoll && !isProfile && !isDocument && (
    rawMediaType === 'video' ||
    normType === 'video' ||
    nameStr.endsWith('.mp4') || nameStr.endsWith('.mov') || nameStr.endsWith('.webm') ||
    contentStr.endsWith('.mp4') || contentStr.endsWith('.mov') || contentStr.endsWith('.webm') ||
    Boolean(effectiveMediaUrl && /\.(mp4|webm|mov)(\?|#|$)/i.test(effectiveMediaUrl))
  );

  const isImage = !isPoll && !isProfile && !isDocument && !isVideo && (
    rawMediaType === 'image' ||
    normType === 'image' ||
    nameStr.endsWith('.jpg') || nameStr.endsWith('.jpeg') || nameStr.endsWith('.png') || nameStr.endsWith('.webp') ||
    Boolean(effectiveMediaUrl)
  );

  const hasMedia = isImage || isVideo;

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
    ].includes((str || '').trim().toLowerCase());
  }

  const textToDisplay =
    (effectiveSharedPost?.content && !effectiveSharedPost.content.startsWith('http') && !isGenericMediaText(effectiveSharedPost.content) ? effectiveSharedPost.content : null) ||
    (content && !content.startsWith('http') && !isGenericMediaText(contentStr) && content.trim() !== mediaName ? content : null) ||
    null;

  const hasRealText = Boolean(textToDisplay && textToDisplay.trim().length > 0);
  const isLoadingPost = Boolean(effectivePostId && !effectiveSharedPost && !effectiveMediaUrl);

  const innerContent = (
    <>
      <span className="w-full h-4 font-['DM_Sans'] font-medium text-xs leading-4 text-[var(--ds-accent)] flex items-center truncate text-left shrink-0">
        {senderName}
      </span>

      {/* Case 1: Poll Post */}
      {isPoll ? (
        <div className="flex flex-row items-center gap-1 w-full max-w-full min-w-0 h-5">
          <PollIcon className="w-5 h-5 shrink-0 text-[var(--ds-text-primary)]" />
          <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-[var(--ds-text-primary)] truncate flex-1 min-w-0 text-left">
            {pollQuestion}
          </span>
        </div>
      ) : isProfile ? (
        /* Case 2: Shared Profile */
        <div className="flex flex-row items-center gap-2 w-full max-w-full min-w-0 h-9">
          {sharedProfile?.avatar ? (
            <img
              src={sharedProfile.avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--ds-border-subtle)]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--ds-surface-2)] flex items-center justify-center shrink-0 border border-[var(--ds-border-subtle)]">
              <Icon icon="solar:user-bold" className="w-4 h-4 text-[var(--ds-text-secondary)]" />
            </div>
          )}
          <div className="flex flex-col items-start justify-center min-w-0 flex-1 h-9">
            <span className="w-full font-['DM_Sans'] font-semibold text-base leading-6 text-[var(--ds-text-primary)] truncate text-left">
              {sharedProfile?.name || (!contentStr.startsWith('http') && !isGenericMediaText(contentStr) ? content : "Profile")}
            </span>
            <span className="w-full font-['DM_Sans'] font-normal text-[10px] leading-3 text-[var(--ds-text-secondary)] truncate text-left">
              {sharedProfile?.headline || "Member"}
            </span>
          </div>
        </div>
      ) : isDocument ? (
        /* Case 3: Document (PDF, Word, or any Doc) */
        (() => {
          const rawFileName = mediaName || (content && !['document', 'sent a document'].includes(contentStr) ? content : "Document.pdf");
          const extMatch = rawFileName.match(/\.([a-zA-Z0-9]+)$/);
          const extLabel = extMatch ? extMatch[1].toUpperCase() : (normType === 'document' ? 'PDF' : 'DOC');

          return (
            <div className="flex flex-row items-center gap-1 w-full max-w-full min-w-0 h-7">
              <FileTextIcon className="w-5 h-5 shrink-0 text-[var(--ds-text-primary)]" size={20} />
              <div className="flex flex-col justify-center items-start min-w-0 flex-1 h-7">
                <span className="w-full font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] truncate text-left">
                  {rawFileName}
                </span>
                <span className="w-full font-['DM_Sans'] font-normal text-[10px] leading-3 text-[var(--ds-text-secondary)] uppercase text-left">
                  {extLabel}
                </span>
              </div>
            </div>
          );
        })()
      ) : isLoadingPost ? (
        /* Loading skeleton while post metadata loads */
        <div className="flex flex-row items-center gap-2 w-[186px] min-w-[186px] h-9">
          <div className="w-[54px] h-9 rounded-[8px] bg-[var(--ds-surface-2)] animate-pulse shrink-0" />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="h-2.5 bg-[var(--ds-surface-2)] rounded w-20 animate-pulse" />
            <div className="h-2 bg-[var(--ds-surface-2)] rounded w-12 animate-pulse" />
          </div>
        </div>
      ) : hasMedia && hasRealText ? (
        /* Case 4: Image or Video WITH message text present -> 40x40 thumbnail + 2-line clamped text */
        <div className="flex flex-row items-start gap-1 w-full max-w-full min-w-0 min-h-[40px]">
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
          ) : null}
          <div className="flex flex-col justify-center items-start flex-1 min-w-0 min-h-[32px] py-0.5">
            <span
              className="w-full font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] line-clamp-4 break-words text-left"
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 4,
                overflow: 'hidden',
              }}
            >
              {stripMentionSyntax(textToDisplay || effectiveSharedPost?.content || '')}
            </span>
          </div>
        </div>
      ) : hasMedia && !hasRealText && effectiveMediaUrl ? (
        /* Case 5: Single Image or Video without message text -> 54x36 thumbnail only */
        <div className="flex flex-row items-end gap-1 w-[186px] min-w-[186px] h-9" style={{ width: '186px', minWidth: '186px' }}>
          {isVideo ? (
            <div className="relative w-[54px] h-9 rounded-[8px] overflow-hidden shrink-0 bg-black/40">
              <video
                src={`${effectiveMediaUrl}#t=0.001`}
                preload="metadata"
                className="w-[54px] h-9 object-cover pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <Icon icon="solar:play-bold" className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          ) : (
            <img 
              src={effectiveMediaUrl} 
              alt="" 
              className="w-[54px] h-9 rounded-[8px] object-cover shrink-0" 
            />
          )}
        </div>
      ) : (
        /* Case 6: Pure text message -> 4 lines max with truncation at end */
        <div className="w-full min-w-0 text-left">
          <span
            className="w-full font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] line-clamp-4 break-words text-left"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 4,
              overflow: 'hidden',
            }}
          >
            {stripMentionSyntax(effectiveSharedPost?.content || content) || (mediaName || (isAttachment ? "Attachment" : ""))}
          </span>
        </div>
      )}
    </>
  );

  if (hideWrapper) {
    return <div className={cn("w-full flex flex-col justify-center items-start gap-1 min-w-[186px]", className)} style={{ minWidth: "186px" }}>{innerContent}</div>;
  }

  return (
    <div 
      className={cn(
        "self-stretch w-full min-w-[186px] max-w-full px-2 py-1.5 bg-[var(--ds-surface-1)] rounded-[8px] flex flex-col justify-center items-start gap-1 cursor-pointer hover:bg-[var(--ds-surface-2)] transition-colors box-border select-none mb-2 min-h-[44px]",
        className
      )}
      style={{ minWidth: "186px" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {innerContent}
    </div>
  );
}
