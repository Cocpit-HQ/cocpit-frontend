"use client"

import React, { useState } from "react"
import { Search } from "lucide-react"
import { ChatThread } from "@/types/messaging"
import ChatListItem from "./ChatListItem"

interface ChatListProps {
  chats: ChatThread[]
  selectedChatId?: number
  onSelectChat?: (chat: ChatThread) => void
  isMobile: boolean
}

export default function ChatList({ chats, selectedChatId, onSelectChat, isMobile }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredChats = chats.filter((chat) =>
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

      <div className="flex-1 overflow-y-auto">
        {filteredChats.map((chat) => (
          <div key={chat.id} onClick={() => !isMobile && onSelectChat?.(chat)}>
            <ChatListItem
              chat={chat}
              isSelected={selectedChatId === chat.id}
              isMobile={isMobile}
            />
          </div>
        ))}
        {filteredChats.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
                No conversations found
            </div>
        )}
      </div>
    </div>
  )
}
