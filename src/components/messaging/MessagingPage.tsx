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
import { getConversations, getActiveSession } from "../../services/api/messaging"
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
  const processedMessagesRef = React.useRef<Set<string>>(new Set());

  const { activeProfile } = useActiveProfile();

  // Clear selected chat when switching profiles (user <-> company)
  useEffect(() => {
    setSelectedChat(null);
    processedUserIdRef.current = null;
  }, [activeProfile?.id, activeProfile?.type]);

  const rawChatsQuery = useQuery({
    queryKey: ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'],
    queryFn: async () => {
      const params = activeProfile?.type === 'COMPANY' ? { companyId: activeProfile.id } : {};
      const backendChats = await getConversations(params);
      return backendChats.map(mapBackendChatToChatThread);
    },
    staleTime: Infinity, // Prevent refetch on mounting/updates unless explicit invalidation
    refetchOnWindowFocus: false,
  });

  // Filter out deleted chats, and in company mode enrich with session indicators
  const chats = React.useMemo(() => {
    const all = rawChatsQuery.data || [];
    return all.filter(c => !c.isDeleted);
  }, [rawChatsQuery.data]);
  const isLoading = rawChatsQuery.isLoading;
  const error = rawChatsQuery.error;

  // Fetch session status for each company conversation and enrich chats
  const isCompanyMode = activeProfile?.type === 'COMPANY';
  const companyId = isCompanyMode ? activeProfile.id : undefined;

  const { user } = useAuth();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const { socket } = useSocket();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!isCompanyMode || !companyId || !chats.length) return;

    const queryKey = ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'];
    let cancelled = false;

    const fetchSessionStatuses = async () => {
      const updates: Record<string, { status: 'mine' | 'other' | 'unclaimed'; handler?: string }> = {};

      // Batch: fetch sessions for non-group conversations
      const nonGroupChats = chats.filter(c => !c.isGroup);
      await Promise.all(
        nonGroupChats.map(async (c) => {
          try {
            const data = await getActiveSession(c.id, companyId!);
            if (!data.featureEnabled) return;
            if (!data.session) {
              updates[c.id] = { status: 'unclaimed' };
            } else if (data.session.handler_user_id === user?.id) {
              updates[c.id] = { status: 'mine', handler: data.session.handler_name_snapshot };
            } else {
              updates[c.id] = { status: 'other', handler: data.session.handler_name_snapshot };
            }
          } catch { /* ignore individual failures */ }
        })
      );

      if (cancelled) return;

      // Update cache with session statuses
      queryClient.setQueryData(queryKey, (oldData: ChatThread[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(c => {
          const update = updates[c.id];
          if (update) {
            return { ...c, sessionStatus: update.status, sessionHandlerName: update.handler };
          }
          return c;
        });
      });
    };

    fetchSessionStatuses();

    return () => { cancelled = true; };
  }, [isCompanyMode, companyId, chats.length, user?.id]); // Only re-run when company mode changes or chat count changes

  // Handle userId param to start a new chat or select existing
  useEffect(() => {
    const userId = searchParams.get('userId');
    const groupId = searchParams.get('groupId');
    const conversationId = searchParams.get('conversationId');

    if (isLoading) return;

    // Handle conversationId param (from notification click) — works for all chat types
    if (conversationId) {
      if (conversationId === processedUserIdRef.current) return;
      const targetChat = chats.find(c => c.id === conversationId);
      if (targetChat) {
        setSelectedChat(targetChat);
        processedUserIdRef.current = conversationId;
      }
      return;
    }

    // Company profile: handle userId only when companyId is also present (initiated from user profile "Message" button)
    if (activeProfile?.type === 'COMPANY') {
      const companyId = searchParams.get('companyId');

      if (userId && companyId === activeProfile.id) {
        // Company wants to message a user — find existing or create draft
        if (userId === processedUserIdRef.current) return;

        const existingChat = chats.find(c => c.otherUserId === userId);
        if (existingChat) {
          setSelectedChat(existingChat);
          processedUserIdRef.current = userId;
        } else {
          if (processedUserIdRef.current === userId) return;
          const fetchAndCreateDraft = async () => {
            if (!userId || userId === 'null' || userId === 'undefined') return;
            try {
              const response = await getUserById(userId);
              const targetUser = response.user;
              const newChat: ChatThread = {
                id: 'new',
                otherUserId: targetUser.id,
                name: targetUser.name,
                role: targetUser.headline || "",
                avatar: targetUser.avatar || "gradient-1",
                lastMessage: "",
                time: new Date().toISOString(),
                lastMessageAt: new Date().toISOString(),
                unread: 0,
                online: false
              };
              setSelectedChat(newChat);
              processedUserIdRef.current = userId;
            } catch (err) {
              console.error("Failed to fetch user details for company chat draft", err);
            }
          };
          fetchAndCreateDraft();
        }
        return;
      }

      if (groupId) {
        if (groupId === processedUserIdRef.current) return;
        const groupChat = chats.find(c => c.id === groupId);
        if (groupChat) {
          setSelectedChat(groupChat);
          processedUserIdRef.current = groupId;
        }
      }
      // Do NOT auto-select first chat or handle plain userId for company
      return;
    }

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
  }, [searchParams, chats, isMobile, isLoading, activeProfile]); // Added activeProfile

  // Listen for new messages to update the conversation list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      // Prevent duplicate socket deliveries (e.g., from reconnections)
      if (message.message_id) {
        if (processedMessagesRef.current.has(message.message_id)) return;
        processedMessagesRef.current.add(message.message_id);
      }

      const queryKey = ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'];
      queryClient.setQueryData(queryKey, (oldData: ChatThread[] | undefined) => {
        if (!oldData) return oldData;
        
        let matchedIndex = -1;

        const updatedList = oldData.map((c, index) => {
          const messageGroupId = (message as any).isGroup ? (message.conversation_id || message.group_id) : undefined;

          let isMatch = false;

          if (messageGroupId) {
            isMatch = c.id === messageGroupId;
          } else {
            // 1:1 message: only match by conversation_id (not by user ID fallback)
            // This prevents cross-profile leakage where the same user has
            // conversations on both personal and company profiles
            if (message.conversation_id && c.id === message.conversation_id) {
              isMatch = true;
            }
          }

            if (isMatch) {
              matchedIndex = index;
              return {
                ...c,
                lastMessage: message.text_content || (message.shared_post ? "Shared a post" : (message.shared_profile_id ? "Shared a profile" : "Attachment")),
                time: formatTimeAgo(message.created_at || new Date().toISOString()),
                lastMessageAt: message.created_at || new Date().toISOString(),
                unread: (c.id === selectedChat?.id || (selectedChat?.isGroup && selectedChat.id === c.id)) ? 0 : (c.unread + 1)
              };
            }
            return c;
          });

          if (matchedIndex !== -1) {
            // O(1) performance optimization: move updated conversation immediately to the top instead of sorting everything
            const match = updatedList.splice(matchedIndex, 1)[0];
            return [match, ...updatedList];
          }

        // Not in current profile's conversation list — don't invalidate.
        // This message likely belongs to a different profile (user vs company).
        return oldData;
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
      const queryKey = ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'];
      queryClient.setQueryData(queryKey, (oldData: ChatThread[] | undefined) => {
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

    const handleMessageDeleted = (payload: { messageId: string, conversationId: string }) => {
      // Edge Case Fix: Only update the sidebar preview if the deleted message is actually the latest message.
      const messagesData = queryClient.getQueryData<any>(['messages', payload.conversationId]);
      let isLastMessage = true;
      if (messagesData && messagesData.pages && messagesData.pages.length > 0) {
        const newestPage = messagesData.pages[0];
        if (newestPage && newestPage.length > 0) {
          const newestMessage = newestPage[newestPage.length - 1];
          if (newestMessage.id !== payload.messageId && String(newestMessage.id) !== String(payload.messageId)) {
            isLastMessage = false;
          }
        }
      }

      if (!isLastMessage) return;

      const queryKey = ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'];
      queryClient.setQueryData(queryKey, (oldData: ChatThread[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(c => {
          if (c.id === payload.conversationId) {
            return {
              ...c,
              lastMessage: "This message was deleted",
            };
          }
          return c;
        });
      });
    };

    const handleMessageEdited = (payload: { messageId: string, conversationId: string, text_content: string }) => {
      // Edge Case Fix: Only update the sidebar preview if the edited message is actually the latest message.
      const messagesData = queryClient.getQueryData<any>(['messages', payload.conversationId]);
      let isLastMessage = true;
      if (messagesData && messagesData.pages && messagesData.pages.length > 0) {
        const newestPage = messagesData.pages[0];
        if (newestPage && newestPage.length > 0) {
          const newestMessage = newestPage[newestPage.length - 1];
          if (newestMessage.id !== payload.messageId && String(newestMessage.id) !== String(payload.messageId)) {
            isLastMessage = false;
          }
        }
      }

      if (!isLastMessage) return;

      const queryKey = ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'];
      queryClient.setQueryData(queryKey, (oldData: ChatThread[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(c => {
          if (c.id === payload.conversationId && payload.text_content) {
            return {
              ...c,
              lastMessage: payload.text_content,
            };
          }
          return c;
        });
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('notification', handleNotification);
    socket.on('group_updated', handleGroupUpdate);
    socket.on('conversation-updated', handleConversationUpdated);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_deleted_for_everyone', handleMessageDeleted);
    socket.on('message_deleted_for_me', handleMessageDeleted);
    socket.on('message_edited', handleMessageEdited);

    // Session events: re-fetch session status for the affected conversation
    const handleSessionEvent = (payload: { conversationId: string }) => {
      if (!isCompanyMode || !companyId) return;
      const qKey = ['conversations', activeProfile?.type ?? 'USER', activeProfile?.id ?? 'me'];

      getActiveSession(payload.conversationId, companyId).then(data => {
        queryClient.setQueryData(qKey, (oldData: ChatThread[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(c => {
            if (c.id === payload.conversationId) {
              if (!data.featureEnabled || !data.session) {
                return { ...c, sessionStatus: data.featureEnabled ? 'unclaimed' as const : undefined, sessionHandlerName: undefined };
              }
              return {
                ...c,
                sessionStatus: data.session.handler_user_id === user?.id ? 'mine' as const : 'other' as const,
                sessionHandlerName: data.session.handler_name_snapshot
              };
            }
            return c;
          });
        });
      }).catch(console.error);
    };

    socket.on('session_claimed', handleSessionEvent);
    socket.on('session_released', handleSessionEvent);
    socket.on('session_takeover_forced', handleSessionEvent);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('notification', handleNotification);
      socket.off('group_updated', handleGroupUpdate);
      socket.off('conversation-updated', handleConversationUpdated);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_deleted_for_everyone', handleMessageDeleted);
      socket.off('message_deleted_for_me', handleMessageDeleted);
      socket.off('message_edited', handleMessageEdited);
      socket.off('session_claimed', handleSessionEvent);
      socket.off('session_released', handleSessionEvent);
      socket.off('session_takeover_forced', handleSessionEvent);
    };
  }, [
    socket, 
    queryClient, 
    selectedChat?.id, 
    activeProfile?.id, 
    activeProfile?.type, 
    isCompanyMode, 
    companyId, 
    user?.id
  ]); // Stabilized dependency list to prevent repeated socket registrations

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
                      setSelectedChat(null);
                      processedUserIdRef.current = null;
                      router.push('/messaging');
                    }}
                  />
                )) : (
                <div className="hidden md:flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                  {activeProfile?.type === 'COMPANY' ? (
                    <>
                      <p className="font-semibold">Company Messaging</p>
                      <p className="text-sm">Select a conversation to start messaging as {activeProfile.name}</p>
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
