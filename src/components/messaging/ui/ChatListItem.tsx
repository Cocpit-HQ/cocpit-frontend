"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { ChatThread } from "@/types/messaging"
import { avatarGradients } from "@/data/mockMessaging"

interface ChatListItemProps {
  chat: ChatThread
  isSelected: boolean
  isMobile: boolean
}

export default function ChatListItem({ chat, isSelected, isMobile }: ChatListItemProps) {
  const { resolvedTheme } = useTheme()
  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme])

  const content = (
    <div
      className={`p-4 cursor-pointer transition-colors border-b ${
        isDark ? "border-[#2d3548] hover:bg-[#2d3548]" : "border-gray-200 hover:bg-gray-50"
      } ${!isMobile && isSelected ? (isDark ? "bg-[#2d3548]" : "bg-[#EAF4FF]") : ""}`}
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
              className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${
                isDark ? "border-[#242b3d]" : "border-white"
              }`}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
              {chat.name}
            </h3>
            <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {chat.time}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
                {chat.role && (
                    <span className={`text-xs mb-0.5 w-fit px-1.5 py-0.5 rounded-full ${
                        isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
                    }`}>
                        {chat.role}
                    </span>
                )}
                <p className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {chat.lastMessage}
                </p>
            </div>
            {chat.unread > 0 && (
              <span className="ml-2 bg-[#5B7CFF] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
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
