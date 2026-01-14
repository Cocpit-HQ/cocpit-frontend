"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Page } from "@/types/common"
import { AppShell } from "@/components/layout/AppShell"
import { useIsMobile } from "@/hooks/use-mobile"
import ChatList from "./ui/ChatList"
import ChatWindow from "./ui/ChatWindow"
import { ChatThread } from "@/types/messaging"
import { useQuery } from "@tanstack/react-query"
import { getConversations } from "@/services/api/messaging"
import { mapBackendChatToChatThread } from "@/lib/mappers/messaging.mapper"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
  messaging: "/messaging",
}

export default function MessagingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(null)

  const { data: chats = [], isLoading, error } = useQuery({
      queryKey: ['conversations'],
      queryFn: async () => {
        const backendChats = await getConversations();
        return backendChats.map(mapBackendChatToChatThread);
      }
  });

  // Handle userId param to start a new chat or select existing
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && chats.length > 0) {
        // Simple finding logic - in real app might need to create conversation if not exists via API
        // For now, if we find a chat with that user (assuming mapping name/id logic), select it
        // Since we don't have user IDs in mock chat explicitly matching potential query params easily without backend
        // we will just select the first one for demonstration if not found, or handle 'create' logic
    } else if (chats.length > 0 && !isMobile && !selectedChat) {
         setSelectedChat(chats[0]);
    }
  }, [searchParams, chats, isMobile, selectedChat]);


  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="messaging" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-0 md:px-4 md:py-6 pb-20 md:pb-10 h-full">
          <div
            className="bg-card border border-border md:rounded-lg overflow-hidden h-full"
            style={{ height: "calc(100vh - 140px)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              {/* Chat List - Hidden on mobile if chat is selected (handled by routing usually, but here unified) */}
               {/* Actually on mobile we want to show list, clicking goes to detail page.
                   On desktop, split view.
               */}
              <div className={`${isMobile ? "w-full" : "block"} h-full overflow-hidden`}>
                 <ChatList
                    selectedChatId={selectedChat?.id}
                    onSelectChat={setSelectedChat}
                    isMobile={isMobile}
                    chats={chats}
                    isLoading={isLoading}
                    error={error}
                 />
              </div>

              {/* Chat Window - Hidden on mobile, shown on desktop */}
              {!isMobile && (
                <div className="md:col-span-2 flex flex-col h-full overflow-hidden border-l border-border bg-background/50">
                  {selectedChat ? (
                    <ChatWindow chat={selectedChat} isMobile={false} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        {isLoading ? "Loading..." : "Select a conversation to start messaging"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}
