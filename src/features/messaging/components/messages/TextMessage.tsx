"use client";

import React, { useState } from "react";
import { Message } from "@/types/messaging";
import { cn } from "@/lib/utils";
import { DynamicMention } from "@/shared/commonComponents/DynamicMention";
import { Mention } from "../ui/MentionCard";
import { JobPreview } from "./SharedJobMessage";

export interface MessageTextProps {
  message: Message;
  isMediaOnly: boolean;
  isMe: boolean;
  conversationId?: string;
}

export const MessageText = ({
  message,
  isMediaOnly,
  isMe,
  conversationId,
}: MessageTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  if (isMediaOnly) return null;

  // If the message text contains only a post/org/profile/job/offer URL or entity link, hide it
  const rawText = message.text || message.text_content || "";
  const trimmedText = rawText.trim();
  const entityUrlRegex =
    /^(?:https?:\/\/[^\/\s]+)?\/(?:post|profile|organization|job|offer|channel|channels|article)\/[^\s]+$/i;
  const postUrlRegex =
    /^(?:https?:\/\/[^\/\s]+)?\/post\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\/?$/i;
  const profileUrlRegex =
    /^(?:https?:\/\/[^\/\s]+)?\/(?:profile|organization|messaging)\b.*$/i;

  if (
    message.is_unavailable ||
    entityUrlRegex.test(trimmedText) ||
    postUrlRegex.test(trimmedText) ||
    (message.sharedProfileId &&
      (profileUrlRegex.test(trimmedText) ||
        trimmedText === "Shared a profile" ||
        !trimmedText)) ||
    (Boolean(message.sharedPost || (message as any).shared_post || message.sharedPostId || (message as any).shared_post_id) &&
      (trimmedText.toLowerCase() === "shared a post" || !trimmedText))
  ) {
    return null;
  }

  // Measure if content exceeds 20 lines (20 lines * 16px line-height = 320px)
  React.useEffect(() => {
    if (textRef.current) {
      if (textRef.current.scrollHeight > 324) {
        setIsOverflowing(true);
      }
    } else if (rawText.length > 700 || rawText.split('\n').length > 20) {
      setIsOverflowing(true);
    }
  }, [rawText]);

  const renderTextWithMentions = (text: string) => {
    if (!text) return null;

    // Match Job URLs, structured mentions, general URLs, emails, and phone/mobile numbers (with or without country code)
    const combinedRegex =
      /(https?:\/\/[^\s]+\/jobs\/[a-zA-Z0-9-]+(?:\?[^\s]*)?)|(@\[[^\]]+\]\([^)]+\))|(https?:\/\/[^\s]+)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|((?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,5})/g;
    const parts = text.split(combinedRegex);

    if (parts.length <= 1) return text;

    return parts.map((part, i) => {
      if (!part) return null;

      // 1. Handle Job URL preview
      if (part.match(/^https?:\/\/[^\s]+\/jobs\/[a-zA-Z0-9-]+(?:\?[^\s]*)?$/)) {
        const match = part.match(
          /^https?:\/\/[^\s]+\/jobs\/([a-zA-Z0-9-]+)(?:\?[^\s]*)?$/,
        );
        const jobId = match?.[1];
        if (jobId) {
          return (
            <div key={i} className="my-2 max-w-full overflow-hidden">
              <JobPreview jobId={jobId} conversationId={conversationId} />
            </div>
          );
        }
      }

      // 2. Handle Structured Mentions (@[Display Name](handle))
      const structuredMatch = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
      if (structuredMatch) {
        const displayName = structuredMatch[1];
        const handle = structuredMatch[2];
        return (
          <Mention key={i} username={handle} isMe={isMe}>
            <DynamicMention 
              displayName={displayName}
              handle={handle}
              mentionedUsers={message.mentioned_users}
              className="no-underline hover:no-underline hover:opacity-80 transition-opacity cursor-pointer font-bold font-['DM_Sans'] text-xs !text-[var(--ds-accent)]"
            />
          </Mention>
        );
      }

      // 3. Handle standard URLs (show in full, never truncated)
      if (part.match(/^https?:\/\/[^\s]+$/)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-['DM_Sans'] font-normal text-xs leading-4 !text-[var(--ds-accent)] no-underline hover:no-underline hover:opacity-80 transition-opacity inline-block break-all cursor-pointer"
          >
            {part}
          </a>
        );
      }

      // 4. Handle email addresses
      if (part.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        return (
          <a
            key={i}
            href={`mailto:${part}`}
            onClick={(e) => e.stopPropagation()}
            className="font-['DM_Sans'] font-normal text-xs leading-4 !text-[var(--ds-accent)] no-underline hover:no-underline hover:opacity-80 transition-opacity inline-block break-all cursor-pointer"
          >
            {part}
          </a>
        );
      }

      // 5. Handle phone/mobile numbers (with or without international code)
      if (part.match(/^(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{4,5}$/)) {
        return (
          <a
            key={i}
            href={`tel:${part.replace(/\s+/g, '')}`}
            onClick={(e) => e.stopPropagation()}
            className="font-['DM_Sans'] font-normal text-xs leading-4 !text-[var(--ds-accent)] no-underline hover:no-underline hover:opacity-80 transition-opacity inline-block break-all cursor-pointer"
          >
            {part}
          </a>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="font-['DM_Sans'] text-xs font-normal leading-4 w-full max-w-full text-[var(--ds-text-primary)] flex flex-col">
      {/* Frame: Edited Label matching Figma */}
      {message.is_edited &&
        !message.is_deleted_for_everyone &&
        !message.is_deleted_for_me && (
          <span
            className={cn(
              "font-['DM_Sans'] font-normal text-[8px] leading-[12px] text-[var(--ds-text-muted)] select-none h-3 w-[25px] flex items-center mb-0.5",
              isMe ? "self-end text-right justify-end" : "self-start text-left justify-start"
            )}
          >
            Edited
          </span>
        )}
      <div
        ref={textRef}
        className={cn(
          "whitespace-pre-wrap break-words transition-all duration-200",
          !isExpanded && isOverflowing && "line-clamp-[20] max-h-[320px] overflow-hidden"
        )}
        style={
          !isExpanded && isOverflowing
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 20,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                maxHeight: "320px",
              }
            : undefined
        }
      >
        {message.is_deleted_for_everyone ? (
          <span className="font-['DM_Sans'] text-[var(--ds-text-muted)] text-[10px] leading-[12px] italic text-center">
            This message was deleted for everyone
          </span>
        ) : message.is_deleted_for_me ? (
          <span className="font-['DM_Sans'] text-[var(--ds-text-muted)] text-[10px] leading-[12px] italic text-center">
            This message was deleted for you.
          </span>
        ) : (
          renderTextWithMentions(rawText)
        )}
      </div>

      {isOverflowing && (
        <div className="mt-1 flex justify-start">
          <span
            className="font-['DM_Sans'] font-medium text-xs text-[var(--ds-accent)] cursor-pointer no-underline hover:no-underline hover:opacity-80 transition-opacity inline-block"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? "Read less" : "Read more"}
          </span>
        </div>
      )}
    </div>
  );
};

export default MessageText;
