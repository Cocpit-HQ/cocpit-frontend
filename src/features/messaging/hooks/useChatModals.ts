"use client";

import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { ChatThread } from "@/types/messaging";
import { deletePersonalChat, muteGroup, unmuteGroup } from "@/services/api/messaging";
import { leaveGroup } from "@/services/api/group-chat";
import { useSocial } from "@/context/SocialContext";
import { formatMuteToastMessage } from "../utils/muteUtils";
import { setPinnedMessageId } from "../utils/pinMessageUtils";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

interface UseChatModalsProps {
  chat: ChatThread;
  activeProfile: { type?: string; id?: string } | null;
  queryClient: QueryClient;
  toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => void;
  onBack?: () => void;
}

export function useChatModals({
  chat,
  activeProfile,
  queryClient,
  toast,
  onBack,
}: UseChatModalsProps) {
  const { blockUser } = useSocial();

  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMuteConfirm, setShowMuteConfirm] = useState(false);
  const [showUnmuteConfirm, setShowUnmuteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const targetId =
    chat.otherUserId ||
    (chat as unknown as { other_user_id?: string }).other_user_id ||
    "";

  // Confirm Block
  const onConfirmBlock = async () => {
    if (targetId) {
      try {
        const isCompany = chat.otherUserType === "COMPANY";
        const fallbackName = isCompany ? "Unknown Page" : "Unknown User";
        const fallbackRole = isCompany ? "Page unavailable" : "User unavailable";

        // 1. Optimistic UI update across all conversation queries (0ms instant update)
        queryClient.setQueriesData<ChatThread[]>(
          { queryKey: ["conversations"] },
          (oldChats: ChatThread[] | undefined) => {
            if (!oldChats) return [];
            return oldChats.map((c) =>
              String(c.id) === String(chat.id) ||
              (targetId && String(c.otherUserId) === String(targetId))
                ? {
                    ...c,
                    isBlockedByMe: true,
                    rawName: c.rawName || c.name,
                    rawRole: c.rawRole || c.role,
                    rawAvatar: c.rawAvatar || c.avatar,
                    name: fallbackName,
                    role: fallbackRole,
                    avatar: undefined,
                  }
                : c,
            );
          },
        );

        setShowBlockConfirm(false);
        await blockUser(targetId);
        queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } catch (err: unknown) {
        console.error("Failed to block user:", err);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } finally {
        setShowBlockConfirm(false);
      }
    } else {
      setShowBlockConfirm(false);
    }
  };

  // Confirm Delete Chat
  const onConfirmDeleteChat = async () => {
    try {
      await deletePersonalChat(chat.id, 'delete');
      queryClient.removeQueries({ queryKey: ["messages", chat.id] });
      queryClient.setQueriesData<ChatThread[]>(
        {
          queryKey: [
            "conversations",
            activeProfile?.type ?? "USER",
            activeProfile?.id ?? "me",
          ],
        },
        (oldChats: ChatThread[] | undefined) => {
          if (!oldChats) return [];
          return oldChats.filter((c) => c.id !== chat.id);
        },
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({ description: "Chat deleted successfully" });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/messaging");
      }
      if (onBack) onBack();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to delete chat"),
        variant: "destructive",
      });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  // Confirm Clear Chat
  const onConfirmClearChat = async () => {
    try {
      await deletePersonalChat(chat.id, 'clear');
      setPinnedMessageId(chat.id, null, activeProfile?.type, activeProfile?.id);
      queryClient.removeQueries({ queryKey: ["messages", chat.id] });
      queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
      queryClient.setQueriesData<ChatThread[]>(
        { queryKey: ["conversations"] },
        (oldChats: ChatThread[] | undefined) => {
          if (!oldChats) return [];
          return oldChats.map((c) =>
            String(c.id) === String(chat.id)
              ? { ...c, lastMessage: "", unread: 0, is_read: true }
              : c
          );
        }
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({ description: "Chat cleared successfully" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to clear chat"),
        variant: "destructive",
      });
    } finally {
      setShowClearConfirm(false);
    }
  };

  // Confirm Mute Group / Conversation
  const onConfirmMuteGroup = async (hours: number | null = null) => {
    try {
      const mutedUntil = hours
        ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
        : null;

      queryClient.setQueriesData<ChatThread[]>(
        {
          queryKey: [
            "conversations",
            activeProfile?.type ?? "USER",
            activeProfile?.id ?? "me",
          ],
        },
        (oldChats: ChatThread[] | undefined) => {
          if (!oldChats) return [];
          return oldChats.map((c) =>
            String(c.id) === String(chat.id)
              ? { ...c, is_muted: true, muted_until: mutedUntil }
              : c,
          );
        },
      );
      await muteGroup(chat.id, true, mutedUntil, hours);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({ description: formatMuteToastMessage(hours, !!chat.isGroup) });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to mute"),
        variant: "destructive",
      });
    } finally {
      setShowMuteConfirm(false);
    }
  };

  // Confirm Unmute Group
  const onConfirmUnmuteGroup = async () => {
    try {
      queryClient.setQueriesData<ChatThread[]>(
        {
          queryKey: [
            "conversations",
            activeProfile?.type ?? "USER",
            activeProfile?.id ?? "me",
          ],
        },
        (oldChats: ChatThread[] | undefined) => {
          if (!oldChats) return [];
          return oldChats.map((c) =>
            String(c.id) === String(chat.id)
              ? { ...c, is_muted: false, muted_until: null }
              : c,
          );
        },
      );
      await unmuteGroup(chat.id);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({ description: "Group unmuted successfully" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to unmute group"),
        variant: "destructive",
      });
    } finally {
      setShowUnmuteConfirm(false);
    }
  };

  // Confirm Leave Group
  const onConfirmLeaveGroup = async () => {
    try {
      await leaveGroup(chat.id);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast({ description: "You left the group" });
      if (onBack) onBack();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to leave group"),
        variant: "destructive",
      });
    } finally {
      setShowLeaveConfirm(false);
    }
  };

  return {
    targetId,
    // States
    showReportConfirm,
    setShowReportConfirm,
    showBlockConfirm,
    setShowBlockConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showMuteConfirm,
    setShowMuteConfirm,
    showUnmuteConfirm,
    setShowUnmuteConfirm,
    showLeaveConfirm,
    setShowLeaveConfirm,
    showClearConfirm,
    setShowClearConfirm,
    isShareModalOpen,
    setIsShareModalOpen,
    // Actions
    onConfirmBlock,
    onConfirmDeleteChat,
    onConfirmClearChat,
    onConfirmMuteGroup,
    onConfirmUnmuteGroup,
    onConfirmLeaveGroup,
    // Triggers
    openReportConfirm: () => setShowReportConfirm(true),
    openBlockConfirm: () => setShowBlockConfirm(true),
    openDeleteConfirm: () => setShowDeleteConfirm(true),
    openMuteConfirm: () => setShowMuteConfirm(true),
    openUnmuteConfirm: () => setShowUnmuteConfirm(true),
    openLeaveConfirm: () => setShowLeaveConfirm(true),
    openClearConfirm: () => setShowClearConfirm(true),
    openShareModal: () => setIsShareModalOpen(true),
  };
}

export type ChatModalsHandle = ReturnType<typeof useChatModals>;
