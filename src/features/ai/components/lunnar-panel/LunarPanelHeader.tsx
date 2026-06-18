"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LunarPanelHeaderProps {
  onShare: () => void;
  onDownload: () => void;
  onClose: () => void;
  mode?: string;
}

export default function LunarPanelHeader({
  onShare,
  onDownload,
  onClose,
  mode,
}: LunarPanelHeaderProps) {
  const isMobile = useIsMobile();
  return (
    <div className={`box-border flex justify-between items-center ${isMobile || mode === "website" || mode === "job-list" || mode === "history" ? "w-full" : "w-[276px]"} h-[40px] font-sans`}>
      {/* Title */}
      <h2 className="m-0 font-medium text-[16px] leading-[24px] bg-[var(--gradient-primary)] bg-clip-text text-transparent">
        {mode === "history" || mode === "job-list" ? "Lunnar panel" : "Lunar Panel"}
      </h2>

      {/* Actions Row */}
      <div className="flex flex-row items-center gap-2">
        {/* Share Button */}
        {mode !== "history" && (
          <button
            type="button"
            onClick={onShare}
            className="box-border flex items-center justify-center w-[40px] h-[40px] p-2 rounded-full bg-[var(--background)] border-none cursor-pointer shadow-[var(--card-shadow-inner)] hover:bg-[var(--primary-tint)]/20 transition-all duration-200"
            title="Share"
          >
            <Icon icon="fluent:share-28-regular" width={24} height={24} className="text-[var(--foreground)]" />
          </button>
        )}

        {/* Download Button */}
        {mode !== "website" && mode !== "job-list" && mode !== "history" && (
          <button
            type="button"
            onClick={onDownload}
            className="box-border flex items-center justify-center w-[40px] h-[40px] p-2 rounded-full bg-[var(--background)] border-none cursor-pointer shadow-[var(--card-shadow-inner)] hover:bg-[var(--primary-tint)]/20 transition-all duration-200"
            title="Download PNG"
          >
            <Icon icon="fluent:arrow-download-24-regular" width={24} height={24} className="text-[var(--foreground)]" />
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="box-border flex items-center justify-center w-[40px] h-[40px] p-2 rounded-full bg-[var(--background)] border-none cursor-pointer shadow-[var(--card-shadow-inner)] hover:bg-[var(--primary-tint)]/20 transition-all duration-200"
          title="Close"
        >
          <Icon icon="ri:close-line" width={24} height={24} className="text-[var(--foreground)]" />
        </button>
      </div>
    </div>
  );
}
