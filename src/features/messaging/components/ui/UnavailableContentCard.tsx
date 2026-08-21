"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface UnavailableContentCardProps {
  title?: string;
  message?: string;
  className?: string;
  isMe?: boolean;
  embedded?: boolean;
}

export function UnavailableContentCard({
  title = "Message unavailable",
  message = "This content may have been deleted by its owner or hidden by their privacy settings",
  className = "",
  isMe = false,
  embedded = false,
}: UnavailableContentCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-start items-start gap-1 w-full max-w-[280px]",
        !embedded && (
          isMe
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[12px] px-[16px] py-[12px]"
            : "bg-chat-bubble-received-bg text-[var(--foreground)] rounded-[12px] px-[16px] py-[12px]"
        ),
        className
      )}
    >
      <div
        className={cn(
          "text-xs font-semibold leading-4",
          isMe ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </div>
      <div
        className={cn(
          "text-[11px] font-normal leading-snug",
          isMe ? "text-white/80" : "text-muted-foreground"
        )}
      >
        {message}
      </div>
    </div>
  );
}

export default UnavailableContentCard;
