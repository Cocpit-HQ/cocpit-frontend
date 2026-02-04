"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Page } from "@/types/common"
import { AppShell } from "@/components/layout/AppShell"
import { useIsMobile } from "../../hooks/use-mobile"
import ChatList from "./ui/ChatList"
import ChatWindow from "./ui/ChatWindow"
import { ChatThread } from "../../types/messaging"
import { useQuery, useQueryClient } from "@tanstack/react-query" // Restored import
import { getConversations } from "../../services/api/messaging"
import { getUserById } from "../../services/api/user"
import { mapBackendChatToChatThread } from "../../lib/mappers/messaging.mapper"
import { useSocket } from "../../context/SocketContext"
import { useAuth } from "../../hooks/use-auth"
import GroupChat from "./group-chat/GroupChat"
import { GroupChatProvider } from "./group-chat/groupChat.context"
import CreateGroupModal from "./group-chat/CreateGroupModal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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

  const { user } = useAuth();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Handle userId param to start a new chat or select existing
  useEffect(() => {
    const userId = searchParams.get('userId');
    const groupId = searchParams.get('groupId');

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
          if (!userId || userId === 'null' || userId === 'undefined') {
            // console.warn("Invalid userId for new chat:", userId);
            return;
          }
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
    } else if (groupId) {
      const groupChat = chats.find(c => c.id === groupId);
      if (groupChat) {
        if (selectedChat?.id !== groupChat.id) {
          setSelectedChat(groupChat);
        }
        processedUserIdRef.current = groupId;
      }
    } else if (chats.length > 0 && !isMobile) {
      // Desktop default selection when no userId is present
      setSelectedChat(prev => prev ? prev : chats[0]);
      processedUserIdRef.current = null; // Clear processed user when userId is removed
    } else if (!userId && !groupId && isMobile) { // Added !groupId to ensure it's only when no specific chat is requested
      // On mobile, if userId/groupId is removed from URL, clear selected chat
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
      <div className="max-w-7xl mx-auto px-0 md:px-4 md:py-6 md:pb-10 h-full">
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
                } md:block h-full overflow-hidden border-r border-border flex flex-col`}
            >
              <ChatList
                selectedChatId={selectedChat?.id}
                onSelectChat={(chat) => {
                  if (isMobile) {
                    // On mobile, navigate via URL to keep "Back" button working
                    if (chat.isGroup) {
                      router.push(`/messaging?groupId=${chat.id}`);
                    } else {
                      router.push(`/messaging?userId=${chat.otherUserId}`);
                    }
                  } else {
                    setSelectedChat(chat);
                  }
                }}
                isMobile={!!isMobile}
                chats={chats}
                isLoading={isLoading}
                error={error}
                onCreateGroup={() => setIsCreateGroupOpen(true)}
              />
              <div className="p-4 border-t border-border">
                <Button className="w-full" variant="outline" onClick={() => setIsCreateGroupOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
            </div>

            {/* Chat Window - on mobile, only shown if selectedChat */}
            <div
              className={`${isMobile && selectedChat
                ? "fixed inset-0 z-50 bg-background w-full h-[100dvh] flex flex-col"
                : "hidden md:flex md:col-span-2 flex-col h-full overflow-hidden bg-background/50"
                }`}
            >
              {selectedChat ? (
                selectedChat.isGroup ? (
                  <GroupChatProvider groupId={selectedChat.id}>
                    <GroupChat
                      groupId={selectedChat.id}
                      currentUser={user || { id: "unknown" }} // Fallback for loading state
                      onBack={() => {
                        if (isMobile) router.push('/messaging');
                        else setSelectedChat(null);
                      }}
                    />
                  </GroupChatProvider>
                ) : (
                  <ChatWindow
                    chat={selectedChat}
                    isMobile={!!isMobile}
                    onBack={() => {
                      router.push('/messaging');
                    }}
                  />
                )) : (
                <div className="hidden md:flex items-center justify-center h-full text-muted-foreground">
                  {isLoading ? "Loading..." : "Select a conversation to start messaging"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <GroupChatProvider>
        <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />
      </GroupChatProvider>
    </div>
  )
}
