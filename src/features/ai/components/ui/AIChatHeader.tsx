"use client"

import React from "react";
import { Icon } from "@iconify/react";

interface AIChatHeaderProps {
  onClear?: () => void;
  isStreaming?: boolean;
  hasMessages?: boolean;
  onNewChat?: () => void;
}

export default function AIChatHeader({
  onClear,
  isStreaming = false,
  hasMessages = false,
  onNewChat,
}: AIChatHeaderProps) {
  return (
    <div className="w-full h-[72px] flex items-center justify-between bg-white shrink-0 px-6 py-4 border-b border-[#E0E7FF]">
      {/* Left: Expand icon */}
      <button
        type="button"
        className="flex items-center justify-center w-10 h-10 rounded-lg text-[#000000] hover:bg-[#EEF2FF] hover:text-[#6366F1] transition-all"
        title="Expand"
      >
        <Icon icon="ri:fullscreen-line" width={24} height={24} />
      </button>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2">
        {isStreaming && (
          <div className="flex items-center justify-center w-8 h-8 mr-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}

        {!hasMessages ? (
          // Empty state: History & Project with text labels
          <>
            <button
              type="button"
              onClick={onClear}
              className="flex items-center justify-center w-[96px] h-10 px-2 rounded-lg text-[#000000] hover:bg-[#EEF2FF] hover:text-[#6366F1] gap-2 transition-all"
              title="History"
            >
              <Icon icon="ri:history-line" width={24} height={24} className="text-[#6B7280] hover:text-inherit" />
              <span className="text-sm font-normal" style={{ fontFamily: "Poppins" }}>History</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center w-[97px] h-10 px-2 rounded-lg text-[#000000] hover:bg-[#EEF2FF] hover:text-[#6366F1] gap-2 transition-all"
              title="Project"
            >
              <Icon icon="ri:layout-grid-line" width={24} height={24} className="text-[#6B7280] hover:text-inherit" />
              <span className="text-sm font-normal" style={{ fontFamily: "Poppins" }}>Project</span>
            </button>
          </>
        ) : (
          // Active state: Share, History, Project, and New Chat icon-only buttons
          <>
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-[#000000] hover:bg-[#EEF2FF] hover:text-[#6366F1] transition-all"
              title="Share"
            >
              <Icon icon="ri:share-box-line" width={24} height={24} className="text-[#6B7280] hover:text-inherit" />
            </button>
            <button
              type="button"
              onClick={onClear}
              className="flex items-center justify-center w-10 h-10 rounded-lg text-[#000000] hover:bg-[#EEF2FF] hover:text-[#6366F1] transition-all"
              title="History"
            >
              <Icon icon="ri:history-line" width={24} height={24} className="text-[#6B7280] hover:text-inherit" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-[#000000] hover:bg-[#EEF2FF] hover:text-[#6366F1] transition-all"
              title="Project"
            >
              <Icon icon="ri:layout-grid-line" width={24} height={24} className="text-[#6B7280] hover:text-inherit" />
            </button>
            <button
              type="button"
              onClick={onNewChat || onClear}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#EEF2FF] text-[#6366F1] hover:bg-[#E0E7FF] transition-all"
              title="New Chat"
            >
              <Icon icon="ri:compass-discover-line" width={24} height={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}