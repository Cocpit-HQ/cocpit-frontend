"use client";

import { useMemo, useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";
import { ChatThread } from "@/types/messaging";
import {
  acceptChatRequest,
  declineChatRequest,
  muteGroup,
  unmuteGroup,
} from "@/services/api/messaging";
import { respondInvitation } from "@/services/api/group-chat";
import { companyProfileService } from "@/features/businessProfile";
import { useSocial } from "@/context/SocialContext";
import { formatMuteToastMessage, getMuteRemainingMs } from "../utils/muteUtils";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    return e.response?.data?.message || e.message || fallback;
  }
  return fallback;
}

interface UseChatConversationProps {
  chat: ChatThread;
  activeProfile: { type?: string; id?: string } | null;
  queryClient: QueryClient;
  toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => void;
  typingUser: string | null;
  typingMap: Map<string, string>;
  onAcceptSuccess?: () => void;
  onBack?: () => void;
}

export function useChatConversation({
  chat,
  activeProfile,
  queryClient,
  toast,
  typingUser,
  typingMap,
  onAcceptSuccess,
  onBack,
}: UseChatConversationProps) {
  const { unblockUser } = useSocial();

  const isGroupInvitation =
    !!chat.is_requesting &&
    (chat.isGroup === true ||
      (chat as unknown as { is_group?: boolean }).is_group === true ||
      chat.request_source === "group_invitation");

  // Unblock account
  const handleUnblock = async () => {
    const targetId =
      chat.otherUserId ||
      (chat as unknown as { other_user_id?: string }).other_user_id;
    if (!targetId) return;
    try {
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
                  isBlockedByMe: false,
                  name: c.rawName || c.name,
                  role: c.rawRole || c.role,
                  avatar: c.rawAvatar || c.avatar,
                }
              : c,
          );
        },
      );

      // 2. Perform API unblock
      if (chat.otherUserType === "COMPANY") {
        await companyProfileService.unblockTarget(targetId);
        toast({ description: "Account unblocked successfully" });
      } else {
        await unblockUser(targetId);
      }

      // 3. Silent background invalidation
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to unblock account"),
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  };

  // Accept request
  const handleAcceptRequest = async () => {
    try {
      if (isGroupInvitation) {
        if (!chat.invitation_id) throw new Error("Invitation ID missing");
        await respondInvitation(chat.invitation_id, "accept");
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
              c.id === chat.id ? { ...c, is_requesting: false } : c,
            );
          },
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["invitations"] });
        toast({ description: "Request accepted" });
        if (onAcceptSuccess) onAcceptSuccess();
      } else {
        await acceptChatRequest(chat.id);
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
              c.id === chat.id ? { ...c, is_requesting: false } : c,
            );
          },
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        toast({ description: "Request accepted" });
        if (onAcceptSuccess) onAcceptSuccess();
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to accept request"),
        variant: "destructive",
      });
    }
  };

  // Decline request
  const handleDeclineRequest = async () => {
    try {
      if (isGroupInvitation) {
        if (!chat.invitation_id) throw new Error("Invitation ID missing");
        await respondInvitation(chat.invitation_id, "reject");
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
        queryClient.invalidateQueries({ queryKey: ["invitations"] });
        toast({ description: "Request declined" });
        if (onBack) onBack();
      } else {
        await declineChatRequest(chat.id);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        toast({ description: "Request declined" });
        if (onBack) onBack();
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to decline request"),
        variant: "destructive",
      });
    }
  };

  // Auto-unmute when mute timer expires during an active session
  useEffect(() => {
    const remainingMs = getMuteRemainingMs(chat?.muted_until);
    if (!remainingMs || !chat?.is_muted) return;

    const timer = setTimeout(() => {
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
              : c
          );
        }
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }, remainingMs);

    return () => clearTimeout(timer);
  }, [chat?.id, chat?.is_muted, chat?.muted_until, activeProfile, queryClient]);

  // Mute with duration
  const handleMuteWithDuration = async (hours: number | null) => {
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
      toast({
        description: formatMuteToastMessage(hours, !!chat.isGroup),
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to mute chat"),
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  };

  // Unmute chat
  const handleUnmuteChat = async () => {
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
      toast({ description: "Chat unmuted" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Failed to unmute chat"),
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  };

  // Derived typing string
  const typingDisplayString = useMemo(() => {
    if (chat.isGroup) {
      const users = Array.from(typingMap.values());
      if (users.length === 1) {
        return `${users[0]} is typing...`;
      } else if (users.length > 1) {
        return `${users.join(", ")} are typing...`;
      }
      return null;
    }
    return typingUser ? "typing..." : null;
  }, [chat.isGroup, typingMap, typingUser]);

  return {
    isGroupInvitation,
    typingDisplayString,
    handleUnblock,
    handleAcceptRequest,
    handleDeclineRequest,
    handleMuteWithDuration,
    handleUnmuteChat,
  };
}
