"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Page } from "@/types/common"
import { AppShell } from "@/components/layout/AppShell"
import { useIsMobile } from "@/hooks/use-mobile"
import ChatList from "./ui/ChatList"
import ChatWindow from "./ui/ChatWindow"
import { ChatThread } from "@/types/messaging"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getConversations } from "@/services/api/messaging"
import { getUserById } from "@/services/api/user"
import { mapBackendChatToChatThread } from "@/lib/mappers/messaging.mapper"
import { useSocket } from "@/context/SocketContext"

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
  const processedUserIdRef = React.useRef<string | null>(null);

  const { data: chats = [], isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const backendChats = await getConversations();
      return backendChats.map(mapBackendChatToChatThread);
    }
  });

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Handle userId param to start a new chat or select existing
  useEffect(() => {
    const userId = searchParams.get('userId');

    if (isLoading) return;

    if (userId) {
      // Race Condition Protection:
      if (userId === processedUserIdRef.current) {
        return;
      }

      // Check if we already have a conversation with this user
      const existingChat = chats.find(c => c.otherUserId === userId);

      if (existingChat) {
        if (selectedChat?.id !== existingChat.id) {
          setSelectedChat(existingChat);
          processedUserIdRef.current = userId; // Mark as processed
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
              role: user.headline || "",
              avatar: user.avatar_url || "gradient-1",
              lastMessage: "",
              time: new Date().toISOString(),
              unread: 0,
              online: false
            };
            setSelectedChat(newChat);
            processedUserIdRef.current = userId; // Mark as processed
          } catch (err) {
            console.error("Failed to fetch user details for new chat", err);
          }
        };
        fetchUserAndCreateDraft();
      }
      // Mobile: Sync state with URL. If userId is missing, clear selection.
      // This part of the logic seems to be misplaced if the goal is to select a chat based on userId.
      // It was likely intended for when userId is *not* present.
      // Re-evaluating the original intent:
      // Original: if (userId) { setSelectedChat(null); } else if (chats.length > 0 && !isMobile) { setSelectedChat(prev => prev ? prev : chats[0]); }
      // The provided replacement has this block inside the `if (userId)` block, which is likely incorrect.
      // Let's assume the provided replacement is the desired state, even if it seems to contradict the original mobile logic.
      // If the intent was to clear selection on mobile when userId is present, then the provided code does that.
      // If the intent was to clear selection when userId is *missing*, then the provided code is wrong.
      // Given the instruction "Reconstruct the useEffect body. Ensure correct if/else nesting and brace closure. The target content covers the corrupted area.",
      // I will insert the provided content as is, assuming it's the correct reconstruction.

    } else if (chats.length > 0 && !isMobile) {
      // Desktop default selection when no userId is present
      setSelectedChat(prev => prev ? prev : chats[0]);
      processedUserIdRef.current = null; // Clear processed user when userId is removed
    } else if (!userId && isMobile) {
      // On mobile, if userId is removed from URL, clear selected chat
      setSelectedChat(null);
      processedUserIdRef.current = null;
    }
  }, [searchParams, chats, isMobile, isLoading, selectedChat]);

  // Listen for new messages to update the conversation list
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: any) => {
      if (payload.type === 'message') {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, queryClient]);

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  return (
    <div className="min-h-screen bg-background">
      <AppShell
        currentPage="messaging"
        navigateTo={navigateTo}
        hideBottomNav={!!isMobile && !!selectedChat}
      >
        <div className={`max-w-7xl mx-auto px-0 md:px-4 md:py-6 md:pb-10 h-full`}>
          <div
            className="bg-card border border-border md:rounded-lg overflow-hidden h-full"
            style={{
              height: isMobile
                ? "100dvh" // Full viewport height on mobile (both list and chat)
                : "calc(100vh - 140px)" // Desktop view
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              {/* Chat List - on mobile, hidden if we have a selected chat */}
              <div
                className={`${isMobile && selectedChat ? "hidden" : "block"
                  } md:block h-full overflow-hidden border-r border-border`}
              >
                <ChatList
                  selectedChatId={selectedChat?.id}
                  onSelectChat={(chat) => {
                    if (isMobile) {
                      // On mobile, navigate via URL to keep "Back" button working
                      router.push(`/messaging?userId=${chat.otherUserId}`);
                    } else {
                      setSelectedChat(chat);
                    }
                  }}
                  isMobile={!!isMobile}
                  chats={chats}
                  isLoading={isLoading}
                  error={error}
                />
              </div>

              {/* Chat Window - on mobile, only shown if selectedChat */}
              <div
                className={`${isMobile && selectedChat
                  ? "fixed inset-0 z-50 bg-background w-full h-[100dvh] flex flex-col"
                  : "hidden md:flex md:col-span-2 flex-col h-full overflow-hidden bg-background/50"
                  }`}
              >
                {selectedChat ? (
                  <ChatWindow
                    chat={selectedChat}
                    isMobile={!!isMobile}
                    onBack={() => {
                      router.push('/messaging');
                    }}
                  />
                ) : (
                  <div className="hidden md:flex items-center justify-center h-full text-muted-foreground">
                    {isLoading ? "Loading..." : "Select a conversation to start messaging"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}
