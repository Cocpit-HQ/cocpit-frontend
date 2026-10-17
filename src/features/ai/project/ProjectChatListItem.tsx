"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import type { ProjectChat } from "./project.types";
import ProjectChatActionsMenu from "./ProjectChatActionsMenu";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectChatListItemProps {
  chat: ProjectChat;
  isActive: boolean;
  onSelect: () => void;
  onRename: () => void;
  onTogglePin: () => void;
  onRemoveFromProject: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export default function ProjectChatListItem({
  chat,
  isActive,
  onSelect,
  onRename,
  onTogglePin,
  onRemoveFromProject,
  onShare,
  onDelete,
}: ProjectChatListItemProps) {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isRowActive = isHovered || isMenuOpen;
  const backgroundColor = isActive || isRowActive ? "var(--primary-tint)" : "transparent";
 
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "12px 16px",
        gap: "8px",
        height: "64px",
        width: "100%",
        backgroundColor,
        borderRadius: "24px",
        cursor: "pointer",
        transition: "background-color 0.2s ease-in-out",
        position: "relative",
      }}
    >
      {/* Title & Metadata Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Title */}
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "24px",
            color: "var(--foreground)",
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={chat.title}
        >
          {chat.title}
        </span>
 
        {/* Metadata */}
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "12px",
            lineHeight: "16px",
            color: "var(--muted-foreground)",
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {chat.lastMessageTime}
        </span>
      </div>
 
      {/* Right Actions Area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()} // Prevent selecting the chat when interacting with actions
      >
        {/* Show pin indicator if chat is pinned and not hovered/menu open */}
        {chat.isPinned && !isRowActive && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--primary)",
              padding: "8px",
            }}
          >
            <Icon icon="ph:push-pin-slash-light" width={20} height={20} />
          </div>
        )}

        {/* Show actions dropdown on hover, open, or always on mobile */}
        {(isMobile || isRowActive) && (
          <ProjectChatActionsMenu
            isPinned={chat.isPinned}
            onRename={onRename}
            onTogglePin={onTogglePin}
            onRemoveFromProject={onRemoveFromProject}
            onShare={onShare}
            onDelete={onDelete}
            onOpenChange={(open) => setIsMenuOpen(open)}
          />
        )}
      </div>
    </div>
  );
}
