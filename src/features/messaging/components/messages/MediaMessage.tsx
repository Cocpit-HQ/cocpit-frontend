"use client";

import React, { useState } from "react";
import { Message } from "@/types/messaging";
import { Icon } from "@iconify/react";
import { FileTextIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { getChatMediaDimensions } from "./SharedPostMessage";

export function isDocumentType(item: { url: string; type: string; name?: string | null }) {
  if (item.type === "document" || item.type === "file") return true;
  if (item.type && item.type.startsWith("application/")) return true;
  const nameOrUrl = (item.name || item.url || "").toLowerCase();
  return /\.(doc|docx|pdf|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i.test(nameOrUrl);
}

export function isVideoType(item: { url: string; type: string; name?: string | null }) {
  if (item.type === "video" || (item.type && item.type.startsWith("video/"))) return true;
  const nameOrUrl = (item.name || item.url || "").toLowerCase();
  return /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(nameOrUrl);
}

export const ImageMediaItem = ({
  item,
  index,
  isLastOdd,
  mediaLength,
  allMedia,
  isSending,
  onMediaLoad,
  onMediaClick,
}: {
  item: { url: string; type: string; width?: number; height?: number };
  index: number;
  isLastOdd: boolean;
  mediaLength: number;
  allMedia?: { url: string; type: string; name?: string | null }[];
  isSending?: boolean;
  onMediaLoad?: () => void;
  onMediaClick?: (
    url: string,
    type: "image" | "video" | "document",
    name?: string,
    allMedia?: { url: string; type: string; name?: string | null }[],
    index?: number,
  ) => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dims, setDims] = useState<{ width?: number; height?: number }>({
    width: item.width,
    height: item.height,
  });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setDims({ width: naturalWidth, height: naturalHeight });
    }
    onMediaLoad?.();
  };

  const computedDims = mediaLength === 1 ? getChatMediaDimensions(dims.width, dims.height) : null;

  if (isSending) {
    return (
      <div
        className={cn(
          "relative bg-[var(--ds-surface-1)] animate-pulse rounded-[16px] border border-[var(--ds-border)] flex items-center justify-center overflow-hidden",
          mediaLength === 1 ? "" : (isLastOdd && mediaLength > 1 ? "col-span-2 aspect-[2/1]" : "aspect-square w-full"),
        )}
        style={computedDims ? { width: `${computedDims.width}px`, height: `${computedDims.height}px` } : undefined}
      >
        <div className="w-8 h-8 rounded-full bg-[var(--ds-surface-2)] opacity-60" />
      </div>
    );
  }

  if (mediaLength === 1) {
    return (
      <div
        className="relative bg-[var(--ds-bg)] rounded-[16px] border border-[var(--ds-border)] flex items-center justify-center overflow-hidden select-none cursor-pointer hover:opacity-95 transition-opacity"
        style={computedDims ? { width: `${computedDims.width}px`, height: `${computedDims.height}px` } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick?.(item.url, "image", `Image-${index + 1}`, allMedia, index);
        }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 w-full h-full bg-[var(--ds-surface-1)] animate-pulse rounded-[16px] z-10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[var(--ds-surface-2)] opacity-60" />
          </div>
        )}
        <img
          src={item.url}
          alt="Attached image"
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          loading="lazy"
          onLoad={handleImageLoad}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-black/5 flex items-center justify-center overflow-hidden w-full min-w-[220px]",
        isLastOdd && mediaLength > 1 ? "col-span-2 aspect-[2/1]" : "aspect-square",
      )}
    >
      {!isLoaded && (
        <div className="absolute inset-0 w-full h-full bg-[var(--ds-surface-1)] animate-pulse rounded-[12px] z-10 flex items-center justify-center min-w-[220px] min-h-[160px]">
          <div className="w-8 h-8 rounded-full bg-[var(--ds-surface-2)] opacity-60" />
        </div>
      )}
      <img
        src={item.url}
        alt="Attached image"
        className={cn(
          "w-full h-full object-cover cursor-pointer transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
        loading="lazy"
        onLoad={handleImageLoad}
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick?.(item.url, "image", `Image-${index + 1}`, allMedia, index);
        }}
      />
    </div>
  );
};

