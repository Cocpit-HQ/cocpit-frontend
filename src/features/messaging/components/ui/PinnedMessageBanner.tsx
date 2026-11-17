"use client";

import React from "react";
import { Message } from "@/types/messaging";
import { PinIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

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
  className,
}: PinnedMessageBannerProps) {
  if (!pinnedMessageId) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onScrollToMessage(pinnedMessageId);
  };

  const rawText = message?.text || message?.text_content || "";

  let snippet = rawText;
  if (!snippet && message?.media && message.media.length > 0) {
    const firstMedia = message.media[0];
    let mediaType = "media";
    if (typeof firstMedia === "string") {
      mediaType = firstMedia;
    } else if (firstMedia && typeof firstMedia === "object" && "type" in firstMedia) {
      const t = (firstMedia as { type?: unknown }).type;
      if (typeof t === "string") mediaType = t;
    }

    if (mediaType.includes("image")) snippet = "📷 Photo";
    else if (mediaType.includes("video")) snippet = "🎥 Video";
    else if (mediaType.includes("audio")) snippet = "🎵 Audio";
    else snippet = "📄 Document";
  } else if (!snippet) {
    snippet = "Pinned message";
  }

  // Normalize whitespace to prevent multi-line breaks inside single-line bubble
  const cleanSnippet = snippet.replace(/\s+/g, " ").trim();

  return (
    <div
      role="region"
      aria-label="Pinned message banner"
      className={cn(
        "w-full h-[70px] min-h-[70px] p-2 flex flex-col justify-center items-start gap-1",
        "bg-[var(--ds-surface-1,#1A1A20)] rounded-b-[8px] select-none z-20 shrink-0 self-stretch",
        className
      )}
    >
      {/* Title box (Frame 2610122) */}
      <div className="w-full h-4 flex items-center gap-2 shrink-0 self-stretch">
        <span className="font-['DM_Sans'] text-[12px] font-medium leading-4 text-[var(--ds-accent,#EC6229)] select-none">
          Pinned message
        </span>
      </div>

      {/* Message row (Frame 2610125) */}
      <div className="w-full h-[34px] flex items-center justify-between gap-[10px] shrink-0 self-stretch">
        {/* Single-line truncated message bubble */}
        <button
          type="button"
          onClick={handleClick}
          aria-label={`Scroll to pinned message: ${cleanSnippet}`}
          title="Scroll to pinned message"
          className="h-[34px] min-w-0 max-w-[calc(100%-30px)] px-3.5 flex items-center rounded-full bg-[var(--ds-surface-2,#222228)] border border-[var(--ds-border,#2C2C33)] hover:border-[var(--ds-accent,#EC6229)]/50 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent,#EC6229)]"
        >
          <span className="font-['DM_Sans'] text-xs font-normal text-[var(--ds-text-primary,#FFECE6)] leading-4 truncate text-left">
            {cleanSnippet}
          </span>
        </button>

        {/* Pin icon */}
        <button
          type="button"
          onClick={handleClick}
          aria-label="Scroll to pinned message"
          title="Scroll to pinned message"
          className="w-5 h-5 flex items-center justify-center shrink-0 text-[var(--ds-text-primary,#FFECE6)] hover:text-[var(--ds-accent,#EC6229)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent,#EC6229)] rounded"
        >
          <PinIcon className="w-5 h-5" size={20} />
        </button>
      </div>
    </div>
  );
}

export default PinnedMessageBanner;
