"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { HistoryItemType } from "./historyDummyData";
import HistoryItemMenu from "./HistoryItemMenu";
import { useIsMobile } from "@/hooks/use-mobile";

interface HistoryItemProps {
  item: HistoryItemType;
  onTogglePin: () => void;
  onRenameClick: () => void;
  onShare: () => void;
  onMoveToProject: () => void;
  onDelete: () => void;
  onSelect?: () => void;
}

export default function HistoryItem({
  item,
  onTogglePin,
  onRenameClick,
  onShare,
  onMoveToProject,
  onDelete,
  onSelect,
}: HistoryItemProps) {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleItemClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("button") && !target.closest("input")) {
      onSelect?.();
    }
  };

  const isRowActive = isHovered || isMenuOpen;
  // Apply ultra light background (#EEF2FF) on hover or while menu is open
  const rowBackground = isRowActive ? "#EEF2FF" : "transparent";

  // Text color is purple (#6366F1) on active row (hover/menu open) or if pinned on mobile.
  // On desktop, it is purple only if pinned.
  const textColor = isMobile
    ? ((item.isPinned || isRowActive) ? "#6366F1" : "#000000")
    : (item.isPinned ? "#6366F1" : "#000000");

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleItemClick}
      className={`flex flex-row items-center justify-between ${isMobile ? "w-full" : "w-[284px]"} h-[40px] px-2 rounded-xl transition-all duration-200 relative cursor-pointer`}
      style={{
        backgroundColor: rowBackground,
        boxSizing: "border-box",
      }}
    >
      {/* History Item Label */}
      <span
        className="truncate font-sans text-[16px] leading-[24px] select-none"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 400,
          color: textColor,
          flexGrow: 1,
          marginRight: "8px",
        }}
        title={item.title}
      >
        {item.title}
      </span>

      {/* Action Button Area */}
      <div className="flex flex-row items-center gap-1 flex-shrink-0">
        {/* Show Unpin icon for pinned items */}
        {((isMobile && item.isPinned) || (!isMobile && item.isPinned && !isRowActive)) && (
          <div
            className="flex items-center justify-center text-[#6366F1]"
            style={{
              padding: "2px",
            }}
          >
            <Icon icon="ph:push-pin-slash-light" width={20} height={20} />
          </div>
        )}

        {/* Show 3-dot dropdown menu */}
        {(isMobile || isRowActive) && (
          <HistoryItemMenu
            isPinned={item.isPinned}
            onRename={onRenameClick}
            onTogglePin={onTogglePin}
            onShare={onShare}
            onMoveToProject={onMoveToProject}
            onDelete={onDelete}
            onOpenChange={(open) => setIsMenuOpen(open)}
            iconColor={isMobile && isRowActive ? "#6366F1" : "#000000"}
          />
        )}
      </div>
    </div>
  );
}
