"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MoreHorizontal, Phone, Video } from "lucide-react"
import { ChatThread } from "@/types/messaging"
import { avatarGradients } from "@/data/mockMessaging"

interface MobileChatHeaderProps {
  chat: ChatThread
}

export default function MobileChatHeader({ chat }: MobileChatHeaderProps) {
  const router = useRouter()

  return (
    <div
      className="sticky top-0 z-10 p-3 border-b flex items-center justify-between bg-background border-border"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
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
                className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"
                />
            )}
            </div>
            <div>
            <h3 className="font-semibold text-sm text-foreground">
                {chat.name}
            </h3>
            {chat.role && (
                 <p className="text-xs text-primary">{chat.role}</p>
            )}
            {!chat.role && (
                <p className="text-xs text-muted-foreground">
                    {chat.online ? "Active now" : "Offline"}
                </p>
            )}
            </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
