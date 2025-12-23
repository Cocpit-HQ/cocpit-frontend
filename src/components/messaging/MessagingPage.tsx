"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { mockChats } from "@/data/mockMessaging"
import { ChatThread } from "@/types/messaging"
import ChatList from "./ui/ChatList"
import ChatWindow from "./ui/ChatWindow"
import { AppShell } from "@/components/layout/AppShell"
import type { Page } from "@/types/common"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
  achievements: "/achievements",
  messaging: "/messaging",
}

export default function MessagingPage() {
  const router = useRouter()
  // Removed useTheme
  const isMobile = useIsMobile()

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [selectedChat, setSelectedChat] = useState<ChatThread>(mockChats[0])

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="messaging" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-0 md:px-4 md:py-6 pb-20 md:pb-10 h-full">
          <div
            className="bg-card border border-border md:rounded-lg overflow-hidden h-full"
          >
            {isMobile ? (
              <ChatList chats={mockChats} isMobile={true} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                <ChatList
                    chats={mockChats}
                    selectedChatId={selectedChat?.id}
                    onSelectChat={setSelectedChat}
                    isMobile={false}
                />
                <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                  {selectedChat ? (
                    <ChatWindow chat={selectedChat} isMobile={false} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a conversation to start chatting
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </div>
  )
}
