"use client"

import React, { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ArrowLeft, MoreHorizontal, Phone, Video } from "lucide-react"
import { ChatThread } from "@/types/messaging"
import { avatarGradients } from "@/data/mockMessaging"

interface MobileChatHeaderProps {
  chat: ChatThread
}

export default function MobileChatHeader({ chat }: MobileChatHeaderProps) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme])

  return (
    <div
      className={`sticky top-0 z-10 p-3 border-b flex items-center justify-between ${
        isDark ? "bg-[#171c28] border-[#2d3548]" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className={`p-2 rounded-full transition-colors ${
            isDark ? "hover:bg-[#2d3548]" : "hover:bg-gray-100"
          }`}
        >
          <ArrowLeft className={`w-6 h-6 ${isDark ? "text-gray-200" : "text-gray-700"}`} />
        </button>

        <div className="flex items-center gap-2">
            <div className="relative">
            <div
                className={`w-9 h-9 bg-gradient-to-br ${
                avatarGradients[chat.avatar]
                } rounded-full`}
            />
            {chat.online && (
                <div
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 ${
                    isDark ? "border-[#171c28]" : "border-white"
                }`}
                />
            )}
            </div>
            <div>
            <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                {chat.name}
            </h3>
            {chat.role && (
                 <p className={`text-xs ${isDark ? "text-blue-400" : "text-blue-600"}`}>{chat.role}</p>
            )}
            {!chat.role && (
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {chat.online ? "Active now" : "Offline"}
                </p>
            )}
            </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className={`p-2 rounded-full ${isDark ? "text-gray-400 hover:bg-[#2d3548]" : "text-gray-600 hover:bg-gray-100"}`}>
            <Phone className="w-5 h-5" />
        </button>
        <button className={`p-2 rounded-full ${isDark ? "text-gray-400 hover:bg-[#2d3548]" : "text-gray-600 hover:bg-gray-100"}`}>
            <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
