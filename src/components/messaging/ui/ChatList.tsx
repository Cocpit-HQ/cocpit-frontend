"use client"

import React, { useState } from "react"
import { Search } from "lucide-react"
import { ChatThread } from "@/types/messaging"
import ChatListItem from "./ChatListItem"
import { useQuery } from "@tanstack/react-query"
import { getConversations } from "@/services/api/messaging"
import { mapBackendChatToChatThread } from "@/lib/mappers/messaging.mapper"
import { useSocket } from "@/context/SocketContext"

interface ChatListProps {
  selectedChatId?: string // Updated to string
  onSelectChat?: (chat: ChatThread) => void
  isMobile: boolean
  chats: ChatThread[];
  isLoading: boolean;
  error: Error | null;
}

export default function ChatList({ selectedChatId, onSelectChat, isMobile, chats = [], isLoading, error }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { socket, isUserOnline } = useSocket();

  // Merge online status into chats
  const chatsWithStatus = chats.map(chat => ({
    ...chat,
    online: chat.otherUserId ? isUserOnline(chat.otherUserId) : false
  }));

  const filteredChats = chatsWithStatus.filter((chat) =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="mb-3 font-bold text-xl text-foreground">Messages</h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted text-foreground placeholder-muted-foreground border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Loading conversations...</div>}
        {error && <div className="p-8 text-center text-red-500">Failed to load conversations</div>}

        {!isLoading && !error && chatsWithStatus.filter((chat) =>
          chat.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).map((chat) => (
          <div key={chat.id} onClick={() => onSelectChat?.(chat)}>
            <ChatListItem
              chat={chat}
              isSelected={selectedChatId === chat.id}
              isMobile={isMobile}
            />
          </div>
        ))}
        {!isLoading && !error && filteredChats.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No conversations found
          </div>
        )}
      </div>
    </div>
  )
}
