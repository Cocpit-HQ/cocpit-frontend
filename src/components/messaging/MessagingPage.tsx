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
import { mapBackendChatToChatThread, formatTimeAgo } from "../../lib/mappers/messaging.mapper"
import { useSocket } from "../../context/SocketContext"
import { useAuth } from "../../hooks/use-auth"
import GroupChat from "./group-chat/GroupChat"
import { GroupChatProvider } from "./group-chat/groupChat.context"
import CreateGroupModal from "./group-chat/CreateGroupModal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useActiveProfile } from "@/context/ActiveProfileContext"

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

  const { activeProfile } = useActiveProfile();
  const rawChatsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const backendChats = await getConversations();
      return backendChats.map(mapBackendChatToChatThread);
    },
    staleTime: Infinity, // Prevent refetch on mounting/updates unless explicit invalidation
    refetchOnWindowFocus: false,
  });

  // No longer blocking company chats on the frontend
  const chats = React.useMemo(() => {
    const all = rawChatsQuery.data || [];
    return all.filter(c => !c.isDeleted);
  }, [rawChatsQuery.data]);
  const isLoading = rawChatsQuery.isLoading;
  const error = rawChatsQuery.error;

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
            const response = await getUserById(userId);
            const user = response.user;
            const newChat: ChatThread = {
              id: 'new',
              otherUserId: user.id,
              name: user.name,
              role: user.headline || "",
              avatar: user.avatar || "gradient-1",
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

          // Fix: Strict separation of Group vs 1-on-1 updates
          // If message is for a group (has conversation_id/group_id AND isGroup flag or id matches a group), 
          // it MUST NOT fallback to matching by user ID.

          const messageGroupId = (message as any).isGroup ? (message.conversation_id || message.group_id) : undefined;

          let isMatch = false;

          if (messageGroupId) {
            // It's a group message. Only match if this chat IS that group.
            isMatch = c.id === messageGroupId;
          } else {
            // It's a 1-on-1 or unspecified message
            if (message.conversation_id && c.id === message.conversation_id) {
              isMatch = true;
            } else if (!c.isGroup && !message.isGroup) {
              // Fallback: match by user ID ONLY if it's not a group message and chat is not a group
              isMatch = c.otherUserId === message.sender_id || c.otherUserId === message.target_id;
            }
          }

          if (isMatch) {
            conversationExists = true;
            return {
              ...c,
              lastMessage: message.text_content || (message.shared_post ? "Shared a post" : "Attachment"), // Handle non-text
              time: formatTimeAgo(message.created_at || new Date().toISOString()),
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
      // Only invalidate if absolutely necessary.
      // For messages, we handle via 'new_message' manually.
      // For other types, maybe we don't need to invalidate conversations?
      // If it's a new conversation start, 'new_message' should handle it (by checking existence).
      if (payload.type === 'message') {
        // Do nothing, handled by new_message
      }
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

    const handleConversationUpdated = (payload: any) => {
      // Trigger refetch to get the accurate last message (handling delete-for-me/everyone)
      // queryClient.invalidateQueries({ queryKey: ['conversations'] }); // Avoid full refetch, rely on socket events updating specific message state?
      // Actually, for delete-for-me/everyone, we might receive separate events in GroupChat.
      // If we need to update the last message plain text in the sidebar:
      // We should ideally update cache manually if payload contains data.
      // For now, disabling to meet requirement of NO REFETCH on message send/update.
    };

    socket.on('new_message', handleNewMessage);
    socket.on('notification', handleNotification);
    socket.on('group_updated', handleGroupUpdate);
    socket.on('conversation-updated', handleConversationUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('notification', handleNotification);
      socket.off('group_updated', handleGroupUpdate);
      socket.off('conversation-updated', handleConversationUpdated);
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
                onSelectChat={React.useCallback((chat: ChatThread) => {
                  if (isMobile) {
                    // On mobile, navigate via URL to keep "Back" button working
                    // Use groupId (conversationId) for all existing chats to handle Deleted Users (who have no otherUserId)
                    router.push(`/messaging?groupId=${chat.id}`);
                  } else {
                    setSelectedChat(chat);
                  }
                }, [isMobile, router])}
                isMobile={!!isMobile}
                chats={chats}
                isLoading={isLoading}
                error={error}
                onCreateGroup={() => setIsCreateGroupOpen(true)}
                isCompany={activeProfile?.type === 'COMPANY'}
              />
              {activeProfile?.type !== 'COMPANY' && (
                <div className="p-4 border-t border-border">
                  <Button className="w-full" variant="outline" onClick={() => setIsCreateGroupOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </div>
              )}
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
                <div className="hidden md:flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                  {activeProfile?.type === 'COMPANY' ? (
                    <>
                      <p className="font-semibold">Company Messaging</p>
                      <p className="text-sm">Messaging is not yet available for Company Profiles.</p>
                    </>
                  ) : (
                    <p>{isLoading ? "Loading..." : "Select a conversation to start messaging"}</p>
                  )}
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
