"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Page } from "@/types/common";
import { useIsMobile } from "@/hooks/use-mobile";
import ChatList from "./components/ui/ChatList";
import ChatWindow from "./components/ui/ChatWindow";
import { ChatThread, Message } from "@/types/messaging";
import { InfiniteData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversations } from "@/services/api/messaging";
import { getUserById } from "@/services/api/user";
import { sendOfferChatContext } from "@/services/api/offers";
import {
  mapBackendChatToChatThread,
  formatTimeAgo,
  mapBackendMessageToMessage,
  isPostUrl,
  isJobUrl,
} from "@/lib/mappers/messaging.mapper";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/hooks/use-auth";
import GroupChat from "./components/group-chat/GroupChat";
import { GroupChatProvider } from "./components/group-chat/groupChat.context";
import CreateGroupModal from "./components/group-chat/CreateGroupModal";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useCompanyPermissions } from "@/features/companyprofile/hooks/useCompanyPermissions";
import { useToast } from "@/hooks/use-toast";
import { DUMMY_JOB_CHATS } from "@/features/messaging/data/companyMessagingMockData";
import { companyService } from "@/services/organization.service";
import ChatWindowSkeleton from "./components/skeletons/ChatWindowSkeleton";

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
  const [activeTab, setActiveTab] = useState<'chat' | 'jobs' | 'requests'>('chat');
  const processedUserIdRef = React.useRef<string | null>(null);
  const processedMessagesRef = React.useRef<Set<string>>(new Set());
  const prevConversationIdRef = React.useRef<string | null>(null);
  const hasForcedJobTabRef = React.useRef<boolean>(false);
  const [initialEntityContext, setInitialEntityContext] = useState<{ type: 'job' | 'offer' | 'event', id: string; targetId: string } | null>(null);

  // Detect URL search params for job/offer context immediately on mount/param change
  useEffect(() => {
    if (!searchParams) return;
    const hasJobContext =
      searchParams.get('jobId') ||
      searchParams.get('jobContext') ||
      searchParams.get('offerContext');

    if (hasJobContext) {
      setActiveTab('jobs');
      hasForcedJobTabRef.current = true;
    }
  }, [searchParams]);

  // Controlled Auto-Switch when switching conversations
  useEffect(() => {
    if (!selectedChat?.id) return;

    const isNewConversation = prevConversationIdRef.current !== selectedChat.id;

    if (isNewConversation) {
      const isJob = Boolean(
        selectedChat.isJobChat ||
        (selectedChat.jobIds && selectedChat.jobIds.length > 0)
      );

      if (!hasForcedJobTabRef.current) {
        setActiveTab(isJob ? 'jobs' : 'chat');
      }

      prevConversationIdRef.current = selectedChat.id;
    }
  }, [selectedChat?.id, selectedChat?.isJobChat]);

  // Capture context from search parameters as soon as they are available, and preserve it
  useEffect(() => {
    if (!searchParams) return;
    const jobContext = searchParams.get("jobContext");
    const offerContext = searchParams.get("offerContext");
    const eventContext = searchParams.get("eventContext");
    const userId = searchParams.get("userId");
    const companyId = searchParams.get("companyId");
    const targetId = userId || companyId || "";

    if (jobContext) {
      setInitialEntityContext({ type: 'job', id: jobContext, targetId });
    } else if (offerContext) {
      setInitialEntityContext({ type: 'offer', id: offerContext, targetId });
    } else if (eventContext) {
      setInitialEntityContext({ type: 'event', id: eventContext, targetId });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!selectedChat || !initialEntityContext) return;
    const chatOtherId = selectedChat.otherUserId || "";
    if (chatOtherId !== initialEntityContext.targetId) {
      setInitialEntityContext(null);
    }
  }, [selectedChat?.id, selectedChat?.otherUserId, initialEntityContext?.targetId]);

  const { activeProfile } = useActiveProfile();
  const companyPermissions = useCompanyPermissions({ viewer_role_data: activeProfile?.viewer_role_data });

  // Default activeTab to 'jobs' if company profile has JOBS_CHAT permission but NO general CHAT permission
  useEffect(() => {
    if (activeProfile?.type === 'COMPANY' && !companyPermissions.canChat && companyPermissions.canJobsChat) {
      setActiveTab('jobs');
    }
  }, [activeProfile?.id, activeProfile?.type, companyPermissions.canChat, companyPermissions.canJobsChat]);

  // Clear selected chat when switching profiles (user <-> company)
  useEffect(() => {
    setSelectedChat(null);
    processedUserIdRef.current = null;
  }, [activeProfile?.id, activeProfile?.type]);

  // Clear selected chat if selectedChat is a job chat but company profile lacks JOBS_CHAT permission
  useEffect(() => {
    if (selectedChat && activeProfile?.type === 'COMPANY') {
      const isJob = Boolean(
        selectedChat.isJobChat ||
        (selectedChat.jobIds && selectedChat.jobIds.length > 0)
      );
      if (isJob && !companyPermissions.canJobsChat) {
        setSelectedChat(null);
      }
    }
  }, [selectedChat, activeProfile?.type, companyPermissions.canJobsChat]);

  const rawChatsQuery = useQuery({
    queryKey: [
      "conversations",
      activeProfile?.type ?? "USER",
      activeProfile?.id ?? "me",
      activeProfile?.type === "COMPANY" ? activeTab : "all",
    ],
    queryFn: async () => {
      const params =
        activeProfile?.type === "COMPANY"
          ? {
              companyId: activeProfile.id,
              tab: (activeTab === "jobs" ? "JOBS" : "GENERAL") as "JOBS" | "GENERAL",
            }
          : {};
      const backendChats = await getConversations(params);
      return backendChats.map(mapBackendChatToChatThread);
    },
    staleTime: 0,
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

  const { user } = useAuth();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handle userId param to start a new chat or select existing
  useEffect(() => {
    if (isLoading) return;

    const userId = searchParams.get("userId");
    const groupId = searchParams.get("groupId");
    const conversationId = searchParams.get("conversationId");
    const companyId = searchParams.get("companyId");

    // Don't re-run if no relevant URL params are present
    if (!userId && !groupId && !conversationId && !companyId) {
      processedUserIdRef.current = null;
      return;
    }

    const currentKey = conversationId || groupId || userId || companyId;
    if (processedUserIdRef.current === currentKey && selectedChat) {
      return;
    }

    // Check for existing conversation across both GENERAL and JOBS tabs when searching by userId/conversationId
    const findExistingChatAcrossAllTabs = async (targetUserId?: string | null, targetConvId?: string | null) => {
      if (!targetUserId && !targetConvId) return null;
      // First check local `chats` list
      let localMatch = chats.find(c =>
        (targetConvId && String(c.id) === String(targetConvId)) ||
        (targetUserId && (String(c.otherUserId) === String(targetUserId) || String(c.otherUserSlug) === String(targetUserId)))
      );
      if (localMatch) return localMatch;

      // If in Company mode and not found in current activeTab list, check the other tab backend list
      if (activeProfile?.type === 'COMPANY') {
        const otherTab = activeTab === 'jobs' ? 'GENERAL' : 'JOBS';
        try {
          const otherTabBackendChats = await getConversations({ companyId: activeProfile.id, tab: otherTab });
          const otherTabChats = otherTabBackendChats.map(mapBackendChatToChatThread);
          const otherTabMatch = otherTabChats.find(c =>
            (targetConvId && String(c.id) === String(targetConvId)) ||
            (targetUserId && (String(c.otherUserId) === String(targetUserId) || String(c.otherUserSlug) === String(targetUserId)))
          );
          if (otherTabMatch) return otherTabMatch;
        } catch (e) {
          console.error("Error fetching other tab conversations", e);
        }
      }
      return null;
    };

    // Handle conversationId param (from notification click) — works for all chat types
    if (conversationId) {
      const processConvId = async () => {
        const targetChat = await findExistingChatAcrossAllTabs(null, conversationId);
        if (targetChat) {
          setSelectedChat(targetChat);
          processedUserIdRef.current = conversationId;
          if (!isMobile && typeof window !== 'undefined') {
            window.history.replaceState(null, "", `/messaging?conversationId=${conversationId}`);
          }
        }
      };
      processConvId();
      return;
    }

    // Handle groupId param — works for all chat types and profile types
    if (groupId) {
      if (groupId === processedUserIdRef.current) return;
      const groupChat = chats.find((c) => String(c.id) === String(groupId));
      if (groupChat) {
        setSelectedChat(groupChat);
        processedUserIdRef.current = groupId;
        if (!isMobile && typeof window !== 'undefined') {
          window.history.replaceState(null, "", `/messaging?groupId=${groupId}`);
        }
      }
      return;
    }

    // Company profile: handle userId only when companyId is also present (initiated from user profile "Message" button)
    if (activeProfile?.type === "COMPANY") {
      if (userId && companyId === activeProfile.id) {
        const processCompanyUserId = async () => {
          const existingChat = await findExistingChatAcrossAllTabs(userId, null);
          if (existingChat) {
            setSelectedChat(existingChat);
            processedUserIdRef.current = userId;
            if (!isMobile && typeof window !== 'undefined') {
              window.history.replaceState(null, "", "/messaging");
            }
          } else {
            if (processedUserIdRef.current === userId) return;
            processedUserIdRef.current = userId;
            if (!userId || userId === "null" || userId === "undefined") return;
            try {
              const response = await getUserById(userId);
              const targetUser = response.user;
              const hasJobContextParam = Boolean(
                searchParams.get("jobContext") ||
                searchParams.get("offerContext") ||
                searchParams.get("jobId")
              );
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
                isJobChat: hasJobContextParam,
              };
              setSelectedChat(newChat);
              if (hasJobContextParam) {
                setActiveTab('jobs');
              }
            } catch (err) {
              console.error(
                "Failed to fetch user details for company chat draft",
                err,
              );
            }
          }
        };
        processCompanyUserId();
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
      const processUserId = async () => {
        const existingChat = await findExistingChatAcrossAllTabs(userId, null);

        if (existingChat) {
          safelySetSelectedChat(existingChat);
          processedUserIdRef.current = userId;
          if (!isMobile && typeof window !== 'undefined') {
            window.history.replaceState(null, "", `/messaging?conversationId=${existingChat.id}`);
          }
        } else {
          if (userId === processedUserIdRef.current) return;
          processedUserIdRef.current = userId;
          // No existing chat, fetch user details to create a draft
          if (!userId || userId === "null" || userId === "undefined") return;
          try {
            const response = await getUserById(userId);
            const user = response.user;
            const hasJobContextParam = Boolean(
              searchParams.get("jobContext") ||
              searchParams.get("offerContext") ||
              searchParams.get("jobId")
            );
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
              isJobChat: hasJobContextParam,
            };
            safelySetSelectedChat(newChat);
            if (activeProfile?.type === 'COMPANY' && hasJobContextParam) {
              setActiveTab('jobs');
            }
          } catch (err) {
            console.error("Failed to fetch user details for new chat", err);
          }
        }
      };
      processUserId();
    } else if (groupId) {
      const groupChat = chats.find((c) => String(c.id) === String(groupId));
      if (groupChat) {
        safelySetSelectedChat(groupChat);
        processedUserIdRef.current = groupId;
        if (!isMobile && typeof window !== 'undefined') {
          window.history.replaceState(null, "", "/messaging");
        }
      }
    } else if (companyId && activeProfile?.type !== "COMPANY") {
      const existingChat = chats.find(
        (c) => String(c.otherUserId) === String(companyId)
      );

      if (existingChat) {
        safelySetSelectedChat(existingChat);
        processedUserIdRef.current = companyId;
        if (!isMobile && typeof window !== 'undefined') {
          window.history.replaceState(null, "", "/messaging");
        }
      } else {
        if (companyId === processedUserIdRef.current) return;
        processedUserIdRef.current = companyId;
        const fetchCompanyAndCreateDraft = async () => {
          if (!companyId || companyId === "null" || companyId === "undefined") return;
          try {
            const response = await companyService.getCompany(companyId);
            const newChat: ChatThread = {
              id: "new",
              otherUserId: response.org_id || response.company_id || companyId,
              name: response.name,
              role: response.industry || "Company",
              avatar: response.logo_url || "gradient-1",
              lastMessage: "",
              time: new Date().toISOString(),
              lastMessageAt: new Date().toISOString(),
              unread: 0,
              online: false,
              otherUserType: "COMPANY",
            };
            safelySetSelectedChat(newChat);
          } catch (err) {
            console.error("Failed to fetch company details for new chat", err);
          }
        };
        fetchCompanyAndCreateDraft();
      }
    } else if (!userId && !groupId && !conversationId && !companyId) {
      processedUserIdRef.current = null;
    }
  }, [searchParams, chats, isMobile, isLoading, activeProfile]); // Added activeProfile

  // (Offer Chat Context auto-send logic has been removed. Context is now passed to UnifiedMessageInput directly.)

  // Listen for new messages to update the conversation list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      // Prevent duplicate socket deliveries (e.g., from reconnections)
      if (message.message_id) {
        if (processedMessagesRef.current.has(message.message_id)) return;
        processedMessagesRef.current.add(message.message_id);
      }

      const conversationId = message.conversation_id || message.conversationId;
      if (conversationId) {
        const messagesQueryKey = ["messages", conversationId];
        const uiMessage = mapBackendMessageToMessage(
          message,
          user?.id,
          activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
        );

        queryClient.setQueryData(
          messagesQueryKey,
          (oldData: InfiniteData<Message[]> | undefined) => {
            if (!oldData) return oldData;

            const existingPageIndex = oldData.pages.findIndex((page) =>
              page.some((existingMessage) => existingMessage.id === uiMessage.id),
            );

            if (existingPageIndex !== -1) {
              const pages = [...oldData.pages];
              pages[existingPageIndex] = pages[existingPageIndex].map((existingMessage) => {
                if (existingMessage.id === uiMessage.id) {
                  return {
                    ...existingMessage,
                    ...uiMessage,
                    media: uiMessage.media && uiMessage.media.length > 0 ? uiMessage.media : existingMessage.media,
                    sharedPost: uiMessage.sharedPost || existingMessage.sharedPost,
                    sharedProfile: uiMessage.sharedProfile || existingMessage.sharedProfile,
                    sharedProfileId: uiMessage.sharedProfileId || existingMessage.sharedProfileId,
                    sharedProfileType: uiMessage.sharedProfileType || existingMessage.sharedProfileType,
                    entityType: uiMessage.entityType || existingMessage.entityType,
                    entityId: uiMessage.entityId || existingMessage.entityId,
                    replied_msg_id: uiMessage.replied_msg_id || existingMessage.replied_msg_id,
                    repliedMessage: uiMessage.repliedMessage || existingMessage.repliedMessage,
                  };
                }
                return existingMessage;
              });
              return { ...oldData, pages };
            }

            const pages = [...oldData.pages];
            pages[0] = [...(pages[0] || []), uiMessage];
            return { ...oldData, pages };
          },
        );

        queryClient.invalidateQueries({
          queryKey: messagesQueryKey,
          refetchType: "none",
        });
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
                  isPostUrl(message.text_content)
                    ? "Shared a post"
                    : isJobUrl(message.text_content)
                      ? "Shared a job"
                      : (message.text_content ||
                        (message.shared_post
                          ? "Shared a post"
                          : message.shared_profile_id
                            ? "Shared a profile"
                            : "Attachment")),
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
              lastMessage: lastMsgText !== undefined ? (isPostUrl(lastMsgText) ? "Shared a post" : (isJobUrl(lastMsgText) ? "Shared a job" : lastMsgText)) : existing.lastMessage,
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
                lastMessage: payload.text_content ? (isPostUrl(payload.text_content) ? "Shared a post" : (isJobUrl(payload.text_content) ? "Shared a job" : payload.text_content)) : c.lastMessage,
              };
            }
            return c;
          });
        },
      );
    };

    const handleBlock = (payload: any) => {
      if (!payload) return;
      const conversationId = payload.conversation_id || payload.conversationId;
      if (!conversationId) return;

      const isMeBlocker =
        String(payload.blocked_by_user_id) === String(user?.id) ||
        String(payload.blocked_by_user_id) === String(activeProfile?.id) ||
        String(payload.blocker_id) === String(user?.id) ||
        String(payload.blocker_id) === String(activeProfile?.id);

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
    };

    const handleUnblock = (payload: any) => {
      if (!payload) return;
      const conversationId = payload.conversation_id || payload.conversationId;
      if (!conversationId) return;

      const isMeUnblocker =
        String(payload.unblocked_by_user_id) === String(user?.id) ||
        String(payload.unblocked_by_user_id) === String(activeProfile?.id) ||
        String(payload.blocker_id) === String(user?.id) ||
        String(payload.blocker_id) === String(activeProfile?.id) ||
        payload.is_blocked === false;

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
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const handlePreferenceUpdated = (payload: {
      conversationId: string;
      preference: { is_muted: boolean; muted_until: string | null };
    }) => {
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
            if (String(c.id) === String(payload.conversationId)) {
              return {
                ...c,
                is_muted: payload.preference.is_muted,
                muted_until: payload.preference.muted_until,
              };
            }
            return c;
          });
        }
      );
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
    socket.on("conversation_preference_updated", handlePreferenceUpdated);

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
      socket.off("user_blocked", handleBlock);
      socket.off("block_confirmed", handleBlock);
      socket.off("user_unblocked", handleUnblock);
      socket.off("unblock_confirmed", handleUnblock);
      socket.off("conversation_preference_updated", handlePreferenceUpdated);
    };
  }, [
    socket,
    queryClient,
    selectedChat?.id,
    activeProfile?.id,
    activeProfile?.type,
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
      <div className="flex-1 w-full h-full bg-[var(--background)] dark:bg-background overflow-hidden p-4">
        <div className="flex w-full h-full gap-4">
          {/* Chat List - on mobile, hidden if we have a selected chat */}
          <div
            className={`${isMobile && selectedChat ? "hidden" : "flex flex-col"
              } h-full overflow-hidden w-full md:w-[380px] shrink-0`}
          >
            <ChatList
              selectedChatId={selectedChat?.id}
              onSelectChat={React.useCallback(
                (chat: ChatThread) => {
                  const isGroupChat = !!(chat.isGroup || (chat as any).is_group);
                  if (isMobile) {
                    router.push(isGroupChat ? `/messaging?groupId=${chat.id}` : `/messaging?conversationId=${chat.id}`);
                  } else {
                    setSelectedChat(chat);
                    if (typeof window !== 'undefined') {
                      const queryParam = isGroupChat ? `groupId=${chat.id}` : `conversationId=${chat.id}`;
                      window.history.replaceState(null, "", `/messaging?${queryParam}`);
                    }
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
            className={`${isMobile && selectedChat
              ? "fixed inset-0 z-50 bg-[var(--card)] w-full h-[100dvh] flex flex-col"
              : "hidden md:flex flex-col flex-1 h-full overflow-hidden bg-[var(--card)] rounded-[24px]"
              }`}
          >
            {activeChat ? (
              (activeChat.isGroup && !activeChat.is_requesting) ? (
                <GroupChatProvider groupId={activeChat.id}>
                  <GroupChat
                    groupId={activeChat.id}
                    currentUser={user || UNKNOWN_USER}
                    unreadCount={activeChat.unread}
                    isMuted={activeChat.is_muted}
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
                  activeTab={activeTab}
                  onBack={() => {
                    setSelectedChat(null);
                    processedUserIdRef.current = null;
                    router.push("/messaging");
                  }}
                  onAcceptSuccess={() => {
                    setActiveTab('chat');
                  }}
                  initialEntityContext={initialEntityContext || undefined}
                />
              )
            ) : (
              (isLoading || searchParams.get("userId") || searchParams.get("groupId") || searchParams.get("conversationId")) ? (
                <ChatWindowSkeleton />
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
                  <p className="font-semibold text-foreground text-[17px] tracking-tight mb-2">
                    Select a conversation to start messaging
                  </p>
                  <p className="text-[13px] text-muted-foreground/80 max-w-[260px] leading-relaxed">
                    Chats from your network and requests will appear here
                  </p>
                </div>
              )
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
