"use client";

import React from "react";
import { HistoryItemType } from "./historyDummyData";
import HistoryItem from "./HistoryItem";
import { useIsMobile } from "@/hooks/use-mobile";

interface HistoryListProps {
  items: HistoryItemType[];
  onTogglePin: (id: string) => void;
  onRename: (item: HistoryItemType) => void;
  onShare: (item: HistoryItemType) => void;
  onMoveToProject: (item: HistoryItemType) => void;
  onDelete: (id: string) => void;
  onSelectHistoryItem?: (id: string) => void;
}

export default function HistoryList({
  items,
  onTogglePin,
  onRename,
  onShare,
  onMoveToProject,
  onDelete,
  onSelectHistoryItem,
}: HistoryListProps) {
  const isMobile = useIsMobile();
  // Sort: Pinned items appear first in the list
  const sortedItems = [...items].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div
      className="scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: isMobile ? "100%" : "284px",
        flexGrow: 1,
        minHeight: 0,
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {sortedItems.map((item) => (
        <HistoryItem
          key={item.id}
          item={item}
          onTogglePin={() => onTogglePin(item.id)}
          onRenameClick={() => onRename(item)}
          onShare={() => onShare(item)}
          onMoveToProject={() => onMoveToProject(item)}
          onDelete={() => onDelete(item.id)}
          onSelect={() => onSelectHistoryItem?.(item.id)}
        />
      ))}
    </div>
  );
}