export const VideoMediaItem = ({
  item,
  index,
  isLastOdd,
  mediaLength,
  allMedia,
  isSending,
  onMediaLoad,
  onMediaClick,
}: {
  item: { url: string; type: string; name?: string | null; width?: number; height?: number };
  index: number;
  isLastOdd: boolean;
  mediaLength: number;
  allMedia?: { url: string; type: string; name?: string | null }[];
  isSending?: boolean;
  onMediaLoad?: () => void;
  onMediaClick?: (
    url: string,
    type: "image" | "video" | "document",
    name?: string,
    allMedia?: { url: string; type: string; name?: string | null }[],
    index?: number,
  ) => void;
}) => {
  const [dims, setDims] = useState<{ width?: number; height?: number }>({
    width: item.width,
    height: item.height,
  });

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      setDims({ width: video.videoWidth, height: video.videoHeight });
    }
    onMediaLoad?.();
  };

  const computedDims = mediaLength === 1 ? getChatMediaDimensions(dims.width, dims.height) : null;

  if (isSending) {
    return (
      <div
        className={cn(
          "relative bg-[var(--ds-surface-1)] animate-pulse rounded-[16px] border border-[var(--ds-border)] flex items-center justify-center overflow-hidden",
          mediaLength === 1 ? "" : (isLastOdd && mediaLength > 1 ? "col-span-2 aspect-[2/1]" : "aspect-square w-full"),
        )}
        style={computedDims ? { width: `${computedDims.width}px`, height: `${computedDims.height}px` } : undefined}
      >
        <div className="w-10 h-10 rounded-full bg-[var(--ds-surface-2)] opacity-60" />
      </div>
    );
  }

  if (mediaLength === 1) {
    return (
      <div
        className="relative bg-[var(--ds-bg)] rounded-[16px] border border-[var(--ds-border)] flex items-center justify-center overflow-hidden select-none cursor-pointer group/media hover:opacity-95 transition-opacity"
        style={computedDims ? { width: `${computedDims.width}px`, height: `${computedDims.height}px` } : undefined}
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick?.(item.url, "video", `Video-${index + 1}`, allMedia, index);
        }}
      >
        <video
          src={item.url}
          className="w-full h-full object-cover pointer-events-none"
          preload="metadata"
          onLoadedMetadata={handleVideoMetadata}
        />
        {/* Centered Play Button Overlay matching post video card */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm shadow-md group-hover/media:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white stroke-[2.2] fill-transparent ml-0.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-black/5 flex items-center justify-center overflow-hidden w-full",
        isLastOdd && mediaLength > 1 ? "col-span-2 aspect-[2/1]" : "aspect-square",
      )}
    >
      <div
        className="w-full h-full relative cursor-pointer group/media"
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick?.(item.url, "video", `Video-${index + 1}`, allMedia, index);
        }}
      >
        <video
          src={item.url}
          className="w-full h-full object-cover pointer-events-none"
          preload="metadata"
          onLoadedMetadata={handleVideoMetadata}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] group-hover/media:bg-black/10 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover/media:scale-110 transition-transform">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const StackMediaCard = ({
  item,
  index,
  className,
  style,
  badge,
  onMediaClick,
  onMediaLoad,
}: {
  item: { url: string; type: string; name?: string | null; width?: number; height?: number };
  index: number;
  className?: string;
  style?: React.CSSProperties;
  badge?: React.ReactNode;
  onMediaClick?: (url: string, type: "image" | "video" | "document", name?: string, allMedia?: { url: string; type: string; name?: string | null }[], index?: number) => void;
  onMediaLoad?: () => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const isVideo = isVideoType(item);

  return (
    <div
      className={cn(
        "absolute w-[136px] h-[162px] rounded-[16px] border border-[var(--ds-border)] bg-[var(--ds-bg)] overflow-hidden shadow-md cursor-pointer hover:scale-[1.03] transition-transform duration-200 select-none",
        className
      )}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onMediaClick?.(item.url, isVideo ? "video" : "image", item.name || `Media-${index + 1}`);
      }}
    >
      {!isLoaded && !isVideo && (
        <div className="absolute inset-0 bg-[var(--ds-surface-1)] animate-pulse flex items-center justify-center z-10">
          <div className="w-6 h-6 rounded-full bg-[var(--ds-surface-2)] opacity-60" />
        </div>
      )}
      {isVideo ? (
        <div className="relative w-full h-full">
          <video
            src={item.url}
            className="w-full h-full object-cover pointer-events-none"
            preload="metadata"
            onLoadedData={() => {
              setIsLoaded(true);
              onMediaLoad?.();
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center border border-white/30 shadow-md">
              <Play className="w-4 h-4 text-white stroke-[2.2] fill-transparent ml-0.5" />
            </div>
          </div>
        </div>
      ) : (
        <img
          src={item.url}
          alt={item.name || `Media ${index + 1}`}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={() => {
            setIsLoaded(true);
            onMediaLoad?.();
          }}
        />
      )}
      {badge}
    </div>
  );
};

