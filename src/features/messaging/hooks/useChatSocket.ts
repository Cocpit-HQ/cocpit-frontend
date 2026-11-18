"use client";

import { useEffect } from "react";
import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { SocketMessage, TypingPayload } from "@/types/socket";
import { ChatThread, Message } from "@/types/messaging";
import { mapBackendMessageToMessage } from "@/lib/mappers/messaging.mapper";
import { markAsRead } from "@/services/api/messaging";

interface SocketLike {
  emit: (event: string, ...args: unknown[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (event: string, fn: (...args: any[]) => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off: (event: string, fn: (...args: any[]) => void) => void;
}

interface ActiveProfileLike {
  type?: string;
  id?: string;
  name?: string;
}

interface UseChatSocketParams {
  socket: SocketLike | null;
  chat: ChatThread;
  sessionUserId?: string;
  activeProfile: ActiveProfileLike | null;
  queryClient: QueryClient;
  setTypingUser: (user: string | null) => void;
  setTypingMap: React.Dispatch<React.SetStateAction<Map<string, string>>>;
}

export function useChatSocket({
  socket,
  chat,
  sessionUserId,
  activeProfile,
  queryClient,
  setTypingUser,
  setTypingMap,
}: UseChatSocketParams) {
  const chatId = chat.id;
  const isGroup = chat.isGroup;
  const isMock = chat.isMock;

  useEffect(() => {
    if (!socket || !chatId || chatId === "new") return;

    // Join conversation room
    socket.emit("joinConversation", { conversationId: chatId.toString() });

    // Join Group room explicitly if group
    if (isGroup) {
      socket.emit("joinGroup", { groupId: chatId.toString() });
    }

    const handleNewMessage = (msg: SocketMessage) => {
      if (String(msg.conversation_id) !== String(chatId)) return;

      const isMe = msg.sender_id === sessionUserId;

      // Clear typing indicator for the sender
      if (isGroup) {
        setTypingMap((prev) => {
          const next = new Map(prev);
          next.delete(msg.sender_id);
          return next;
        });
      } else {
        setTypingUser(null);
      }

      // Map socket message to frontend entity
      const uiMessage = mapBackendMessageToMessage(
        msg as unknown as Parameters<typeof mapBackendMessageToMessage>[0],
        sessionUserId,
        activeProfile?.type === "COMPANY" ? activeProfile.id : undefined,
      );

      queryClient.setQueryData(
        ["messages", chatId, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) {
            return { pages: [[uiMessage]], pageParams: [null] };
          }

          // Check if real ID already exists in ANY page
          const existsPage = old.pages.findIndex((page) =>
            page.some((m) => m.id === uiMessage.id),
          );

          if (existsPage !== -1) {
            const newPages = [...old.pages];
            newPages[existsPage] = newPages[existsPage].map((m) => {
              if (m.id === uiMessage.id) {
                return {
                  ...m,
                  ...uiMessage,
                  media:
                    uiMessage.media && uiMessage.media.length > 0
                      ? uiMessage.media
                      : m.media,
                  sharedPost: uiMessage.sharedPost || m.sharedPost,
                  sharedProfile: uiMessage.sharedProfile || m.sharedProfile,
                  sharedProfileId:
                    uiMessage.sharedProfileId || m.sharedProfileId,
                  sharedProfileType:
                    uiMessage.sharedProfileType || m.sharedProfileType,
                  entityType: uiMessage.entityType || m.entityType,
                  entityId: uiMessage.entityId || m.entityId,
                  replied_msg_id: uiMessage.replied_msg_id || m.replied_msg_id,
                  repliedMessage: uiMessage.repliedMessage || m.repliedMessage,
                };
              }
              return m;
            });
            return { ...old, pages: newPages };
          }

          const newPages = [...old.pages];

          // If sender is me, match and replace pending optimistic placeholder
          if (isMe) {
            const firstPage = newPages[0];
            const optimisticMatch = firstPage.find(
              (m) => m.id.startsWith("temp-") && m.text === uiMessage.text,
            );
            if (optimisticMatch) {
              newPages[0] = firstPage.map((m) =>
                m.id === optimisticMatch.id ? uiMessage : m,
              );
              return { ...old, pages: newPages };
            }
          }

          // Append to the first (most-recent) page
          newPages[0] = [...newPages[0], uiMessage];
          return { ...old, pages: newPages };
        },
      );

      // Invalidate conversation list to update preview/timestamp
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Mark as read if conversation is open
      if (!isMe && !isMock && !String(chatId).startsWith("mock-")) {
        const companyId =
          activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
        markAsRead(chatId, companyId).catch(console.error);
      }
    };

    const handleTyping = (payload: TypingPayload) => {
      if (
        payload.conversationId === chatId.toString() &&
        payload.senderId !== sessionUserId
      ) {
        if (isGroup && payload.isGroup) {
          if (payload.senderId && payload.username) {
            setTypingMap((prev) =>
              new Map(prev).set(payload.senderId!, payload.username!),
            );
          }
        } else {
          setTypingUser(payload.username || "Someone");
        }
      }
    };

    const handleStopTyping = (payload: TypingPayload) => {
      if (payload.conversationId === chatId.toString()) {
        if (isGroup && payload.isGroup) {
          if (payload.senderId) {
            setTypingMap((prev) => {
              const next = new Map(prev);
              next.delete(payload.senderId!);
              return next;
            });
          }
        } else {
          setTypingUser(null);
        }
      }
    };

    const handleMessagesSeen = (payload: {
      conversationId: string;
      messageIds: string[];
      readAt: string;
      readerId: string;
    }) => {
      if (payload.conversationId !== chatId) return;

      queryClient.setQueryData(
        ["messages", chatId, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return undefined;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (payload.messageIds.includes(m.id)) {
                return { ...m, read_at: payload.readAt };
              }
              return m;
            }),
          );
          return { ...old, pages: newPages };
        },
      );
    };

    const handleMessageDeleted = (payload: {
      messageId: string;
      conversationId: string;
      deleteType: "me" | "everyone";
    }) => {
      if (payload.conversationId !== chatId) return;

      queryClient.setQueryData(
        ["messages", chatId, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return undefined;

          if (payload.deleteType === "me") {
            const newPages = old.pages.map((page) =>
              page.map((m) => {
                if (m.id === payload.messageId) {
                  return {
                    ...m,
                    text: "This message is deleted for you",
                    text_content: "This message is deleted for you",
                    sharedPost: null,
                    is_deleted: true,
                    is_deleted_for_me: true,
                  };
                }
                return m;
              }),
            );
            return { ...old, pages: newPages };
          } else {
            const newPages = old.pages.map((page) =>
              page.map((m) => {
                if (m.id === payload.messageId) {
                  return {
                    ...m,
                    text: "This message was deleted for everyone.",
                    text_content: "This message was deleted for everyone.",
                    sharedPost: null,
                    sharedProfile: null,
                    sharedProfileId: undefined,
                    sharedPostId: undefined,
                    entityType: undefined,
                    entityId: undefined,
                    media: [],
                    reactions: [],
                    is_deleted: true,
                    is_deleted_for_everyone: true,
                  };
                }
                return m;
              }),
            );
            return { ...old, pages: newPages };
          }
        },
      );
    };

    const handleMessageEdited = (payload: {
      messageId: string;
      conversationId: string;
      text_content: string;
    }) => {
      if (payload.conversationId !== chatId) return;

      queryClient.setQueryData(
        ["messages", chatId, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return undefined;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (m.id === payload.messageId) {
                return {
                  ...m,
                  text: payload.text_content,
                  text_content: payload.text_content,
                  is_edited: true,
                };
              }
              return m;
            }),
          );
          return { ...old, pages: newPages };
        },
      );
    };

    const handleReactionUpdated = (payload: {
      messageId: string;
      conversationId: string;
      reaction: {
        user_id: string;
        emoji: string;
        full_name: string;
        avatar: string | null;
        updated_at: string;
      } | null;
      userId?: string;
    }) => {
      if (payload.conversationId !== chatId) return;
      queryClient.setQueryData(
        ["messages", chatId, activeProfile?.id || "USER"],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return old;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (m.id !== payload.messageId) return m;
              const reactions = m.reactions || [];
              if (payload.reaction === null) {
                const uid = payload.userId;
                return {
                  ...m,
                  reactions: reactions.filter((r) => r.user_id !== uid),
                };
              } else {
                const idx = reactions.findIndex(
                  (r) => r.user_id === payload.reaction!.user_id,
                );
                const newReactions =
                  idx !== -1
                    ? reactions.map((r, i) =>
                        i === idx ? payload.reaction! : r,
                      )
                    : [...reactions, payload.reaction!];
                return { ...m, reactions: newReactions };
              }
            }),
          );
          return { ...old, pages: newPages };
        },
      );
    };

    const handlePreferenceUpdated = (payload: {
      conversationId: string;
      preference: { is_muted: boolean; muted_until: string | null };
    }) => {
      if (String(payload.conversationId) === String(chatId)) {
        const queryKey = [
          "conversations",
          activeProfile?.type ?? "USER",
          activeProfile?.id ?? "me",
        ];
        queryClient.setQueryData(
          queryKey,
          (oldChats: ChatThread[] | undefined) => {
            if (!oldChats) return [];
            return oldChats.map((c) =>
              String(c.id) === String(payload.conversationId)
                ? {
                    ...c,
                    is_muted: payload.preference.is_muted,
                    muted_until: payload.preference.muted_until,
                  }
                : c,
            );
          },
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    };

    const handleBlockOrDeactivate = () => {
      queryClient.resetQueries({ queryKey: ["messages", chatId], exact: false });
      queryClient.resetQueries({ queryKey: ["sharedPost"], exact: false });
      queryClient.resetQueries({ queryKey: ["profilePreview"], exact: false });
      queryClient.resetQueries({ queryKey: ["entityPreview"], exact: false });
      queryClient.resetQueries({ queryKey: ["jobContext"], exact: false });
      queryClient.refetchQueries({ queryKey: ["messages", chatId], type: "all" });
      queryClient.refetchQueries({ queryKey: ["conversations"], type: "all" });
      queryClient.refetchQueries({ queryKey: ["sharedPost"], type: "all" });
      queryClient.refetchQueries({ queryKey: ["profilePreview"], type: "all" });
      queryClient.refetchQueries({ queryKey: ["entityPreview"], type: "all" });
      queryClient.refetchQueries({ queryKey: ["jobContext"], type: "all" });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("isTyping", handleTyping);
    socket.on("stoppedTyping", handleStopTyping);
    socket.on("messages_seen", handleMessagesSeen);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_deleted_for_everyone", handleMessageDeleted);
    socket.on("message_deleted_for_me", handleMessageDeleted);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_reaction_updated", handleReactionUpdated);
    socket.on("conversation_preference_updated", handlePreferenceUpdated);
    socket.on("user_blocked", handleBlockOrDeactivate);
    socket.on("block_confirmed", handleBlockOrDeactivate);
    socket.on("user_unblocked", handleBlockOrDeactivate);
    socket.on("unblock_confirmed", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_USER_BLOCKED", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_USER_UNBLOCKED", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_BLOCK_UPDATED", handleBlockOrDeactivate);
    socket.on("relationshipUpdated", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_DEACTIVATED", handleBlockOrDeactivate);
    socket.on("organization_deactivated", handleBlockOrDeactivate);
    socket.on("ORGANIZATION_REACTIVATED", handleBlockOrDeactivate);
    socket.on("organization_reactivated", handleBlockOrDeactivate);
    socket.on("org_status_changed", handleBlockOrDeactivate);
    socket.on("user_deactivated", handleBlockOrDeactivate);
    socket.on("USER_DEACTIVATED", handleBlockOrDeactivate);
    socket.on("user_reactivated", handleBlockOrDeactivate);
    socket.on("USER_REACTIVATED", handleBlockOrDeactivate);
    socket.on("account_deactivated", handleBlockOrDeactivate);
    socket.on("ACCOUNT_DEACTIVATED", handleBlockOrDeactivate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("isTyping", handleTyping);
      socket.off("stoppedTyping", handleStopTyping);
      socket.off("messages_seen", handleMessagesSeen);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_deleted_for_everyone", handleMessageDeleted);
      socket.off("message_deleted_for_me", handleMessageDeleted);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_reaction_updated", handleReactionUpdated);
      socket.off("conversation_preference_updated", handlePreferenceUpdated);
      socket.off("user_blocked", handleBlockOrDeactivate);
      socket.off("block_confirmed", handleBlockOrDeactivate);
      socket.off("user_unblocked", handleBlockOrDeactivate);
      socket.off("unblock_confirmed", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_USER_BLOCKED", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_USER_UNBLOCKED", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_BLOCK_UPDATED", handleBlockOrDeactivate);
      socket.off("relationshipUpdated", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_DEACTIVATED", handleBlockOrDeactivate);
      socket.off("organization_deactivated", handleBlockOrDeactivate);
      socket.off("ORGANIZATION_REACTIVATED", handleBlockOrDeactivate);
      socket.off("organization_reactivated", handleBlockOrDeactivate);
      socket.off("org_status_changed", handleBlockOrDeactivate);
      socket.off("user_deactivated", handleBlockOrDeactivate);
      socket.off("USER_DEACTIVATED", handleBlockOrDeactivate);
      socket.off("user_reactivated", handleBlockOrDeactivate);
      socket.off("USER_REACTIVATED", handleBlockOrDeactivate);
      socket.off("account_deactivated", handleBlockOrDeactivate);
      socket.off("ACCOUNT_DEACTIVATED", handleBlockOrDeactivate);
    };
  }, [
    socket,
    chatId,
    isGroup,
    isMock,
    sessionUserId,
    queryClient,
    activeProfile,
    setTypingMap,
    setTypingUser,
  ]);
}
