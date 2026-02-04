"use client"

import React from "react"
import Link from "next/link"
import { ChatThread } from "@/types/messaging"
import { avatarGradients } from "@/constants/messaging"

import Avatar from "@/components/shared/Avatar"

const getAvatarGradient = (avatar: string) => {
  return avatarGradients[avatar] || "from-gray-400 to-gray-500";
}

interface ChatListItemProps {
  chat: ChatThread
  isSelected: boolean
  isMobile: boolean
}

export default function ChatListItem({ chat, isSelected, isMobile }: ChatListItemProps) {
  const content = (
    <div
      className={`p-4 cursor-pointer transition-colors border-b border-border hover:bg-muted/50 ${!isMobile && isSelected ? "bg-muted" : ""
        }`}
    >
      <div className="flex gap-3">
        <Avatar
          url={chat.avatar}
          name={chat.name}
          size="lg" // 12 -> 3rem -> lg/xl? 48px is w-12. My size map: lg=12. Correct.
          online={chat.online}
          fallbackGradient="gradient-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
              <h3 className="font-semibold truncate text-foreground min-w-0">
                {chat.name}
              </h3>
              {chat.role && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap flex-shrink-0">
                  {chat.role}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {chat.time}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
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

  return content
}