export const MediaStackFan = ({
  items,
  isSending,
  onMediaLoad,
  onMediaClick,
}: {
  items: { url: string; type: string; name?: string | null; width?: number; height?: number }[];
  isSending?: boolean;
  onMediaLoad?: () => void;
  onMediaClick?: (
    url: string,
    type: "image" | "video" | "document",
    name?: string,
    allMedia?: { url: string; type: string; name?: string | null }[],
    index?: number,
  ) => void;
}) => {
  if (!items || items.length === 0) return null;

  // Sending skeleton fan
  if (isSending) {
    return (
      <div className="relative w-[248px] h-[186px] shrink-0 select-none overflow-visible">
        {/* Back-left card */}
        <div
          className="absolute w-[136px] h-[162px] rounded-[16px] border border-[var(--ds-border)] bg-[var(--ds-surface-1)] animate-pulse shadow-md"
          style={{
            left: "22px",
            top: "20px",
            transform: "rotate(-14deg)",
            transformOrigin: "center",
            zIndex: 10,
          }}
        />
        {/* Back-right card */}
        {items.length > 2 && (
          <div
            className="absolute w-[136px] h-[162px] rounded-[16px] border border-[var(--ds-border)] bg-[var(--ds-surface-1)] animate-pulse shadow-md"
            style={{
              left: "90px",
              top: "20px",
              transform: "rotate(14deg)",
              transformOrigin: "center",
              zIndex: 20,
            }}
          />
        )}
        {/* Front-center card */}
        <div
          className="absolute w-[136px] h-[162px] rounded-[16px] border border-[var(--ds-border)] bg-[var(--ds-surface-1)] animate-pulse shadow-md"
          style={{
            left: "56px",
            top: "22px",
            zIndex: 30,
          }}
        />
      </div>
    );
  }

  // 2 items edge-case
  if (items.length === 2) {
    return (
      <div className="relative w-[220px] h-[180px] shrink-0 select-none overflow-visible">
        {/* Back card: item 1 */}
        <StackMediaCard
          item={items[1]}
          index={1}
          style={{
            left: "20px",
            top: "12px",
            transform: "rotate(-8deg)",
            transformOrigin: "center",
            zIndex: 10,
          }}
          onMediaClick={() =>
            onMediaClick?.(
              items[1].url,
              isVideoType(items[1]) ? "video" : "image",
              items[1].name || "Media-2",
              items,
              1
            )
          }
          onMediaLoad={onMediaLoad}
        />

        {/* Front card: item 0 */}
        <StackMediaCard
          item={items[0]}
          index={0}
          style={{
            left: "64px",
            top: "18px",
            transform: "rotate(5deg)",
            transformOrigin: "center",
            zIndex: 20,
          }}
          onMediaClick={() =>
            onMediaClick?.(
              items[0].url,
              isVideoType(items[0]) ? "video" : "image",
              items[0].name || "Media-1",
              items,
              0
            )
          }
          onMediaLoad={onMediaLoad}
        />
      </div>
    );
  }

  // 3+ items: Fanned Card Deck
  // Sequence in upload order:
  // Item 0: Front Center (z-30)
  // Item 1: Back Left (z-10, -14deg)
  // Item 2: Back Right (z-20, +14deg) with remaining count badge if > 3 items!
  const item0 = items[0];
  const item1 = items[1];
  const item2 = items[2];
  const remainingCount = items.length > 3 ? items.length - 3 : 0;

  return (
    <div className="relative w-[248px] h-[186px] shrink-0 select-none overflow-visible">
      {/* 1. Back-Left Card (item 1) */}
      {item1 && (
        <StackMediaCard
          item={item1}
          index={1}
          style={{
            left: "22px",
            top: "20px",
            transform: "rotate(-14deg)",
            transformOrigin: "center",
            zIndex: 10,
          }}
          onMediaClick={() =>
            onMediaClick?.(
              item1.url,
              isVideoType(item1) ? "video" : "image",
              item1.name || "Media-2",
              items,
              1
            )
          }
          onMediaLoad={onMediaLoad}
        />
      )}

      {/* 2. Back-Right Card (item 2) with remaining count badge */}
      {item2 && (
        <StackMediaCard
          item={item2}
          index={2}
          style={{
            left: "90px",
            top: "20px",
            transform: "rotate(14deg)",
            transformOrigin: "center",
            zIndex: 20,
          }}
          badge={
            remainingCount > 0 ? (
              <div className="absolute top-2.5 right-2 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 text-[11px] font-['DM_Sans'] font-bold text-white shadow-lg z-30 select-none pointer-events-none">
                +{remainingCount}
              </div>
            ) : null
          }
          onMediaClick={() =>
            onMediaClick?.(
              item2.url,
              isVideoType(item2) ? "video" : "image",
              item2.name || "Media-3",
              items,
              2
            )
          }
          onMediaLoad={onMediaLoad}
        />
      )}

      {/* 3. Front-Center Card (item 0) */}
      {item0 && (
        <StackMediaCard
          item={item0}
          index={0}
          style={{
            left: "56px",
            top: "22px",
            transform: "rotate(0deg)",
            zIndex: 30,
          }}
          onMediaClick={() =>
            onMediaClick?.(
              item0.url,
              isVideoType(item0) ? "video" : "image",
              item0.name || "Media-1",
              items,
              0
            )
          }
          onMediaLoad={onMediaLoad}
        />
      )}
    </div>
  );
};

