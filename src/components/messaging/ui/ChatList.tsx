"use client"

import React, { useMemo, useState } from "react"
import { useTheme } from "next-themes"
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
  const { resolvedTheme } = useTheme()
  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme])
  const [searchTerm, setSearchTerm] = useState("")

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`border-r ${isDark ? "border-[#2d3548]" : "border-gray-200"} flex flex-col h-full`}>
      <div className={`p-4 border-b ${isDark ? "border-[#2d3548]" : "border-gray-200"}`}>
        <h2 className={`mb-3 font-bold text-xl ${isDark ? "text-white" : "text-gray-900"}`}>Messages</h2>
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 ${
              isDark
                ? "bg-[#1e2535] text-white placeholder-gray-400"
                : "bg-gray-100 text-gray-900 placeholder-gray-500"
            } border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B7CFF]`}
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
            <div className={`p-8 text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                No conversations found
            </div>
        )}
      </div>
    </div>
  )
}
