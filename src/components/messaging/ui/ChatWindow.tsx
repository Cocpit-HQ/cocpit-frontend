"use client"

import React, { useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { MoreHorizontal, Phone, Video } from "lucide-react"
import { ChatThread, Message } from "@/types/messaging"
import { avatarGradients, mockMessages } from "@/data/mockMessaging"
import MessageList from "./MessageList"
import ChatInput from "./ChatInput"
import MobileChatHeader from "./MobileChatHeader"

interface ChatWindowProps {
  chat: ChatThread
  isMobile: boolean
}

export default function ChatWindow({ chat, isMobile }: ChatWindowProps) {
  const { resolvedTheme } = useTheme()
  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme])

  // Local state for messages to allow adding new ones
  const [messages, setMessages] = useState<Message[]>(mockMessages[chat.id] || [])

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      sender: "me",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  // Desktop Header
  const DesktopHeader = () => (
    <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-[#2d3548]" : "border-gray-200"}`}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[chat.avatar]} rounded-full`} />
          {chat.online && (
            <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${isDark ? "border-[#242b3d]" : "border-white"}`} />
          )}
        </div>
        <div>
          <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{chat.name}</h3>
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {chat.role ? chat.role : (chat.online ? "Active now" : "Offline")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
            <Phone className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
        </button>
        <button className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
            <Video className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
        </button>
        <button className={`p-2 ${isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
            <MoreHorizontal className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
        </button>
      </div>
    </div>
  )

  return (
    <div className={`flex flex-col h-full ${isMobile ? "h-dvh bg-white dark:bg-[#171c28]" : ""}`}>
      {isMobile ? <MobileChatHeader chat={chat} /> : <DesktopHeader />}

      {chat.pinnedContext && (
        <div className={`px-4 py-2 text-xs text-center font-medium ${
            isDark ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"
        }`}>
            Context: {chat.pinnedContext}
        </div>
      )}

      <MessageList messages={messages} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  )
}
