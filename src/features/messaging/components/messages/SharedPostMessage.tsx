"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@/types/messaging";
import { useQuery } from "@tanstack/react-query";
import { useSocial } from "@/context/SocialContext";
import Avatar from "@/components/shared/Avatar";
import UnavailableContentCard from "../ui/UnavailableContentCard";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatMediaDimensions {
  width: number;
  height: number;
}

const CHAT_MAX_WIDTH = 286;
const CHAT_MAX_HEIGHT = 380;
const CHAT_MIN_HEIGHT = 120;

// Proportional media dimensions helper scaled for chat
export function getChatMediaDimensions(width?: number, height?: number): ChatMediaDimensions {
  if (!width || !height || width <= 0 || height <= 0) {
    return { width: CHAT_MAX_WIDTH, height: 240 };
  }

  const ar = width / height;

  // 1. Landscape & Square (ar >= 1): fill card width (255px), height between 120px and 255px
  if (ar >= 1) {
    const targetH = Math.round(CHAT_MAX_WIDTH / ar);
    return {
      width: CHAT_MAX_WIDTH,
      height: Math.max(CHAT_MIN_HEIGHT, Math.min(targetH, CHAT_MAX_WIDTH)),
    };
  }

  // 2. Standard Portrait (0.75 <= ar < 1, e.g. 4:5 photos like Lisa Su)
  if (ar >= 0.75) {
    const targetH = Math.round(CHAT_MAX_WIDTH / ar);
    return {
      width: CHAT_MAX_WIDTH,
      height: Math.min(targetH, 320),
    };
  }

  // 3. Tall Vertical / Phone Screenshots (ar < 0.75, e.g. 9:16 or 9:19.5):
  // Height capped at CHAT_MAX_HEIGHT (380px), width scaled proportionally to prevent any bottom/top clipping
  const targetH = CHAT_MAX_HEIGHT;
  const targetW = Math.round(targetH * ar);
  return {
    width: Math.max(140, Math.min(targetW, CHAT_MAX_WIDTH)),
    height: targetH,
  };
}

export interface SharedPostCardProps {
  message: Message;
  onMediaLoad?: () => void;
  isMe?: boolean;
}

