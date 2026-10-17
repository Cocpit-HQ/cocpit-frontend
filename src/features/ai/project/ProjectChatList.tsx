"use client";

import React from "react";
import type { ProjectChat } from "./project.types";
import ProjectChatListItem from "./ProjectChatListItem";

interface ProjectChatListProps {
  chats: ProjectChat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onRenameChat: (id: string) => void;
  onTogglePinChat: (id: string) => void;
  onRemoveChat: (id: string) => void;
  onShareChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export default function ProjectChatList({
  chats,
  activeChatId,
  onSelectChat,
  onRenameChat,
  onTogglePinChat,
  onRemoveChat,
  onShareChat,
  onDeleteChat,
}: ProjectChatListProps) {
  // Pinned chats appear at top
  const sortedChats = [...chats].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "8px",
        width: "348px",
        overflowY: "auto",
        maxHeight: "100%",
        flex: 1,
        paddingRight: "0px",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
      className="project-chat-list-container [&::-webkit-scrollbar]:hidden"
    >
      {sortedChats.map((chat) => (
        <ProjectChatListItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeChatId}
          onSelect={() => onSelectChat(chat.id)}
          onRename={() => onRenameChat(chat.id)}
          onTogglePin={() => onTogglePinChat(chat.id)}
          onRemoveFromProject={() => onRemoveChat(chat.id)}
          onShare={() => onShareChat(chat.id)}
          onDelete={() => onDeleteChat(chat.id)}
        />
      ))}
    </div>
  );
}
