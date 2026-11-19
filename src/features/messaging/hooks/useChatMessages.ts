"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  InfiniteData,
  QueryClient,
} from "@tanstack/react-query";
import { ChatThread, Message } from "@/types/messaging";
import { GroupMember } from "@/types/group-chat";
import {
  getMessages,
  sendMessage,
} from "@/services/api/messaging";
import {
  sendMessage as sendGroupMessage,
  getGroupDetails,
} from "@/services/api/group-chat";
import {
  mapBackendMessageToMessage,
  formatTimeAgo,
} from "@/lib/mappers/messaging.mapper";
import { searchUsers, getSuggestedUsers, type UserMention } from "@/services/api/users";
import type { Post } from "@/types/entities";
import { useToast } from "@/hooks/use-toast";

interface SocketLike {
  emit: (event: string, ...args: unknown[]) => void;
}

interface ActiveProfileLike {
  type?: string;
  id?: string;
  name?: string;
}

interface SessionLike {
  user?: {
    id?: string;
    name?: string | null;
    full_name?: string;
  };
}

interface ReplyingToPayload {
  messageId: string;
  senderName: string;
  content: string;
  isMe?: boolean;
  mediaType?: string | null;
  mediaName?: string | null;
  mediaUrl?: string | null;
  sharedPostId?: string | null;
  sharedProfileId?: string | null;
  sharedProfileType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  isAttachment?: boolean;
}

interface ExtendedMember extends GroupMember {
  name?: string;
  fullName?: string;
  accountName?: string;
  username?: string;
  id?: string;
  userId?: string;
  avatar?: string;
}

interface UseChatMessagesProps {
  chat: ChatThread;
  session: SessionLike | null;
  activeProfile: ActiveProfileLike | null;
  queryClient: QueryClient;
  socket: SocketLike | null;
  isGroupInvitation: boolean;
  isBlockedByMe: boolean;
  isBlockedByOther: boolean;
  replyingTo: ReplyingToPayload | null;
  setReplyingTo: (val: ReplyingToPayload | null) => void;
  pendingSharedPostId: string | null;
  setPendingSharedPostId: (val: string | null) => void;
  pendingSharedPost: Post | Record<string, unknown> | null;
  setPendingSharedPost: (val: Post | Record<string, unknown> | null) => void;
  pendingSharedProfileId: string | null;
  setPendingSharedProfileId: (val: string | null) => void;
  pendingSharedProfile: Record<string, unknown> | null;
  setPendingSharedProfile: (val: Record<string, unknown> | null) => void;
  pendingEntityContext: { type: "job" | "offer" | "event"; id: string } | null;
  setPendingEntityContext: (
    val: { type: "job" | "offer" | "event"; id: string } | null,
  ) => void;
  searchParams?: { get: (name: string) => string | null; toString: () => string } | null;
  router: { replace: (url: string) => void };
  onChatCreated?: (createdChat: ChatThread) => void;
  isQuickChat?: boolean;
  setTypingUser: (user: string | null) => void;
  setTypingMap: React.Dispatch<React.SetStateAction<Map<string, string>>>;
}