export const SharedPostCard = ({
  message,
  onMediaLoad,
  isMe = false,
}: SharedPostCardProps) => {
  const router = useRouter();
  const { isBlocked } = useSocial();
  const [imgError, setImgError] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [detectedDims, setDetectedDims] = useState<Record<number, { width: number; height: number }>>({});
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const rawText = message.text || message.text_content || "";
  const postUrlRegex =
    /(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:post))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i;
  const match = rawText.match(postUrlRegex);
  const extractedPostId = match ? match[1] : null;

  const initialPost = message.sharedPost || (message as any).shared_post;

  const effectivePostId =
    extractedPostId ||
    message.sharedPostId ||
    (message as any).shared_post_id ||
    ((message.entityType === 'post' || message.entityType === 'article') ? message.entityId : null) ||
    initialPost?.id ||
    initialPost?.post_id ||
    initialPost?._id;

  const initialAuthorId =
    initialPost?.author_id ||
    initialPost?.authorId ||
    initialPost?.author_org_id ||
    initialPost?.authorOrgId ||
    initialPost?.companyId ||
    initialPost?.company_id ||
    initialPost?.org_id ||
    (typeof initialPost?.author === "object" ? initialPost.author?.id || initialPost.author?.org_id : null);

  const {
    data: fetchedPost,
    isLoading: loading,
    error: fetchError,
  } = useQuery({
    queryKey: ["sharedPost", effectivePostId],
    queryFn: async () => {
      if (!effectivePostId) return null;
      const { getPostById } = await import("@/services/api/posts");
      const backendPost = await getPostById(effectivePostId);
      if (
        !backendPost ||
        (backendPost as any).is_active === false ||
        (backendPost as any).is_removed
      ) {
        throw new Error("Post is inactive or removed");
      }
      const media =
        backendPost.media?.map((m) => ({
          url: m.url,
          type: m.media_type as "image" | "video",
          width: m.width,
          height: m.height,
        })) || [];

      return {
        id: backendPost.post_id,
        content: backendPost.content || "",
        author: backendPost.author_name || "Unknown",
        authorId: backendPost.author_id,
        authorAvatar: backendPost.author_avatar || null,
        authorHeadline: (backendPost as any).author_headline || (backendPost as any).headline || null,
        is_organization_post: backendPost.is_organization_post,
        post_type: backendPost.post_type,
        poll: backendPost.poll,
        title: backendPost.title,
        media: media,
      };
    },
    enabled: Boolean(effectivePostId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  useEffect(() => {
    setImgError(false);
  }, [message.sharedPost, fetchedPost]);

  useEffect(() => {
    setActiveMediaIndex(0);
    setDetectedDims({});
    setImgErrors({});
  }, [effectivePostId]);

  const hasSharedPost = Boolean(
    message.sharedPost ||
    (message as any).shared_post ||
    message.sharedPostId ||
    (message as any).shared_post_id ||
    ((message.entityType === 'post' || message.entityType === 'article') && message.entityId) ||
    extractedPostId,
  );

  if (!hasSharedPost) {
    return null;
  }

  const isSenderOwnPostBlocked = Boolean(
    message.senderId &&
    isBlocked(message.senderId) &&
    (!initialAuthorId ||
      String(initialAuthorId) === String(message.senderId) ||
      (message.senderName && initialPost?.author && message.senderName.trim().toLowerCase() === initialPost.author.trim().toLowerCase()))
  );

  const isLocalBlocked =
    (initialAuthorId && isBlocked(initialAuthorId)) ||
    (fetchedPost?.authorId && isBlocked(fetchedPost.authorId)) ||
    isSenderOwnPostBlocked;

  if (isLocalBlocked) {
    return <UnavailableContentCard isMe={isMe} />;
  }

  if (loading) {
    return (
      <div className="w-[288px] h-auto box-border p-0 rounded-[16px] border border-[var(--ds-border)] bg-transparent flex flex-col justify-start items-stretch shrink-0 overflow-hidden animate-pulse">
        <div className="w-full h-auto p-0 flex flex-col items-stretch shrink-0">
          {/* Header skeleton */}
          <div className="w-full px-2.5 pt-2 pb-1.5 flex flex-row items-center gap-2 shrink-0 box-border">
            <div className="w-8 h-8 rounded-full bg-[var(--ds-surface-1)] shrink-0" />
            <div className="flex-1 min-w-0 h-[36px] flex flex-col items-start justify-center gap-1">
              <div className="h-3 bg-[var(--ds-surface-1)] rounded w-24" />
              <div className="h-2.5 bg-[var(--ds-surface-1)] rounded w-16" />
            </div>
          </div>
          {/* Body skeleton */}
          <div className="w-full h-[240px] bg-[var(--ds-surface-1)] shrink-0" />
        </div>
      </div>
    );
  }

  const isPostUnavailable = Boolean(
    fetchError ||
    initialPost?.author === "Unknown Page" ||
    initialPost?.author === "Unknown user" ||
    initialPost?.author === "Unknown User" ||
    initialPost?.author === "Unknown Author" ||
    initialPost?.author === "Deactivated User" ||
    (initialPost as any)?.author_name === "Unknown User" ||
    (initialPost as any)?.author_name === "Deactivated User" ||
    fetchedPost?.author === "Unknown Page" ||
    fetchedPost?.author === "Unknown user" ||
    fetchedPost?.author === "Unknown User" ||
    fetchedPost?.author === "Deactivated User" ||
    (fetchedPost as any)?.author_name === "Unknown User" ||
    (fetchedPost as any)?.author_name === "Deactivated User",
  );

  if (isPostUnavailable) {
    return <UnavailableContentCard isMe={isMe} />;
  }

  const postToRender = fetchedPost || (!effectivePostId ? initialPost : null);

  if (!postToRender) {
    return <UnavailableContentCard isMe={isMe} />;
  }

  // Safe property extraction
  const authorName =
    (typeof postToRender.author === "object"
      ? postToRender.author?.full_name
      : postToRender.author) ||
    postToRender.author_name ||
    "Unknown";

  const rawAvatar =
    postToRender.authorAvatar ||
    postToRender.author_avatar ||
    (typeof postToRender.author === "object"
      ? postToRender.author?.avatar_url
      : null);

  const authorAvatarUrl =
    (rawAvatar && typeof rawAvatar === "string" && !rawAvatar.includes("pngegg.png"))
      ? rawAvatar
      : null;

  const isOrg = Boolean(
    postToRender.is_organization_post ||
    postToRender.isOrganizationPost ||
    (typeof postToRender.author === "object" && postToRender.author?.is_organization_post) ||
    postToRender.authorType === "COMPANY" ||
    postToRender.isCompany
  );

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>?/gm, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  const renderContentWithMentions = (content: string) => {
    if (!content) return null;

    // Match structured mentions @[Display Name](identifier), raw handles @username, or URLs
    const regex = /(@\[[^\]]+\]\([^)]+\)|(?:^|\s)@[a-zA-Z0-9_.-]+|https?:\/\/[^\s]+)/g;
    const parts = content.split(regex);

    if (parts.length <= 1) return content;

    return parts.map((part, index) => {
      if (!part) return null;

      // 1. Structured mention: @[Name](handle_or_id) -> @Name in accent color
      const structuredMatch = part.match(/^@\[([^\]]+)\]\([^)]+\)$/);
      if (structuredMatch) {
        return (
          <span key={index} className="font-semibold text-[var(--ds-accent)]">
            @{structuredMatch[1]}
          </span>
        );
      }

      // 2. Raw mention: @username -> in accent color
      const rawMatch = part.match(/(^|\s)(@[a-zA-Z0-9_.-]+)/);
      if (rawMatch) {
        return (
          <span key={index}>
            {rawMatch[1]}
            <span className="font-semibold text-[var(--ds-accent)]">
              {rawMatch[2]}
            </span>
          </span>
        );
      }

      // 3. Link: https://... -> in accent color
      if (part.match(/^https?:\/\/[^\s]+$/)) {
        return (
          <span key={index} className="text-[var(--ds-accent)] underline">
            {part}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const postId = postToRender.id || postToRender.post_id || "";
  const postContent = stripHtml(postToRender.content || "");
  const postSubtext =
    postToRender.authorHeadline ||
    postToRender.author_headline ||
    postToRender.headline ||
    postToRender.subtext ||
    (typeof postToRender.author === "object"
      ? (postToRender.author?.headline || postToRender.author?.display_headline)
      : null) ||
    "";

  const rawMedia = postToRender.media || [];
  const mediaItems = rawMedia.map((m: any) => ({
    url: m.url || m.media_url || "",
    type: m.type || m.media_type || "image",
    width: m.width || m.media_width,
    height: m.height || m.media_height,
  }));

  // Check backend provided card_type or post_type
  const backendCardType = (postToRender.card_type || postToRender.display_type || "")?.toLowerCase();
  const postType = (postToRender.post_type || postToRender.postType || "").toLowerCase();

  const hasVideoMedia = mediaItems.some(
    (m: any) => m.type === "video" || (typeof m.url === "string" && m.url.match(/\.(mp4|webm|mov)(\?|#|$)/i))
  );

  // Poll post
  const isPoll = Boolean(
    backendCardType === "poll" ||
    postType === "poll" ||
    postToRender.poll
  );

  // Video post
  const isVideoPost = !isPoll && Boolean(
    backendCardType === "video" ||
    postType === "video" ||
    hasVideoMedia
  );

  // Normal post (text only: no media and no poll)
  const isNormalTextPost = !isPoll && !isVideoPost && mediaItems.length === 0;

  // Article UI commented out for now per user instruction
  /*
  const isArticle = Boolean(
    backendCardType === "article" ||
    postType === "article" ||
    postToRender.category === "Article" ||
    postToRender.articleBody
  );
  */

  const renderCardHeader = () => (
    <div className="w-full flex flex-row items-center gap-2 shrink-0">
      <Avatar
        url={authorAvatarUrl || undefined}
        name={authorName}
        size="sm"
        isCompany={isOrg}
        className="w-8 h-8 rounded-full shrink-0"
      />
      <div className="flex-1 min-w-0 h-9 p-0 flex flex-col items-start justify-center">
        <span className="font-['DM_Sans'] font-semibold text-base leading-6 text-[var(--ds-text-primary)] truncate text-left w-full block">
          {authorName}
        </span>
        <span className="font-['DM_Sans'] font-normal text-[10px] leading-3 text-[var(--ds-text-secondary)] truncate text-left w-full block">
          {postSubtext || (isOrg ? "Organization" : "")}
        </span>
      </div>
    </div>
  );

  if (isPoll) {
    const poll = postToRender.poll;
    const options = poll?.options || (postToRender as any).poll_options || [];

    return (
      <div
        className="w-[288px] h-auto box-border p-2.5 rounded-[16px] border border-[var(--ds-border)] bg-transparent flex flex-col justify-start items-stretch cursor-pointer hover:opacity-95 transition-all overflow-hidden shrink-0 select-none gap-3"
        onClick={() => router.push(`/post/${postId}`)}
        role="button"
        tabIndex={0}
      >
        {/* Frame 2608569: Header */}
        {renderCardHeader()}

        {/* Frame 2609529: Poll Title / Question */}
        <div className="w-full text-left">
          <p className="font-['DM_Sans'] font-medium text-sm leading-5 text-[var(--ds-text-primary)] break-words line-clamp-3">
            {renderContentWithMentions(postContent || postToRender.title || postToRender.article_title || "Poll")}
          </p>
        </div>

        {/* Frame 2609582: Poll Options List */}
        {options.length > 0 && (
          <div className="w-full flex flex-col gap-2 self-stretch">
            {options.map((opt: any, idx: number) => (
              <div
                key={opt.option_id || idx}
                className="w-full min-h-[28px] h-7 px-3 py-1.5 box-border rounded-full border border-[var(--ds-border)] bg-transparent flex items-center justify-start transition-colors"
              >
                <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] truncate text-left w-full">
                  {opt.option_text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isNormalTextPost) {
    return (
      <div
        className="w-[328px] max-w-full h-auto min-h-[114px] box-border p-2 rounded-[16px] border border-[var(--ds-border)] bg-transparent flex flex-col justify-start items-stretch cursor-pointer hover:opacity-95 transition-all overflow-hidden shrink-0 select-none gap-3"
        onClick={() => router.push(`/post/${postId}`)}
        role="button"
        tabIndex={0}
      >
        {/* Frame 2608570: Header */}
        {renderCardHeader()}

        {/* Frame 2608602: Text Content: shows up to 10 lines before ellipsis with mention highlighting */}
        {postContent && (
          <div className="w-full text-left">
            <p
              className="font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] break-words whitespace-pre-line line-clamp-[10]"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 10,
                overflow: "hidden",
              }}
            >
              {renderContentWithMentions(postContent)}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Content with Image / Video / Media Post (Figma Frame 2610036) ─────
  // Used for Content with Image, Video posts, Only Image/Video, and dynamic media cards
  const currentMedia = mediaItems[activeMediaIndex] || mediaItems[0];
  const activeWidth = currentMedia?.width || detectedDims[activeMediaIndex]?.width;
  const activeHeight = currentMedia?.height || detectedDims[activeMediaIndex]?.height;
  const computedMediaDims = getChatMediaDimensions(activeWidth, activeHeight);
  const hasMultipleMedia = mediaItems.length > 1;

  const isCurrentMediaVideo =
    isVideoPost ||
    currentMedia?.type === "video" ||
    (typeof currentMedia?.url === "string" &&
      Boolean(currentMedia.url.match(/\.(mp4|webm|mov)(\?|#|$)/i)));

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveMediaIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveMediaIndex((prev) => Math.min(mediaItems.length - 1, prev + 1));
  };

  return (
    <div
      className="w-[288px] h-auto box-border p-0 rounded-[16px] border border-[var(--ds-border)] bg-transparent flex flex-col justify-start items-stretch cursor-pointer hover:opacity-95 transition-all overflow-hidden shrink-0 select-none"
      onClick={() => router.push(`/post/${postId}`)}
      role="button"
      tabIndex={0}
    >
      {/* Post container */}
      <div className="w-full h-auto p-0 flex flex-col items-stretch shrink-0">
        {/* Title box */}
        <div className="w-full px-2.5 pt-2 pb-1.5 flex flex-row items-center gap-2 shrink-0 box-border">
          {/* Rectangle 29: Avatar of post owner */}
          <Avatar
            url={authorAvatarUrl || undefined}
            name={authorName}
            size="sm"
            isCompany={isOrg}
            className="w-8 h-8 rounded-full shrink-0"
          />
          {/* Name and headline */}
          <div className="flex-1 min-w-0 h-[36px] p-0 flex flex-col items-start justify-start">
            <span className="h-[24px] ds-text-body-2 text-[var(--ds-text-primary)] truncate text-left w-full block">
              {authorName}
            </span>
            <span className="h-[12px] ds-text-meta text-[var(--ds-text-secondary)] truncate text-left w-full block">
              {postSubtext || (isOrg ? "Organization" : "")}
            </span>
          </div>
        </div>

        {/* Content up to 2 lines (hidden when empty / image-only post) */}
        {postContent && postContent.trim().length > 0 && (
          <div
            className="w-full px-2.5 pb-1.5 ds-text-small text-[var(--ds-text-primary)] break-words overflow-hidden text-left box-border"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              maxHeight: "32px",
              lineHeight: "16px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {renderContentWithMentions(postContent)}
          </div>
        )}

        {/* Media Container: Edge-to-edge flush with card borders */}
        {currentMedia?.url ? (
          <div
            className="w-full overflow-hidden bg-transparent relative shrink-0 flex items-center justify-center select-none"
            style={{
              height: `${computedMediaDims.height}px`,
            }}
          >
            {isCurrentMediaVideo ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  src={currentMedia.url}
                  className="w-full h-full object-contain"
                  preload="metadata"
                  muted
                  playsInline
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoWidth && v.videoHeight) {
                      setDetectedDims((prev) => ({
                        ...prev,
                        [activeMediaIndex]: { width: v.videoWidth, height: v.videoHeight },
                      }));
                    }
                    onMediaLoad?.();
                  }}
                />
                {/* Centered Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm shadow-md">
                    <Play className="w-6 h-6 text-white stroke-[2.2] fill-transparent ml-0.5" />
                  </div>
                </div>
              </div>
            ) : imgErrors[activeMediaIndex] ? (
              <div className="w-full h-full bg-transparent border border-[var(--ds-border)] flex items-center justify-center">
                <span className="ds-text-meta text-[var(--ds-text-secondary)]">Image unavailable</span>
              </div>
            ) : (
              <img
                src={currentMedia.url}
                alt={postContent || `Post media ${activeMediaIndex + 1}`}
                className="w-full h-full object-contain"
                loading="lazy"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    setDetectedDims((prev) => ({
                      ...prev,
                      [activeMediaIndex]: { width: img.naturalWidth, height: img.naturalHeight },
                    }));
                  }
                  onMediaLoad?.();
                }}
                onError={() => {
                  setImgErrors((prev) => ({ ...prev, [activeMediaIndex]: true }));
                  setImgError(true);
                }}
              />
            )}

              {/* Carousel Indicators & Controls */}
              {hasMultipleMedia && (
                <>
                  {/* Badge: 1 / 3 */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium pointer-events-none z-10">
                    {activeMediaIndex + 1} / {mediaItems.length}
                  </div>

                  {/* Previous Button */}
                  {activeMediaIndex > 0 && (
                    <button
                      type="button"
                      onClick={handlePrevSlide}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all z-10"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Next Button */}
                  {activeMediaIndex < mediaItems.length - 1 && (
                    <button
                      type="button"
                      onClick={handleNextSlide}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all z-10"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Dot Indicators */}
                  <div className="absolute bottom-1.5 left-0 right-0 flex justify-center items-center gap-1 z-10 pointer-events-none">
                    {mediaItems.map((_: any, idx: number) => (
                      <span
                        key={idx}
                        className={cn(
                          "h-1 rounded-full transition-all",
                          idx === activeMediaIndex ? "w-3 bg-white" : "w-1 bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              className="w-full bg-[var(--ds-surface-1)] border-t border-[var(--ds-border)] flex items-center justify-center shrink-0"
              style={{ height: "160px" }}
            >
              <span className="ds-text-meta text-[var(--ds-text-secondary)]">Post Preview</span>
            </div>
          )}
        </div>
      </div>
  );
};

export default SharedPostCard;