export const DocumentMediaCard = ({
  item,
  index,
  allMedia,
  isSending,
  onMediaClick,
}: {
  item: { url: string; type: string; name?: string | null };
  index: number;
  allMedia?: { url: string; type: string; name?: string | null }[];
  isSending?: boolean;
  onMediaClick?: (
    url: string,
    type: "image" | "video" | "document",
    name?: string,
    allMedia?: { url: string; type: string; name?: string | null }[],
    index?: number,
  ) => void;
}) => {
  const displayName = item.name || (item as any).filename || `Document-${index + 1}`;
  const fileExt = displayName.includes(".")
    ? displayName.split(".").pop()!.toLowerCase()
    : "";
  const extLabel = fileExt ? fileExt.toUpperCase() : "PDF";

  if (isSending) {
    return (
      <div className="box-border flex flex-row items-center p-2 gap-1 h-[46px] min-w-[126px] max-w-[260px] border border-[var(--ds-border)] rounded-[16px] bg-[var(--ds-surface-1)] animate-pulse select-none">
        <div className="w-5 h-5 rounded bg-[var(--ds-surface-2)] shrink-0" />
        <div className="flex flex-col justify-center items-start p-0 gap-1 overflow-hidden flex-1 min-w-0">
          <div className="h-3 w-16 bg-[var(--ds-surface-2)] rounded" />
          <div className="h-2 w-8 bg-[var(--ds-surface-2)] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onMediaClick?.(
          item.url,
          "document",
          displayName,
          allMedia,
          index,
        );
      }}
      className="box-border flex flex-row items-center p-2 gap-1 h-[46px] min-w-[126px] max-w-[260px] border border-[var(--ds-border)] rounded-[16px] bg-transparent hover:bg-[var(--ds-surface-1)]/50 transition-colors cursor-pointer select-none"
    >
      <FileTextIcon className="w-5 h-5 shrink-0 text-[var(--ds-text-primary)]" size={20} />
      <div className="flex flex-col justify-center items-start p-0 overflow-hidden min-w-0 flex-1">
        <span className="font-['DM_Sans'] text-xs leading-4 font-normal text-[var(--ds-text-primary)] truncate max-w-full">
          {displayName}
        </span>
        <span className="font-['DM_Sans'] text-[10px] leading-3 font-normal text-[var(--ds-text-secondary)] uppercase">
          {extLabel}
        </span>
      </div>
    </div>
  );
};

