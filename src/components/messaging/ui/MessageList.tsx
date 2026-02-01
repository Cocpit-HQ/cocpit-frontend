"use client"

import React, { useEffect, useRef } from "react"
import { Message } from "@/types/messaging"
import MessageBubble from "./MessageBubble"

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Group messages logic
  const groupedMessages = messages.map((msg, index) => {
    const prev = messages[index - 1]
    const next = messages[index + 1]

    // Simple grouping logic based on sender and time (within same minute for simplicity)
    const isFirstInGroup = !prev || prev.sender !== msg.sender
    const isLastInGroup = !next || next.sender !== msg.sender

    return { ...msg, isFirstInGroup, isLastInGroup }
  })

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
      {groupedMessages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
