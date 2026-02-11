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

const UNKNOWN_USER = { id: "unknown" };

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

    // Helper to safely set selected chat if different
    const safelySetSelectedChat = (chat: ChatThread | null) => {
      setSelectedChat(prev => {
        if (prev?.id === chat?.id) return prev;
        return chat;
      });
    };

    if (userId) {
      if (userId === processedUserIdRef.current) return;

      const existingChat = chats.find(c => c.otherUserId === userId);

      if (existingChat) {
        safelySetSelectedChat(existingChat);
        processedUserIdRef.current = userId;
      } else {
        // Prevent repeated fetching for the same new user
        if (processedUserIdRef.current === userId) return;

        // No existing chat, fetch user details to create a draft
        const fetchUserAndCreateDraft = async () => {
          if (!userId || userId === 'null' || userId === 'undefined') return;
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
              lastMessageAt: new Date().toISOString(),
              unread: 0,
              online: false
            };
            safelySetSelectedChat(newChat);
            processedUserIdRef.current = userId;
          } catch (err) {
            console.error("Failed to fetch user details for new chat", err);
          }
        };
        fetchUserAndCreateDraft();
      }
    } else if (groupId) {
      if (groupId === processedUserIdRef.current) return;

      const groupChat = chats.find(c => c.id === groupId);
      if (groupChat) {
        safelySetSelectedChat(groupChat);
        processedUserIdRef.current = groupId;
      }
    } else if (chats.length > 0 && !isMobile) {
      // Desktop default selection
      setSelectedChat(prev => prev ? prev : chats[0]);
      processedUserIdRef.current = null;
    } else if (!userId && !groupId && isMobile) {
      safelySetSelectedChat(null);
      processedUserIdRef.current = null;
    }
  }, [searchParams, chats, isMobile, isLoading]); // Removed selectedChat dependency

  // Listen for new messages to update the conversation list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      queryClient.setQueryData(['conversations'], (oldData: ChatThread[] | undefined) => {
        if (!oldData) return oldData;
        let conversationExists = false;

        const updatedList = oldData.map(c => {
          // Check match by ID (group/conv ID) OR by otherUserId (for 1-on-1 if conversion_id not present in list yet)
          // Also handle simplified match if message.conversation_id matches c.id
          const isMatch = c.id === message.conversation_id ||
            c.id === message.group_id ||
            (!c.isGroup && c.otherUserId === message.sender_id) || // Incoming 1-on-1
            (!c.isGroup && c.otherUserId === message.target_id);   // Outgoing 1-on-1 (if not optimistic)

          if (isMatch) {
            conversationExists = true;
            return {
              ...c,
              lastMessage: message.text_content || (message.shared_post ? "Shared a post" : "Attachment"), // Handle non-text
              time: message.created_at || new Date().toISOString(),
              lastMessageAt: new Date().toISOString(), // FORCE update to now to ensure it jumps to top
              unread: (c.id === selectedChat?.id || (selectedChat?.isGroup && selectedChat.id === c.id)) ? 0 : (c.unread + 1)
            };
          }
          return c;
        });

        if (conversationExists) {
          return [...updatedList].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        } else {
          // New conversation (or not in list), invalidate to fetch
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          return oldData;
        }
      });
    };

    const handleNotification = (payload: any) => {
      if (payload.type !== 'message') {
        // handle other notifications
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleGroupUpdate = (updatedGroup: any) => {
      queryClient.setQueryData(['conversations'], (oldData: ChatThread[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(c => {
          if (c.id === updatedGroup.conversation_id) {
            return {
              ...c,
              name: updatedGroup.conversation_name || c.name,
              avatar: ("group_avatar" in updatedGroup) ? (updatedGroup.group_avatar || "") : c.avatar
            };
          }
          return c;
        });
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('notification', handleNotification);
    socket.on('group_updated', handleGroupUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('notification', handleNotification);
      socket.off('group_updated', handleGroupUpdate);
    };
  }, [socket, queryClient, selectedChat?.id]); // Only depend on ID, not full object

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
                    // Use groupId (conversationId) for all existing chats to handle Deleted Users (who have no otherUserId)
                    router.push(`/messaging?groupId=${chat.id}`);
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
                      currentUser={user || UNKNOWN_USER}
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
