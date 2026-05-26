"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Page } from "@/types/common";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatList from "./components/ui/ChatList";
import ChatWindow from "./components/ui/ChatWindow";
import { ChatThread } from "@/types/messaging";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversations, getActiveSession } from "@/services/api/messaging";
import { getUserById } from "@/services/api/user";
import {
  mapBackendChatToChatThread,
  formatTimeAgo,
} from "@/lib/mappers/messaging.mapper";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/hooks/use-auth";
import GroupChat from "./components/group-chat/GroupChat";
import { GroupChatProvider } from "./components/group-chat/groupChat.context";
import CreateGroupModal from "./components/group-chat/CreateGroupModal";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useToast } from "@/hooks/use-toast";

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
  messaging: "/messaging",
};

const UNKNOWN_USER = { id: "unknown" };

export default function MessagingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'requests'>('chat');
  const processedUserIdRef = React.useRef<string | null>(null);
  const processedMessagesRef = React.useRef<Set<string>>(new Set());

  const { activeProfile } = useActiveProfile();

  // Clear selected chat when switching profiles (user <-> company)
  useEffect(() => {
    setSelectedChat(null);
    processedUserIdRef.current = null;
  }, [activeProfile?.id, activeProfile?.type]);

  const rawChatsQuery = useQuery({
    queryKey: [
      "conversations",
      activeProfile?.type ?? "USER",
      activeProfile?.id ?? "me",
    ],
    queryFn: async () => {
      const params =
        activeProfile?.type === "COMPANY"
          ? { companyId: activeProfile.id }
          : {};
      const backendChats = await getConversations(params);
      return backendChats.map(mapBackendChatToChatThread);
    },
    staleTime: Infinity, // Prevent refetch on mounting/updates unless explicit invalidation
    refetchOnWindowFocus: false,
  });

  // Filter out deleted chats and deduplicate by id (conversation_id).
  // The backend LEFT JOIN on cp_other can return multiple rows for the same
  // conversation when participant records are duplicated — deduplicate here
  // to prevent React "duplicate key" errors in the chat list.
  const chats = React.useMemo(() => {
    const all = rawChatsQuery.data || [];
    const seen = new Map<string, (typeof all)[number]>();
    for (const c of all) {
      if (!c.isDeleted && !seen.has(c.id)) {
        seen.set(c.id, c);
      }
    }
    return Array.from(seen.values());
  }, [rawChatsQuery.data]);
  const isLoading = rawChatsQuery.isLoading;
  const error = rawChatsQuery.error;

  const activeChat = React.useMemo(() => {
    if (!selectedChat) return null;
    return chats.find((c) => String(c.id) === String(selectedChat.id)) || selectedChat;
  }, [chats, selectedChat]);

  // Fetch session status for each company conversation and enrich chats
  const isCompanyMode = activeProfile?.type === "COMPANY";
  const companyId = isCompanyMode ? activeProfile.id : undefined;

  const { user } = useAuth();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isCompanyMode || !companyId || !chats.length) return;

    const queryKey = [
      "conversations",
      activeProfile?.type ?? "USER",
      activeProfile?.id ?? "me",
    ];
    let cancelled = false;

    const fetchSessionStatuses = async () => {
      const updates: Record<
        string,
        { status: "mine" | "other" | "unclaimed"; handler?: string }
      > = {};

      // Batch: fetch sessions for non-group conversations
      const nonGroupChats = chats.filter((c) => !c.isGroup);
      await Promise.all(
        nonGroupChats.map(async (c) => {
          try {
            const data = await getActiveSession(c.id, companyId!);
            if (!data.featureEnabled) return;
            if (!data.session) {
              updates[c.id] = { status: "unclaimed" };
            } else if (data.session.handler_user_id === user?.id) {
              updates[c.id] = {
                status: "mine",
                handler: data.session.handler_name_snapshot,
              };
            } else {
              updates[c.id] = {
                status: "other",
                handler: data.session.handler_name_snapshot,
              };
            }
          } catch {
            /* ignore individual failures */
          }
        }),
      );

      if (cancelled) return;

      // Update cache with session statuses
      queryClient.setQueryData(
        queryKey,
        (oldData: ChatThread[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((c) => {
            const update = updates[c.id];
            if (update) {
              return {
                ...c,
                sessionStatus: update.status,
                sessionHandlerName: update.handler,
              };
            }
            return c;
          });
        },
      );
    };

    fetchSessionStatuses();

    return () => {
      cancelled = true;
    };
  }, [isCompanyMode, companyId, chats.length, user?.id]); // Only re-run when company mode changes or chat count changes

    // Handle userId param to start a new chat or select existing
    useEffect(() => {
      const userId = searchParams.get("userId");
      const groupId = searchParams.get("groupId");
      const conversationId = searchParams.get("conversationId");


    // Handle conversationId param (from notification click) — works for all chat types
    if (conversationId) {
      const targetChat = chats.find((c) => String(c.id) === String(conversationId));
      if (targetChat) {
        setSelectedChat(targetChat);
        processedUserIdRef.current = conversationId;
      }
      return;
    }

    // Company profile: handle userId only when companyId is also present (initiated from user profile "Message" button)
    if (activeProfile?.type === "COMPANY") {
      const companyId = searchParams.get("companyId");

      if (userId && companyId === activeProfile.id) {
        // Company wants to message a user — find existing or create draft
        if (userId === processedUserIdRef.current) return;

        const existingChat = chats.find((c) => c.otherUserId === userId);
        if (existingChat) {
          setSelectedChat(existingChat);
          processedUserIdRef.current = userId;
        } else {
          if (processedUserIdRef.current === userId) return;
          const fetchAndCreateDraft = async () => {
            if (!userId || userId === "null" || userId === "undefined") return;
            try {
              const response = await getUserById(userId);
              const targetUser = response.user;
              const newChat: ChatThread = {
                id: "new",
                otherUserId: targetUser.id,
                name: targetUser.name,
                role: targetUser.headline || "",
                avatar: targetUser.avatar || "gradient-1",
                lastMessage: "",
                time: new Date().toISOString(),
                lastMessageAt: new Date().toISOString(),
                unread: 0,
                online: false,
              };
              setSelectedChat(newChat);
              processedUserIdRef.current = userId;
            } catch (err) {
              console.error(
                "Failed to fetch user details for company chat draft",
                err,
              );
            }
          };
          fetchAndCreateDraft();
        }
        return;
      }

      if (groupId) {
        if (groupId === processedUserIdRef.current) return;
        const groupChat = chats.find((c) => String(c.id) === String(groupId));
        if (groupChat) {
          setSelectedChat(groupChat);
          processedUserIdRef.current = groupId;
        }
        return;
      }
      
      // If we have a userId but no companyId match, don't return early.
      // Let the regular userId logic below handle it.
      if (!userId) return;
    }

    // Helper to safely set selected chat if different
    const safelySetSelectedChat = (chat: ChatThread | null) => {
      setSelectedChat((prev) => {
        if (prev?.id === chat?.id) {
          // For draft chats, we also need to check otherUserId
          if (chat?.id === "new" && prev?.otherUserId !== chat?.otherUserId) {
            return chat;
          }
          return prev;
        }
        return chat;
      });
    };

    if (userId) {
      const existingChat = chats.find(
        (c) => 
          String(c.otherUserId) === String(userId) || 
          String(c.otherUserSlug) === String(userId),
      );

      if (existingChat) {
        safelySetSelectedChat(existingChat);
      } else {
        // No existing chat, fetch user details to create a draft
        const fetchUserAndCreateDraft = async () => {
          if (!userId || userId === "null" || userId === "undefined") return;
          try {
            const response = await getUserById(userId);
            const user = response.user;
            const newChat: ChatThread = {
              id: "new",
              otherUserId: user.id,
              name: user.name,
              role: user.headline || "",
              avatar: user.avatar || "gradient-1",
              lastMessage: "",
              time: new Date().toISOString(),
              lastMessageAt: new Date().toISOString(),
              unread: 0,
              online: false,
            };
            safelySetSelectedChat(newChat);
          } catch (err) {
            console.error("Failed to fetch user details for new chat", err);
          }
        };
        fetchUserAndCreateDraft();
      }
    } else if (groupId) {
      const groupChat = chats.find((c) => String(c.id) === String(groupId));
      if (groupChat) {
        safelySetSelectedChat(groupChat);
        processedUserIdRef.current = groupId;
      }
    } else if (!userId && !groupId && !conversationId) {
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

      const queryKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];
      queryClient.setQueryData(
        queryKey,
        (oldData: ChatThread[] | undefined) => {
          if (!oldData) return oldData;

          let matchedIndex = -1;

          const updatedList = oldData.map((c, index) => {
            const messageGroupId = (message as any).isGroup
              ? message.conversation_id || message.group_id
              : undefined;

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
                lastMessage:
                  message.text_content ||
                  (message.shared_post
                    ? "Shared a post"
                    : message.shared_profile_id
                      ? "Shared a profile"
                      : "Attachment"),
                time: formatTimeAgo(
                  message.created_at || new Date().toISOString(),
                ),
                lastMessageAt: message.created_at || new Date().toISOString(),
                unread:
                  c.id === selectedChat?.id ||
                  (selectedChat?.isGroup && selectedChat.id === c.id)
                    ? 0
                    : c.unread + 1,
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
        },
      );
    };

    const handleNotification = (payload: any) => {
      // Only invalidate if absolutely necessary.
      // For messages, we handle via 'new_message' manually.
      // For other types, maybe we don't need to invalidate conversations?
      // If it's a new conversation start, 'new_message' should handle it (by checking existence).
      if (payload.type === "message") {
        // Do nothing, handled by new_message
      }
    };

    const handleGroupUpdate = (updatedGroup: any) => {
      const queryKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];
      queryClient.setQueryData(
        queryKey,
        (oldData: ChatThread[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((c) => {
            if (c.id === updatedGroup.conversation_id) {
              return {
                ...c,
                name: updatedGroup.conversation_name || c.name,
                avatar:
                  "group_avatar" in updatedGroup
                    ? updatedGroup.group_avatar || ""
                    : c.avatar,
              };
            }
            return c;
          });
        },
      );
    };

    const handleConversationUpdated = (payload: any) => {
      if (!payload) return;

      const conversationId = payload.conversation_id || payload.conversationId;
      if (!conversationId) return;

      const queryKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];

      queryClient.setQueryData(
        queryKey,
        (oldData: ChatThread[] | undefined) => {
          if (!oldData) return oldData;

          // Find if the conversation already exists
          const matchedIndex = oldData.findIndex(
            (c) => String(c.id) === String(conversationId)
          );

          // Get or construct ChatThread details
          let targetThread: ChatThread;

          if (matchedIndex !== -1) {
            // Update existing thread properties
            const existing = oldData[matchedIndex];
            const lastMsgText = payload.last_message_text || payload.lastMessage || payload.last_message;
            const lastMsgAt = payload.last_message_at || payload.updatedAt || payload.updated_at || existing.lastMessageAt;
            const unreadCount = typeof payload.unread_count === 'number'
              ? payload.unread_count
              : (typeof payload.unread === 'number'
                ? payload.unread
                : existing.unread);

            targetThread = {
              ...existing,
              lastMessage: lastMsgText !== undefined ? lastMsgText : existing.lastMessage,
              time: lastMsgAt ? formatTimeAgo(lastMsgAt) : existing.time,
              lastMessageAt: lastMsgAt || existing.lastMessageAt,
              unread: String(conversationId) === String(selectedChat?.id) ? 0 : unreadCount,
            };
            
            // Also update details if full other_user_name etc are provided
            if (payload.other_user_name || payload.otherUserName) {
              targetThread.name = payload.other_user_name || payload.otherUserName;
              targetThread.avatar = payload.other_user_avatar || payload.otherUserAvatar || targetThread.avatar;
              targetThread.role = payload.other_user_headline || payload.otherUserHeadline || targetThread.role;
            }
          } else {
            // Build brand new thread using mapBackendChatToChatThread mapper
            // Prepare normalized snake_case object for mapper if camelCase is received
            const normalizedPayload = {
              conversation_id: conversationId,
              other_user_id: payload.other_user_id || payload.otherUserId,
              other_user_name: payload.other_user_name || payload.otherUserName || "New Contact",
              other_user_avatar: payload.other_user_avatar || payload.otherUserAvatar || "gradient-1",
              other_user_headline: payload.other_user_headline || payload.otherUserHeadline || "",
              other_user_slug: payload.other_user_slug || payload.otherUserSlug || "",
              other_user_type: payload.other_user_type || payload.otherUserType || "USER",
              last_message_text: payload.last_message_text || payload.lastMessage || "",
              last_message_at: payload.last_message_at || payload.updatedAt || payload.updated_at || new Date().toISOString(),
              unread_count: typeof payload.unread_count === 'number' ? payload.unread_count : (typeof payload.unread === 'number' ? payload.unread : 1),
              is_group: payload.is_group || payload.isGroup || false,
              is_blocked_by_me: payload.is_blocked_by_me || false,
              is_blocked_by_other: payload.is_blocked_by_other || false,
              is_deleted_user: payload.is_deleted_user || false,
              is_requesting: payload.is_requesting || false,
              updated_at: payload.updated_at || payload.updatedAt || new Date().toISOString(),
            };
            targetThread = mapBackendChatToChatThread(normalizedPayload);
          }

          // Generate the new list
          const remainingList = oldData.filter((_, idx) => idx !== matchedIndex);
          const updatedList = [targetThread, ...remainingList];

          // Sort by lastMessageAt descending
          return updatedList.sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
        }
      );
    };

    const handleMessageDeleted = (payload: {
      messageId: string;
      conversationId: string;
    }) => {
      // Edge Case Fix: Only update the sidebar preview if the deleted message is actually the latest message.
      const messagesData = queryClient.getQueryData<any>([
        "messages",
        payload.conversationId,
      ]);
      let isLastMessage = true;
      if (messagesData && messagesData.pages && messagesData.pages.length > 0) {
        const newestPage = messagesData.pages[0];
        if (newestPage && newestPage.length > 0) {
          const newestMessage = newestPage[newestPage.length - 1];
          if (
            newestMessage.id !== payload.messageId &&
            String(newestMessage.id) !== String(payload.messageId)
          ) {
            isLastMessage = false;
          }
        }
      }

      if (!isLastMessage) return;

      const queryKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];
      queryClient.setQueryData(
        queryKey,
        (oldData: ChatThread[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((c) => {
            if (c.id === payload.conversationId) {
              return {
                ...c,
                lastMessage: "This message was deleted",
              };
            }
            return c;
          });
        },
      );
    };

    const handleMessageEdited = (payload: {
      messageId: string;
      conversationId: string;
      text_content: string;
    }) => {
      // Edge Case Fix: Only update the sidebar preview if the edited message is actually the latest message.
      const messagesData = queryClient.getQueryData<any>([
        "messages",
        payload.conversationId,
      ]);
      let isLastMessage = true;
      if (messagesData && messagesData.pages && messagesData.pages.length > 0) {
        const newestPage = messagesData.pages[0];
        if (newestPage && newestPage.length > 0) {
          const newestMessage = newestPage[newestPage.length - 1];
          if (
            newestMessage.id !== payload.messageId &&
            String(newestMessage.id) !== String(payload.messageId)
          ) {
            isLastMessage = false;
          }
        }
      }

      if (!isLastMessage) return;

      const queryKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];
      queryClient.setQueryData(
        queryKey,
        (oldData: ChatThread[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((c) => {
            if (c.id === payload.conversationId && payload.text_content) {
              return {
                ...c,
                lastMessage: payload.text_content,
              };
            }
            return c;
          });
        },
      );
    };

    const handleBlock = (payload: any) => {
      if (!payload) return;
      const conversationId = payload.conversation_id;
      if (!conversationId) return;

      const isMeBlocker = payload.blocked_by_user_id === user?.id;

      const queryKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];
      queryClient.setQueryData(
        queryKey,
        (oldData: ChatThread[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((c) => {
            if (String(c.id) === String(conversationId)) {
              return {
                ...c,
                isBlockedByMe: isMeBlocker ? true : c.isBlockedByMe,
                isBlockedByOther: !isMeBlocker ? true : c.isBlockedByOther,
              };
            }
            return c;
          });
        }
      );

      if (selectedChat?.id && String(selectedChat.id) === String(conversationId)) {
        setSelectedChat((prev) =>
          prev
            ? {
                ...prev,
                isBlockedByMe: isMeBlocker ? true : prev.isBlockedByMe,
                isBlockedByOther: !isMeBlocker ? true : prev.isBlockedByOther,
              }
            : null
        );
      }

      if (!isMeBlocker) {
        toast({
          description: `${payload.blocked_by_name || "Someone"} has blocked you`,
        });
      }
    };

    const handleUnblock = (payload: any) => {
      if (!payload) return;
      const conversationId = payload.conversation_id;
      if (!conversationId) return;

      const isMeUnblocker = payload.unblocked_by_user_id === user?.id;

      const queryKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];
      queryClient.setQueryData(
        queryKey,
        (oldData: ChatThread[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((c) => {
            if (String(c.id) === String(conversationId)) {
              return {
                ...c,
                isBlockedByMe: isMeUnblocker ? false : c.isBlockedByMe,
                isBlockedByOther: !isMeUnblocker ? false : c.isBlockedByOther,
              };
            }
            return c;
          });
        }
      );

      if (selectedChat?.id && String(selectedChat.id) === String(conversationId)) {
        setSelectedChat((prev) =>
          prev
            ? {
                ...prev,
                isBlockedByMe: isMeUnblocker ? false : prev.isBlockedByMe,
                isBlockedByOther: !isMeUnblocker ? false : prev.isBlockedByOther,
              }
            : null
        );
      }

      if (!isMeUnblocker) {
        toast({
          description: `${payload.unblocked_by_name || "Someone"} has unblocked you`,
        });
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("notification", handleNotification);
    socket.on("group_updated", handleGroupUpdate);
    socket.on("conversation-updated", handleConversationUpdated);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_deleted_for_everyone", handleMessageDeleted);
    socket.on("message_deleted_for_me", handleMessageDeleted);
    socket.on("message_edited", handleMessageEdited);
    socket.on("user_blocked", handleBlock);
    socket.on("block_confirmed", handleBlock);
    socket.on("user_unblocked", handleUnblock);
    socket.on("unblock_confirmed", handleUnblock);

    // Session events: re-fetch session status for the affected conversation
    const handleSessionEvent = (payload: { conversationId: string }) => {
      if (!isCompanyMode || !companyId) return;
      const qKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];

      getActiveSession(payload.conversationId, companyId)
        .then((data) => {
          queryClient.setQueryData(
            qKey,
            (oldData: ChatThread[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map((c) => {
                if (c.id === payload.conversationId) {
                  if (!data.featureEnabled || !data.session) {
                    return {
                      ...c,
                      sessionStatus: data.featureEnabled
                        ? ("unclaimed" as const)
                        : undefined,
                      sessionHandlerName: undefined,
                    };
                  }
                  return {
                    ...c,
                    sessionStatus:
                      data.session.handler_user_id === user?.id
                        ? ("mine" as const)
                        : ("other" as const),
                    sessionHandlerName: data.session.handler_name_snapshot,
                  };
                }
                return c;
              });
            },
          );
        })
        .catch(console.error);
    };

    socket.on("session_claimed", handleSessionEvent);
    socket.on("session_released", handleSessionEvent);
    socket.on("session_takeover_forced", handleSessionEvent);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("notification", handleNotification);
      socket.off("group_updated", handleGroupUpdate);
      socket.off("conversation-updated", handleConversationUpdated);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_deleted_for_everyone", handleMessageDeleted);
      socket.off("message_deleted_for_me", handleMessageDeleted);
      socket.off("message_edited", handleMessageEdited);
      socket.off("session_claimed", handleSessionEvent);
      socket.off("session_released", handleSessionEvent);
      socket.off("session_takeover_forced", handleSessionEvent);
      socket.off("user_blocked", handleBlock);
      socket.off("block_confirmed", handleBlock);
      socket.off("user_unblocked", handleUnblock);
      socket.off("unblock_confirmed", handleUnblock);
    };
  }, [
    socket,
    queryClient,
    selectedChat?.id,
    activeProfile?.id,
    activeProfile?.type,
    isCompanyMode,
    companyId,
    user?.id,
  ]); // Stabilized dependency list to prevent repeated socket registrations

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed");
  };

  return (
    <div
      className="h-full w-full bg-background flex flex-col"
      style={{ height: isMobile ? "100dvh" : "calc(100vh - 64px)" }}
    >
      <div className="flex-1 w-full h-full bg-[#FAFAFA] dark:bg-background overflow-hidden p-4">
        <div className="flex w-full h-full gap-4">
          {/* Chat List - on mobile, hidden if we have a selected chat */}
          <div
            className={`${
              isMobile && selectedChat ? "hidden" : "flex flex-col"
            } h-full overflow-hidden w-full md:w-[380px] shrink-0`}
          >
            <ChatList
              selectedChatId={selectedChat?.id}
              onSelectChat={React.useCallback(
                (chat: ChatThread) => {
                  if (isMobile) {
                    router.push(`/messaging?groupId=${chat.id}`);
                  } else {
                    setSelectedChat(chat);
                  }
                },
                [isMobile, router],
              )}
              isMobile={!!isMobile}
              chats={chats}
              isLoading={isLoading}
              error={error}
              onCreateGroup={() => setIsCreateGroupOpen(true)}
              isCompany={activeProfile?.type === "COMPANY"}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* Chat Window - on mobile, only shown if selectedChat */}
          <div
            className={`${
              isMobile && selectedChat
                ? "fixed inset-0 z-50 bg-[#FFFFFF] w-full h-[100dvh] flex flex-col"
                : "hidden md:flex flex-col flex-1 h-full overflow-hidden bg-[#FFFFFF] rounded-[24px]"
            }`}
          >
            {activeChat ? (
              (activeChat.isGroup && !activeChat.is_requesting) ? (
                <GroupChatProvider groupId={activeChat.id}>
                  <GroupChat
                    groupId={activeChat.id}
                    currentUser={user || UNKNOWN_USER}
                    unreadCount={activeChat.unread}
                    onBack={() => {
                      setSelectedChat(null);
                      processedUserIdRef.current = null;
                      router.push("/messaging");
                    }}
                  />
                </GroupChatProvider>
              ) : (
                <ChatWindow
                  chat={activeChat}
                  isMobile={!!isMobile}
                  onBack={() => {
                    setSelectedChat(null);
                    processedUserIdRef.current = null;
                    router.push("/messaging");
                  }}
                  onAcceptSuccess={() => {
                    setActiveTab('chat');
                  }}
                />
              )
            ) : (
              <div className="hidden md:flex items-center justify-center h-full flex-col text-center px-8 bg-background">
                <div className="w-20 h-20 mb-4 flex items-center justify-center bg-transparent">
                  <svg
                    width="72"
                    height="72"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-foreground"
                  >
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    <path d="M8 12h8" />
                    <path d="M8 8h5" />
                  </svg>
                </div>
                {isLoading || searchParams.get("userId") || searchParams.get("groupId") || searchParams.get("conversationId") ? (
                  <>
                    <p className="font-semibold text-foreground text-[17px] tracking-tight mb-2">
                      Opening your chat...
                    </p>
                    <p className="text-[13px] text-muted-foreground/80 max-w-[260px] leading-relaxed">
                      Please wait while we prepare your conversation
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground text-[17px] tracking-tight mb-2">
                      Select a conversation to start messaging
                    </p>
                    <p className="text-[13px] text-muted-foreground/80 max-w-[260px] leading-relaxed">
                      Chats from your network and requests will appear here
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <GroupChatProvider>
        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
        />
      </GroupChatProvider>
    </div>
  );
}
