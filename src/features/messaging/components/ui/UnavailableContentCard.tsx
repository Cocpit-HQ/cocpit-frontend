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
        "w-64 p-2.5 rounded-2xl border border-[var(--ds-border)] flex flex-col justify-start items-start gap-1 bg-transparent",
        className
      )}
    >
      <div className="text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4">
        {title}
      </div>
      <div className="self-stretch text-[var(--ds-text-secondary)] text-[10px] font-normal font-['DM_Sans'] leading-3">
        {message}
      </div>
    </div>
  );
}

export default UnavailableContentCard;
