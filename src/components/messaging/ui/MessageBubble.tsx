"use client"

import React, { useMemo } from "react"
import { useTheme } from "next-themes"
import { Message } from "@/types/messaging"

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { resolvedTheme } = useTheme()
  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme])
  const isMe = message.sender === "me"

  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 relative break-words text-sm md:text-base ${
            isMe
              ? "bg-[#5B7CFF] text-white rounded-2xl rounded-tr-sm"
              : isDark
              ? "bg-[#2d3548] text-white rounded-2xl rounded-tl-sm"
              : "bg-white border border-gray-100 shadow-sm text-gray-900 rounded-2xl rounded-tl-sm"
          }`}
        >
          {message.text}
        </div>
        {message.isLastInGroup && (
             <span className={`text-[10px] mt-1 px-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {message.time}
            </span>
        )}
      </div>
    </div>
  )
}
