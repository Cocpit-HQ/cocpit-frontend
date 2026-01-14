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
import { getUserById } from "@/services/api/user"
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

    if (isLoading) return;

    if (userId) {
        // Check if we already have a conversation with this user
        const existingChat = chats.find(c => c.otherUserId === userId);

        if (existingChat) {
            if (selectedChat?.id !== existingChat.id) {
                setSelectedChat(existingChat);
            }
        } else {
            // No existing chat, fetch user details to create a draft
            // Avoid re-fetching if we already created a draft for this user
            if (selectedChat?.id === 'new' && selectedChat.otherUserId === userId) return;

            const fetchUserAndCreateDraft = async () => {
                try {
                    const user = await getUserById(userId);
                    const newChat: ChatThread = {
                        id: 'new',
                        otherUserId: user.id,
                        name: user.full_name,
                        avatar: user.avatar_url || "gradient-1", // Fallback to a gradient if no avatar
                        lastMessage: "",
                        time: new Date().toISOString(),
                        unread: 0,
                        online: false
                    };
                    setSelectedChat(newChat);
                } catch (err) {
                    console.error("Failed to fetch user details for new chat", err);
                }
            };
            fetchUserAndCreateDraft();
        }
    } else if (chats.length > 0 && !isMobile && !selectedChat) {
         setSelectedChat(chats[0]);
    }
  }, [searchParams, chats, isMobile, selectedChat, isLoading]);


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