export const MessageMedia = ({
  message,
  isMediaOnly,
  onMediaClick,
  onMediaLoad,
}: {
  message: Message;
  isMediaOnly: boolean;
  onMediaClick?: (
    url: string,
    type: "image" | "video" | "document",
    name?: string,
    allMedia?: { url: string; type: string; name?: string | null }[],
    index?: number,
  ) => void;
  onMediaLoad?: () => void;
}) => {
  if (
    !message.media ||
    message.media.length === 0 ||
    message.is_deleted_for_everyone ||
    message.is_deleted_for_me
  )
    return null;

  const isSending = Boolean(
    String(message.id).startsWith("temp-") ||
    (message as any).isSending ||
    (message as any).status === "sending"
  );

  const visualMedia = message.media.filter((item) => !isDocumentType(item));
  const docMedia = message.media.filter((item) => isDocumentType(item));

  return (
    <div className="flex flex-col gap-2 w-fit max-w-full">
      {/* 1. Visual Media (Photos & Videos) */}
      {visualMedia.length === 1 && (
        isVideoType(visualMedia[0]) ? (
          <VideoMediaItem
            item={visualMedia[0]}
            index={0}
            isLastOdd={false}
            mediaLength={1}
            allMedia={visualMedia}
            isSending={isSending}
            onMediaLoad={onMediaLoad}
            onMediaClick={onMediaClick}
          />
        ) : (
          <ImageMediaItem
            item={visualMedia[0]}
            index={0}
            isLastOdd={false}
            mediaLength={1}
            allMedia={visualMedia}
            isSending={isSending}
            onMediaLoad={onMediaLoad}
            onMediaClick={onMediaClick}
          />
        )
      )}

      {visualMedia.length >= 2 && (
        <MediaStackFan
          items={visualMedia}
          isSending={isSending}
          onMediaLoad={onMediaLoad}
          onMediaClick={onMediaClick}
        />
      )}

      {/* 2. Document Media (PDFs & Docs - Frame 2610036) */}
      {docMedia.length > 0 && (
        <div className="flex flex-col gap-1.5 w-fit max-w-full">
          {docMedia.map((item, docIdx) => (
            <DocumentMediaCard
              key={docIdx}
              item={item}
              index={docIdx}
              allMedia={message.media}
              isSending={isSending}
              onMediaClick={onMediaClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageMedia;


