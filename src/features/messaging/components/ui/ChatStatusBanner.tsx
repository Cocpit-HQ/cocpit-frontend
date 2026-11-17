"use client";

import React from "react";
import { ChatThread } from "@/types/messaging";

interface ChatStatusBannerProps {
  chat: ChatThread;
  isGroupInvitation: boolean;
  isBlockedByMe: boolean;
  isBlockedByOther: boolean;
  typingDisplayString: string | null;
  isDeclinedCooldown?: boolean;
}

export default function ChatStatusBanner({
  chat,
  isGroupInvitation,
  isBlockedByMe,
  isBlockedByOther,
  typingDisplayString,
  isDeclinedCooldown = false,
}: ChatStatusBannerProps) {
  return (
    <>
      {/* Declined Request 24h Cooldown Banner */}
      {!isBlockedByMe && isDeclinedCooldown && (
        <div className="px-4 py-2 my-1 flex items-center justify-center text-center shrink-0">
          <span className="text-xs font-medium text-[var(--ds-text-secondary)] bg-[var(--ds-surface-1)] px-4 py-1.5 rounded-full border border-[var(--ds-border)] font-['DM_Sans']">
            You can’t send a chat request to this user right now. Please try again after 24 hours.
          </span>
        </div>
      )}

      {/* Pinned Context Banner */}
      {chat.pinnedContext && !isGroupInvitation && (
        <div className="px-4 py-2 text-xs text-center font-medium font-['DM_Sans'] bg-[var(--ds-surface-1)] text-[var(--ds-text-primary)] border-b border-[var(--ds-border)]">
          Context: {chat.pinnedContext}
        </div>
      )}

      {/* Typing Indicator */}
      {typingDisplayString &&
        !isBlockedByMe &&
        !isBlockedByOther &&
        !isGroupInvitation && (
          <div className="px-4 sm:px-6 py-1.5 flex items-center gap-2 bg-transparent text-[var(--ds-text-secondary)] font-['DM_Sans'] font-normal text-xs leading-4 shrink-0">
            <span className="flex gap-1 items-center">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--ds-text-secondary)] animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--ds-text-secondary)] animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--ds-text-secondary)] animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
            <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-secondary)] truncate">
              {typingDisplayString}
            </span>
          </div>
        )}

    </>
  );
}


