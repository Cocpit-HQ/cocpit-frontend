"use client"

import React from "react"
import Link from "next/link"
import { ChatThread } from "@/types/messaging"
import { avatarGradients } from "@/data/mockMessaging"

interface ChatListItemProps {
  chat: ChatThread
  isSelected: boolean
  isMobile: boolean
}

export default function ChatListItem({ chat, isSelected, isMobile }: ChatListItemProps) {
  const content = (
    <div
      className={`p-4 cursor-pointer transition-colors border-b border-border hover:bg-muted/50 ${
        !isMobile && isSelected ? "bg-muted" : ""
      }`}
    >
      <div className="flex gap-3">
        <div className="relative">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${
              avatarGradients[chat.avatar]
            } rounded-full flex-shrink-0`}
          />
          {chat.online && (
            <div
              className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold truncate text-foreground">
              {chat.name}
            </h3>
            <span className="text-xs text-muted-foreground">
              {chat.time}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
                {chat.role && (
                    <span className="text-xs mb-0.5 w-fit px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {chat.role}
                    </span>
                )}
                <p className="text-sm truncate text-muted-foreground">
                {chat.lastMessage}
                </p>
            </div>
            {chat.unread > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {chat.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return <Link href={`/messaging/${chat.id}`} className="block">{content}</Link>
  }

  return content
}
