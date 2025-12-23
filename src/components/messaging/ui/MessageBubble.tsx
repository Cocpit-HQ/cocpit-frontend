"use client"

import React from "react"
import { Message } from "@/types/messaging"

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isMe = message.sender === "me"

  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 relative break-words text-sm md:text-base ${
            isMe
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
              : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border shadow-sm"
          }`}
        >
          {message.text}
        </div>
        {message.isLastInGroup && (
             <span className="text-[10px] mt-1 px-1 text-muted-foreground">
                {message.time}
            </span>
        )}
      </div>
    </div>
  )
}
