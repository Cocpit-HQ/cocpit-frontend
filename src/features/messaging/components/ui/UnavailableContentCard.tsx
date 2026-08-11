"use client";

import React from "react";

interface UnavailableContentCardProps {
  title?: string;
  message?: string;
  className?: string;
  isMe?: boolean;
}

export function UnavailableContentCard({
  title = "Message unavailable",
  message = "This content may have been deleted by its owner or hidden by their privacy settings",
  className = "",
  isMe = false,
}: UnavailableContentCardProps) {
  return (
    <div className={`flex flex-col justify-start items-start gap-1 w-full max-w-[260px] ${className}`}>
      <div className={`text-xs font-semibold leading-4 ${isMe ? "text-white" : "text-foreground"}`}>
        {title}
      </div>
      <div className={`text-[11px] font-normal leading-snug ${isMe ? "text-white/70" : "text-muted-foreground"}`}>
        {message}
      </div>
    </div>
  );
}

export default UnavailableContentCard;
