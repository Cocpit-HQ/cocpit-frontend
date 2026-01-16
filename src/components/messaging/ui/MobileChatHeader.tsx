"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MoreHorizontal, Phone, Video } from "lucide-react"
import { ChatThread } from "@/types/messaging"
import Avatar from "@/components/shared/Avatar"

interface MobileChatHeaderProps {
  chat: ChatThread;
  onBack: () => void;
}

export default function MobileChatHeader({ chat, onBack }: MobileChatHeaderProps) {
  const router = useRouter()

  return (
    <div
      className="w-full p-3 border-b flex items-center justify-between bg-background border-border overflow-hidden shrink-0"
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="p-2 rounded-full transition-colors hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <Avatar
            url={chat.avatar}
            name={chat.name}
            size="sm" // w-9 h-9 is 36px. sm is 32px (w-8), md is 40px (w-10). Let's use md adjusted or just md. md is w-10. original was w-9. Close enough.
            online={chat.online}
          />
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-semibold text-sm text-foreground truncate w-full">
              {chat.name}
            </h3>
            {chat.role && (
              <p className="text-xs text-primary truncate w-full">{chat.role}</p>
            )}
            {!chat.role && (
              <p className="text-xs text-muted-foreground truncate w-full">
                {chat.online ? "Active now" : "Offline"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
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
