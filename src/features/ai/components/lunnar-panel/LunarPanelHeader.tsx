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
      <h2 className="m-0 font-medium text-[16px] leading-[24px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
        {mode === "history" || mode === "job-list" ? "Lunnar panel" : "Lunar Panel"}
      </h2>

      {/* Actions Row */}
      <div className="flex flex-row items-center gap-2">
        {/* Share Button */}
        {mode !== "history" && (
          <button
            type="button"
            onClick={onShare}
            className="box-border flex items-center justify-center w-[40px] h-[40px] p-2 rounded-full bg-white border-none cursor-pointer shadow-[0_0_4px_rgba(99,102,241,0.05)] hover:bg-[#F9FAFB] transition-all duration-200"
            title="Share"
          >
            <Icon icon="fluent:share-28-regular" width={24} height={24} className="text-black" />
          </button>
        )}

        {/* Download Button */}
        {mode !== "website" && mode !== "job-list" && mode !== "history" && (
          <button
            type="button"
            onClick={onDownload}
            className="box-border flex items-center justify-center w-[40px] h-[40px] p-2 rounded-full bg-white border-none cursor-pointer shadow-[0_0_4px_rgba(99,102,241,0.05)] hover:bg-[#F9FAFB] transition-all duration-200"
            title="Download PNG"
          >
            <Icon icon="fluent:arrow-download-24-regular" width={24} height={24} className="text-black" />
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="box-border flex items-center justify-center w-[40px] h-[40px] p-2 rounded-full bg-white border-none cursor-pointer shadow-[0_0_4px_rgba(99,102,241,0.05)] hover:bg-[#F9FAFB] transition-all duration-200"
          title="Close"
        >
          <Icon icon="ri:close-line" width={24} height={24} className="text-black" />
        </button>
      </div>
    </div>
  );
}