export function useChatMessages({
  chat,
  session,
  activeProfile,
  queryClient,
  socket,
  isGroupInvitation,
  isBlockedByMe,
  isBlockedByOther,
  replyingTo,
  setReplyingTo,
  pendingSharedPostId,
  setPendingSharedPostId,
  pendingSharedPost,
  setPendingSharedPost,
  pendingSharedProfileId,
  setPendingSharedProfileId,
  pendingEntityContext,
  setPendingEntityContext,
  searchParams,
  router,
  onChatCreated,
  isQuickChat,
  setTypingUser,
  setTypingMap,
}: UseChatMessagesProps) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const { toast } = useToast();

  // Fetch infinite messages
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["messages", chat.id, activeProfile?.id || "USER"],
      queryFn: async ({ pageParam }) => {
        const companyId =
          activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
        const backendMessages = await getMessages(
          chat.id,
          50,
          pageParam,
          companyId,
        );
        return backendMessages.map((m) =>
          mapBackendMessageToMessage(
            m,
            session?.user?.id,
            activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
          ),
        );
      },
      getNextPageParam: (lastPage) => {
        if (lastPage.length < 50) return undefined;
        return lastPage[0]?.created_at; // Oldest message in the current batch
      },
      initialPageParam: null as string | null,
      enabled:
        !!chat.id &&
        chat.id !== "new" &&
        !!session?.user?.id &&
        !isGroupInvitation,
      staleTime: 0,
    });

  // Flatten and reverse pages to show oldest to newest
  const messages = useMemo(() => {
    if (!data) return [];
    return [...data.pages].reverse().flatMap((page) => page);
  }, [data]);

  // Load group members if group
  useEffect(() => {
    if (chat.isGroup) {
      getGroupDetails(chat.id)
        .then((details) => {
          const members =
            details.members ||
            (details as unknown as { participants?: GroupMember[]; users?: GroupMember[] }).participants ||
            (details as unknown as { participants?: GroupMember[]; users?: GroupMember[] }).users ||
            [];
          setGroupMembers(members);
        })
        .catch((err) => {
          console.error("Failed to load group members:", err);
        });
    }
  }, [chat.id, chat.isGroup]);

  // Mention autocomplete search for group members (first priority) + external users & orgs
  const searchGroupMembers = useCallback(
    async (query: string): Promise<UserMention[]> => {
      if (!chat.isGroup) return [];

      let membersToFilter = groupMembers;
      if (membersToFilter.length === 0) {
        try {
          const details = await getGroupDetails(chat.id);
          const members =
            details.members ||
            (details as unknown as { participants?: GroupMember[]; users?: GroupMember[] }).participants ||
            (details as unknown as { participants?: GroupMember[]; users?: GroupMember[] }).users ||
            [];
          setGroupMembers(members);
          membersToFilter = members;
        } catch (e) {
          console.error("Delayed fetch of group members failed", e);
        }
      }

      const q = (query || "").toLowerCase();
      const myId = session?.user?.id;

      // 1. Group members first (excluding self)
      const matchedGroupMembers: UserMention[] = membersToFilter
        .filter((m) => {
          const uId = String(m.user_id || (m as any).id || (m as any).userId || "");
          if (myId && uId === myId) return false;
          return true;
        })
        .filter((m) => {
          if (!q) return true;
          const mExt = m as unknown as ExtendedMember;
          const fullName = (
            m.full_name ||
            mExt.name ||
            mExt.fullName ||
            ""
          ).toLowerCase();
          const accountName = (
            m.account_name ||
            mExt.accountName ||
            mExt.username ||
            ""
          ).toLowerCase();

          return fullName.includes(q) || accountName.includes(q);
        })
        .map((m): UserMention => {
          const mExt = m as unknown as ExtendedMember;
          const mMention = m as unknown as Partial<UserMention>;
          const fName =
            m.full_name || mExt.name || mExt.fullName || "User";
          const uId = String(m.user_id || mExt.id || mExt.userId || "");
          return {
            id: uId,
            full_name: fName,
            account_name:
              m.account_name ||
              mExt.accountName ||
              mExt.username ||
              fName.replace(/\s+/g, "_").toLowerCase(),
            avatar_url: m.avatar_url || mExt.avatar || "",
            headline: mMention.headline,
            account_type: mMention.account_type,
            type: mMention.type || "USER",
            slug: mMention.slug,
            org_id: mMention.org_id,
            is_company: mMention.is_company || false,
          };
        });

      // 2. Fetch external platform users & organizations from the Feed API
      let externalResults: UserMention[] = [];
      try {
        externalResults = query
          ? await searchUsers(query, true)
          : await getSuggestedUsers(true);
      } catch (err) {
        externalResults = [];
      }

      // 3. Deduplicate: append external users & orgs that aren't already in group members list
      const groupMemberIds = new Set(matchedGroupMembers.map((m) => m.id));
      if (myId) groupMemberIds.add(myId);

      const filteredExternal = (externalResults || []).filter((u) => !groupMemberIds.has(u.id));

      // 4. @everyone for group chats
      const showEveryone = !q || "everyone".includes(q) || "all".includes(q);
      const everyoneMention: UserMention = {
        id: "everyone",
        full_name: "Everyone",
        account_name: "everyone",
        avatar_url: "",
        headline: "Notify all members in this group",
        type: "GROUP",
        is_company: false,
      };

      return [
        ...(showEveryone ? [everyoneMention] : []),
        ...matchedGroupMembers,
        ...filteredExternal,
      ];
    },
    [groupMembers, chat.id, chat.isGroup, session?.user?.id],
  );

  // Send message mutation with full optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      text,
      files,
      replyMessageId,
      sharedPostId,
      sharedProfileId,
      entityType,
      entityId,
      retryMessageId,
    }: {
      text: string;
      files: File[];
      replyMessageId?: string;
      sharedPostId?: string;
      sharedProfileId?: string;
      entityType?: string;
      entityId?: string;
      retryMessageId?: string;
    }) => {
      if (chat.isGroup) {
        return sendGroupMessage(chat.id, text, "text", files, replyMessageId);
      }

      if (!chat.otherUserId) throw new Error("Target user ID missing");
      return sendMessage(
        chat.otherUserId,
        text,
        sharedPostId,
        files,
        activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
        replyMessageId,
        sharedProfileId,
        entityType,
        entityId,
      );
    },
    onMutate: async ({ text, files, retryMessageId }) => {
      const activeQueryKey = ["messages", chat.id, activeProfile?.id || "USER"];
      const fallbackQueryKey = ["messages", chat.id];

      await queryClient.cancelQueries({ queryKey: activeQueryKey });
      await queryClient.cancelQueries({ queryKey: fallbackQueryKey });

      const previousMessages =
        queryClient.getQueryData(activeQueryKey) ||
        queryClient.getQueryData(fallbackQueryKey);

      // When retrying a failed message, mark existing bubble as 'sending' instead of creating duplicate temp message
      if (retryMessageId) {
        const markRetrying = (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((m) =>
                m.id === retryMessageId ? { ...m, status: 'sending' as const } : m
              )
            ),
          };
        };
        queryClient.setQueryData(activeQueryKey, markRetrying);
        queryClient.setQueryData(fallbackQueryKey, markRetrying);
        return { previousMessages, tempId: retryMessageId };
      }

      const tempMedia = files.map((file) => {
        const isDoc =
          file.type === "application/pdf" ||
          file.type.includes("word") ||
          file.type.includes("officedocument") ||
          /\.(doc|docx|pdf|txt|rtf)$/i.test(file.name);
        const type = file.type.startsWith("video/")
          ? "video"
          : isDoc
            ? "document"
            : "image";
        return {
          url: URL.createObjectURL(file),
          type: type as "image" | "video" | "document",
          name: file.name,
        };
      });

      const newMessage: Message = {
        id: "temp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        sender: "me",
        status: "sending",
        text: text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        senderId:
          activeProfile?.type === "COMPANY"
            ? activeProfile.id
            : session?.user?.id || "me",
        senderMemberName:
          session?.user?.full_name ||
          session?.user?.name ||
          activeProfile?.name ||
          "Member",
        created_at: new Date().toISOString(),
        type: "text",
        read_at: null,
        media: tempMedia,
        sharedPost: pendingSharedPost
          ? {
              id: (pendingSharedPost.id as string) || "",
              content: (pendingSharedPost.content as string) || "",
              author: (pendingSharedPost.author as string) || "",
              authorAvatar: (pendingSharedPost.authorAvatar as string) || null,
              media:
                (pendingSharedPost.images as string[])?.map((img: string) => ({
                  url: img,
                  type: "image",
                })) || [],
            }
          : null,
        replied_msg_id: replyingTo ? replyingTo.messageId : null,
        repliedMessage: replyingTo
          ? {
              messageId: replyingTo.messageId,
              senderName: replyingTo.senderName,
              content: replyingTo.content,
              isDeleted: false,
              mediaType: replyingTo.mediaType,
              mediaName: replyingTo.mediaName,
              mediaUrl: replyingTo.mediaUrl,
              sharedPostId: replyingTo.sharedPostId,
              sharedProfileId: replyingTo.sharedProfileId,
              sharedProfileType: replyingTo.sharedProfileType,
              entityType: replyingTo.entityType,
              entityId: replyingTo.entityId,
              isAttachment: replyingTo.isAttachment,
              sharedPost: (replyingTo as any).sharedPost,
              poll: (replyingTo as any).poll,
            }
          : null,
      };

      const updateCacheWithTemp = (
        old: InfiniteData<Message[]> | undefined,
      ) => {
        if (!old) return { pages: [[newMessage]], pageParams: [null] };
        const newPages = [...old.pages];
        newPages[0] = [...newPages[0], newMessage];
        return {
          ...old,
          pages: newPages,
        };
      };

      queryClient.setQueryData(activeQueryKey, updateCacheWithTemp);
      queryClient.setQueryData(fallbackQueryKey, updateCacheWithTemp);

      // Optimistically update conversation thread in list
      const nowIso = new Date().toISOString();
      const convQueryKey = [
        "conversations",
        activeProfile?.type ?? "USER",
        activeProfile?.id ?? "me",
      ];
      queryClient.setQueryData(
        convQueryKey,
        (oldChats: ChatThread[] | undefined) => {
          if (!oldChats) return [];
          return oldChats.map((c) =>
            String(c.id) === String(chat.id)
              ? {
                  ...c,
                  lastMessage:
                    text ||
                    (pendingSharedPost ? "Shared a post" : "Attachment"),
                  time: formatTimeAgo(nowIso),
                  lastMessageAt: nowIso,
                }
              : c,
          );
        },
      );

      return { previousMessages, tempId: newMessage.id };
    },
    onError: (err: unknown, _newTodo, context) => {
      const activeQueryKey = ["messages", chat.id, activeProfile?.id || "USER"];
      const fallbackQueryKey = ["messages", chat.id];

      // On failure, retain the message in cache with status: 'failed' so retry button and red border render
      if (context?.tempId) {
        const markFailed = (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((m) =>
                m.id === context.tempId ? { ...m, status: 'failed' as const } : m
              )
            ),
          };
        };
        queryClient.setQueryData(activeQueryKey, markFailed);
        queryClient.setQueryData(fallbackQueryKey, markFailed);
      } else {
        queryClient.setQueryData(activeQueryKey, context?.previousMessages);
        queryClient.setQueryData(fallbackQueryKey, context?.previousMessages);
      }

      const errorMsg = (err as any)?.response?.data?.message || "Failed to send message";
      toast({
        description: errorMsg,
        variant: "destructive",
      });
      console.error("Failed to send message", err);
    },
    onSuccess: (data, variables, context) => {
      setTypingMap(new Map());
      setTypingUser(null);

      const realMessage = mapBackendMessageToMessage(
        data.data || data,
        session?.user?.id,
        activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
      );

      const updateCacheWithReal = (
        old: InfiniteData<Message[]> | undefined,
      ) => {
        if (!old) {
          return { pages: [[realMessage]], pageParams: [null] };
        }

        const newPages = [...old.pages];
        const alreadyExists = newPages[0].some(
          (m) => m.id === realMessage.id,
        );
        if (alreadyExists) {
          newPages[0] = newPages[0].filter((m) => m.id !== context?.tempId);
          return { ...old, pages: newPages };
        }

        const tempReplaced = newPages[0].map((m) =>
          m.id === context?.tempId ? realMessage : m,
        );

        const tempExists = newPages[0].some((m) => m.id === context?.tempId);
        newPages[0] = tempExists
          ? tempReplaced
          : [...newPages[0], realMessage];

        return { ...old, pages: newPages };
      };

      const activeQueryKey = ["messages", chat.id, activeProfile?.id || "USER"];
      const fallbackQueryKey = ["messages", chat.id];
      queryClient.setQueryData(activeQueryKey, updateCacheWithReal);
      queryClient.setQueryData(fallbackQueryKey, updateCacheWithReal);

      queryClient.invalidateQueries({
        queryKey: [
          "conversations",
          activeProfile?.type ?? "USER",
          activeProfile?.id ?? "me",
        ],
      });

      if (chat.id === "new") {
        const newConversationId =
          data.data?.conversation_id || data.conversation_id;
        if (newConversationId) {
          const newActiveQueryKey = [
            "messages",
            newConversationId,
            activeProfile?.id || "USER",
          ];
          const newFallbackQueryKey = ["messages", newConversationId];
          queryClient.setQueryData(newActiveQueryKey, updateCacheWithReal);
          queryClient.setQueryData(newFallbackQueryKey, updateCacheWithReal);
          queryClient.removeQueries({ queryKey: ["messages", "new"] });

          const newThread: ChatThread = {
            ...chat,
            id: newConversationId,
            lastMessage: variables.text || "Attachment",
            time: "Just now",
            lastMessageAt: new Date().toISOString(),
          };
          queryClient.setQueriesData<ChatThread[]>(
            {
              queryKey: [
                "conversations",
                activeProfile?.type ?? "USER",
                activeProfile?.id ?? "me",
              ],
            },
            (oldChats: ChatThread[] | undefined) => {
              const list = oldChats || [];
              if (
                !list.some((c) => String(c.id) === String(newConversationId))
              ) {
                return [newThread, ...list];
              }
              return list.map((c) =>
                String(c.id) === String(newConversationId)
                  ? { ...c, ...newThread }
                  : c,
              );
            },
          );

          if (onChatCreated) {
            onChatCreated(newThread);
          }

          if (!isQuickChat) {
            if (typeof window !== "undefined") {
              window.history.replaceState(
                null,
                "",
                `/messaging?conversationId=${newConversationId}`,
              );
            }
            router.replace(`/messaging?conversationId=${newConversationId}`);
          }
        }
      }
    },
  });

  // Handle send message logic with URL link regex parsing
  const handleSendMessage = useCallback(
    (text: string, files: File[]) => {
      if (
        (!chat.otherUserId && !chat.isGroup) ||
        isBlockedByMe ||
        isBlockedByOther
      ) {
        return;
      }

      if (socket) {
        if (chat.isGroup) {
          socket.emit("stopGroupTyping", { groupId: chat.id.toString() });
        } else {
          socket.emit("stopTyping", { conversationId: chat.id.toString() });
        }
      }

      let effectiveSharedPostId = pendingSharedPostId || undefined;
      let effectiveSharedProfileId = pendingSharedProfileId || undefined;
      let effectiveEntityType = pendingEntityContext?.type || undefined;
      let effectiveEntityId = pendingEntityContext?.id || undefined;

      if (
        !effectiveSharedPostId &&
        !effectiveSharedProfileId &&
        !effectiveEntityId &&
        text
      ) {
        const postMatch = text.match(
          /(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:post))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i,
        );
        const isUuid = (val?: string) =>
          Boolean(
            val &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                val,
              ),
          );

        if (postMatch && isUuid(postMatch[1])) {
          effectiveSharedPostId = postMatch[1];
        }

        const jobMatch = text.match(
          /(?:https?:\/\/[^\/\s]+)?\/jobs\/([a-zA-Z0-9_-]+)/i,
        );
        if (jobMatch) {
          effectiveEntityType = "job";
          effectiveEntityId = jobMatch[1];
        }

        const profileMatch = text.match(
          /(?:https?:\/\/[^\/\s]+)?\/profile\/([a-zA-Z0-9_.-]+)/i,
        );
        if (profileMatch && isUuid(profileMatch[1])) {
          effectiveSharedProfileId = profileMatch[1];
        }

        const orgMatch = text.match(
          /(?:https?:\/\/[^\/\s]+)?\/(?:organization|company)\/([a-zA-Z0-9_-]+)/i,
        );
        if (orgMatch && isUuid(orgMatch[1])) {
          effectiveSharedProfileId = orgMatch[1];
        }
      }

      const isDocFile = (f: File) =>
        f.type === "application/pdf" ||
        f.type.includes("word") ||
        f.type.includes("officedocument") ||
        /\.(doc|docx|pdf|txt|rtf|xls|xlsx|ppt|pptx)$/i.test(f.name);

      const visualFiles = files ? files.filter((f) => !isDocFile(f)) : [];
      const docFiles = files ? files.filter((f) => isDocFile(f)) : [];

      if (docFiles.length > 0) {
        if (visualFiles.length > 0 || text.trim() || effectiveSharedPostId || effectiveSharedProfileId) {
          // Send visual media + message text and shared context first
          sendMessageMutation.mutate({
            text,
            files: visualFiles,
            replyMessageId: replyingTo?.messageId,
            sharedPostId: effectiveSharedPostId,
            sharedProfileId: effectiveSharedProfileId,
            entityType: effectiveEntityType,
            entityId: effectiveEntityId,
          });

          // Send each document as a separate standalone message
          docFiles.forEach((docFile) => {
            sendMessageMutation.mutate({
              text: "",
              files: [docFile],
            });
          });
        } else {
          // Only documents with no text: send each document as a separate message
          docFiles.forEach((docFile, idx) => {
            sendMessageMutation.mutate({
              text: "",
              files: [docFile],
              replyMessageId: idx === 0 ? replyingTo?.messageId : undefined,
            });
          });
        }
      } else {
        sendMessageMutation.mutate({
          text,
          files: visualFiles,
          replyMessageId: replyingTo?.messageId,
          sharedPostId: effectiveSharedPostId,
          sharedProfileId: effectiveSharedProfileId,
          entityType: effectiveEntityType,
          entityId: effectiveEntityId,
        });
      }

      setReplyingTo(null);
      setPendingSharedPostId(null);
      setPendingSharedPost(null);
      setPendingSharedProfileId(null);
      setPendingEntityContext(null);

      if (
        searchParams?.get("jobContext") ||
        searchParams?.get("offerContext") ||
        searchParams?.get("eventContext")
      ) {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("jobContext");
        newParams.delete("offerContext");
        newParams.delete("eventContext");
        router.replace(`/messaging?${newParams.toString()}`);
      }
    },
    [
      chat.otherUserId,
      chat.isGroup,
      chat.id,
      isBlockedByMe,
      isBlockedByOther,
      socket,
      sendMessageMutation,
      replyingTo,
      pendingSharedPostId,
      pendingSharedProfileId,
      pendingEntityContext,
      searchParams,
      router,
      setReplyingTo,
      setPendingSharedPostId,
      setPendingSharedPost,
      setPendingSharedProfileId,
      setPendingEntityContext,
    ],
  );

  const chatId = chat.id;
  const isGroup = chat.isGroup;

  // Throttled typing input emitter
  const handleTypingInput = useCallback(() => {
    if (!socket || !chatId || chatId === "new") return;

    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      if (isGroup) {
        socket.emit("groupTyping", { groupId: chatId.toString() });
      } else {
        socket.emit("typing", { conversationId: chatId.toString() });
      }
      lastTypingRef.current = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isGroup) {
        socket.emit("stopGroupTyping", { groupId: chatId.toString() });
      } else {
        socket.emit("stopTyping", { conversationId: chatId.toString() });
      }
    }, 3000);
  }, [socket, chatId, isGroup]);

  // Retry action: re-triggers sending a failed message when the retry icon is clicked
  const handleRetryMessage = useCallback((failedMsg: Message) => {
    if (!failedMsg) return;
    sendMessageMutation.mutate({
      text: failedMsg.text || failedMsg.text_content || "",
      files: [],
      replyMessageId: failedMsg.replied_msg_id || undefined,
      sharedPostId: failedMsg.sharedPost?.id || undefined,
      retryMessageId: failedMsg.id,
    });
  }, [sendMessageMutation]);

  return {
    messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleSendMessage,
    handleRetryMessage,
    handleTypingInput,
    searchGroupMembers,
    isSending: sendMessageMutation.isPending,
  };
}
