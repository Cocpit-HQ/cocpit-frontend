"use client"

import React, { useState } from "react"
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
    <div className="p-4 border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[chat.avatar]} rounded-full`} />
          {chat.online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{chat.name}</h3>
          <p className="text-xs text-muted-foreground">
            {chat.role ? chat.role : (chat.online ? "Active now" : "Offline")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            <Video className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  return (
    <div className={`flex flex-col h-full ${isMobile ? "h-dvh bg-background" : ""}`}>
      {isMobile ? <MobileChatHeader chat={chat} /> : <DesktopHeader />}

      {chat.pinnedContext && (
        <div className="px-4 py-2 text-xs text-center font-medium bg-primary/20 text-primary">
            Context: {chat.pinnedContext}
        </div>
      )}

      <MessageList messages={messages} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  )
}
