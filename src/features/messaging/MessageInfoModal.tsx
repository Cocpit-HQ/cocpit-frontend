"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { CancelIcon } from "@/components/icons";
import Avatar from "@/components/shared/Avatar";
import { getMessageReadReceipts } from "@/services/api/group-chat";
import { Message, ChatThread } from "@/types/messaging";
import { cn } from "@/lib/utils";
import { useSocial } from "@/context/SocialContext";

interface MessageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: Message | null;
  messageId?: string;
  messageContent?: string;
  readAt?: string | null;
  receiver?: {
    name: string;
    avatar?: string | null;
  };
  chat?: ChatThread;
  groupId?: string;
  isGroup?: boolean;
  currentUserId?: string;
}

interface SeenByUser {
  user_id: string;
  full_name: string;
  avatar_url: string;
  read_at: string;
}

/**
 * Smart relative / absolute timestamp formatting per Figma:
 * - < 1 minute: "Just now"
 * - < 60 minutes: "Xm ago"
 * - Today: "Today, 1:20 PM"
 * - Yesterday: "Yesterday, 1:20 PM"
 * - Other: "Jul 19, 1:20 PM"
 */
function formatMessageInfoTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 60) {
    return "Just now";
  }

  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

  if (isToday) {
    return `Today, ${timeStr}`;
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  const monthStr = date.toLocaleDateString([], { month: "short" });
  const dayStr = date.getDate();
  return `${monthStr} ${dayStr}, ${timeStr}`;
}

/**
 * Formats exact calendar date & time for sent metadata (e.g. "Today, 5:20 PM", "Nov 17, 5:20 PM")
 */
function formatExactMessageTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return typeof dateInput === "string" ? dateInput : "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

  if (isToday) {
    return `Today, ${timeStr}`;
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  const monthStr = date.toLocaleDateString([], { month: "short" });
  const dayStr = date.getDate();
  const yearStr = date.getFullYear() !== now.getFullYear() ? `, ${date.getFullYear()}` : "";
  return `${monthStr} ${dayStr}${yearStr}, ${timeStr}`;
}

export default function MessageInfoModal({
  isOpen,
  onClose,
  message,
  messageId,
  messageContent,
  readAt,
  receiver,
  chat,
  groupId,
  isGroup,
  currentUserId,
}: MessageInfoModalProps) {
  const { isBlocked } = useSocial();
  const [seenBy, setSeenBy] = useState<SeenByUser[]>([]);
  const [loading, setLoading] = useState(false);

  const effectiveMsgId = message?.id || messageId || "";
  const effectiveIsGroup = Boolean(isGroup || chat?.isGroup || groupId);
  const effectiveGroupId = groupId || (chat?.isGroup ? chat.id : undefined);

  // Determine whether current user authored this message
  const isMe = useMemo(() => {
    if (message?.sender === "me") return true;
    if (message?.sender === "other") return false;
    if (currentUserId && message?.senderId) {
      return String(message.senderId) === String(currentUserId);
    }
    return true;
  }, [message?.sender, message?.senderId, currentUserId]);

  // Sender details for incoming messages
  const senderName = useMemo(() => {
    return (
      message?.senderName ||
      message?.senderMemberName ||
      (message?.sender === "other" && chat?.name ? chat.name : undefined) ||
      (receiver?.name ? receiver.name : "Member")
    );
  }, [message, chat, receiver]);

  const senderAvatar = useMemo(() => {
    return (
      message?.senderAvatar ||
      (message?.sender === "other" && chat?.avatar ? chat.avatar : undefined) ||
      receiver?.avatar
    );
  }, [message, chat, receiver]);

  const sentRawTime = message?.created_at || message?.time;
  const sentFormatted = useMemo(() => formatExactMessageTime(sentRawTime), [sentRawTime]);

  const isEdited = Boolean(message?.is_edited);
  const editedRawTime = message?.edited_at;
  const editedFormatted = useMemo(() => (editedRawTime ? formatExactMessageTime(editedRawTime) : null), [editedRawTime]);

  // Helper to parse mentions in text e.g. @[Name](uuid) -> @Name
  const renderTextWithMentions = (text: string) => {
    if (!text) return null;
    const regex = /(@\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(regex);
    if (parts.length <= 1) {
      const match = text.match(/^@\[([^\]]+)\]\([^)]+\)$/);
      if (match) {
        const name = match[1];
        return (
          <span className="font-semibold text-[var(--ds-accent)] !text-[var(--ds-accent)]">
            {name.startsWith("@") ? name : `@${name}`}
          </span>
        );
      }
      return text;
    }

    return parts.map((part, index) => {
      const match = part.match(/^@\[([^\]]+)\]\([^)]+\)$/);
      if (match) {
        const name = match[1];
        return (
          <span
            key={index}
            className="font-semibold text-[var(--ds-accent)] !text-[var(--ds-accent)]"
          >
            {name.startsWith("@") ? name : `@${name}`}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const rawText = message?.text || message?.text_content || messageContent || "";

  // 1. Check Shared Post
  const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:post))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i;
  const extractedPostId = rawText.match(postUrlRegex)?.[1];
  const hasSharedPost = Boolean(
    message && (
      message.sharedPost ||
      (message as any).shared_post ||
      message.sharedPostId ||
      (message as any).shared_post_id ||
      ((message.entityType === 'post' || message.entityType === 'article') && message.entityId) ||
      extractedPostId
    )
  );

  // 2. Check Shared Profile
  const profileUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:profile|organization|company)\/([a-zA-Z0-9_.-]+)/i;
  const extractedProfileId = rawText.match(profileUrlRegex)?.[1];
  const hasSharedProfile = Boolean(
    message && !hasSharedPost && (
      message.sharedProfile ||
      message.sharedProfileId ||
      ((message.entityType === 'profile' || message.entityType === 'company') && message.entityId) ||
      extractedProfileId
    )
  );

  // 3. Check Shared Job
  const jobUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/jobs\/([a-zA-Z0-9_-]+)/i;
  const extractedJobId = rawText.match(jobUrlRegex)?.[1];
  const isJobEntity = message?.entityType === "job" || message?.entityType === "offer";
  const hasSharedJob = Boolean(
    message && !hasSharedPost && !hasSharedProfile && (
      (isJobEntity && message.entityId) ||
      extractedJobId
    )
  );

  // 4. Check Media
  const hasMedia = Boolean(message?.media && message.media.length > 0);

  // Content to display in preview bubble
  const displayContent = useMemo(() => {
    if (messageContent) return messageContent;
    if (message?.text) return message.text;
    if (message?.text_content) return message.text_content;
    if (message?.media && message.media.length > 0) {
      const firstMedia = message.media[0] as { url: string; type: string; name?: string | null; filename?: string | null };
      return firstMedia.name || firstMedia.filename || (firstMedia.type === "image" ? "Photo" : firstMedia.type === "video" ? "Video" : "Document");
    }
    return "Message";
  }, [messageContent, message]);

  // Determine read_at and receiver for 1:1 direct chat
  const effectiveReadAt = readAt !== undefined ? readAt : message?.read_at;
  const effectiveReceiver = receiver || (chat ? { name: chat.name, avatar: chat.avatar } : undefined);

  useEffect(() => {
    if (!isOpen || !effectiveMsgId) {
      setSeenBy([]);
      setLoading(false);
      return;
    }

    if (!isMe) {
      // For other member's message: simply show sender user in the list with their sent time
      const isSenderBlocked = Boolean(
        (message?.senderId && isBlocked(message.senderId)) ||
        message?.isBlocked
      );
      setSeenBy([
        {
          user_id: message?.senderId || "sender",
          full_name: isSenderBlocked ? "Unknown user" : senderName,
          avatar_url: isSenderBlocked ? "" : (senderAvatar || ""),
          read_at: sentRawTime || "",
        },
      ]);
      setLoading(false);
      return;
    }

    if (effectiveIsGroup && effectiveGroupId) {
      setLoading(true);
      getMessageReadReceipts(effectiveGroupId, effectiveMsgId)
        .then((data: any) => {
          const list: SeenByUser[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : [];
          // Filter out current user if present so sender is not in read list
          const filtered = list.filter((u) => !currentUserId || String(u.user_id) !== String(currentUserId));
          setSeenBy(filtered);
        })
        .catch((err) => {
          console.error("Failed to fetch group read receipts:", err);
          setSeenBy([]);
        })
        .finally(() => setLoading(false));
    } else {
      // 1:1 Direct Chat
      if (effectiveReadAt && effectiveReceiver) {
        setSeenBy([
          {
            user_id: "other",
            full_name: effectiveReceiver.name,
            avatar_url: effectiveReceiver.avatar || "",
            read_at: effectiveReadAt,
          },
        ]);
      } else {
        setSeenBy([]);
      }
      setLoading(false);
    }
  }, [isOpen, effectiveMsgId, effectiveIsGroup, effectiveGroupId, effectiveReadAt, effectiveReceiver, currentUserId, isMe, senderName, senderAvatar, sentRawTime, message?.senderId]);

  // Keyboard escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const previewText = useMemo(() => {
    if (hasSharedPost) return "Post";
    if (hasMedia) {
      if (message?.media && message.media.length > 0) {
        const first = message.media[0] as any;
        return first.name || first.filename || (first.type === "image" ? "Photo" : first.type === "video" ? "Video" : first.type === "document" ? "Document" : "Attachment");
      }
      return "Attachment";
    }
    if (hasSharedProfile) return "Profile";
    if (hasSharedJob) return "Job";

    const text = messageContent || message?.text || message?.text_content || "";
    if (!text) return "Message";
    return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, (_, name) => (name.startsWith("@") ? name : `@${name}`));
  }, [hasSharedPost, hasMedia, hasSharedProfile, hasSharedJob, message, messageContent]);

  const isSeen = useMemo(() => {
    if (effectiveIsGroup) {
      return seenBy.length > 0;
    }
    return Boolean(effectiveReadAt);
  }, [effectiveIsGroup, seenBy.length, effectiveReadAt]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* info pop up box: 400px x 320px, padding: 12px, border-radius: 16px, background: #030303 / var(--ds-bg) */}
      <div
        className="w-[400px] max-w-[calc(100vw-32px)] h-[320px] bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-[16px] p-3 flex flex-col items-center relative box-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Frame 2609536: Header row with cancel cross icon (376px x 20px) */}
        <div className="w-full max-w-[376px] h-5 flex flex-row justify-end items-center gap-2.5 shrink-0">
          <button
            onClick={onClose}
            aria-label="Close message info"
            className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors focus:outline-none p-0 bg-transparent border-none cursor-pointer"
          >
            <CancelIcon size={20} className="w-5 h-5" />
          </button>
        </div>

        {/* Frame 2608581: Main body (376px x 276px, gap: 12px) */}
        <div className="w-full max-w-[376px] h-[276px] flex flex-col items-center gap-3 shrink-0 overflow-hidden">
          {/* Message info title (height: 24px) */}
          <h2 className="w-auto h-6 font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center text-[var(--ds-text-primary)] select-none shrink-0 m-0 p-0">
            Message info
          </h2>

          {/* Frame 2610041: Message preview row (height: 48px, gap: 2px, align-items: flex-end) */}
          <div className="w-full max-w-[376px] h-12 flex flex-col justify-center items-end gap-0.5 shrink-0">
            {/* Frame 2610036: Bubble (max-w-[313px], min-h-[34px], padding: 8px 12px) */}
            <div className="box-border flex flex-row justify-center items-center px-3 py-2 gap-2.5 max-w-[313px] min-h-[34px] border border-[var(--ds-border)] rounded-[16px] bg-transparent">
              <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-center text-[var(--ds-text-primary)] truncate max-w-[287px]">
                {previewText}
              </span>
            </div>

            {/* Frame 2610069: Status row (height: 12px, Seen / Delivered) */}
            <div className="flex flex-row justify-center items-center gap-2 h-3">
              <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-text-secondary)]">
                {isSeen ? "Seen" : "Delivered"}
              </span>
            </div>
          </div>

          {/* List of members (gap: 12px, scrollable, custom-scrollbar hidden) */}
          <div className="w-full max-w-[376px] flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-0.5">
            {loading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--ds-accent)]" />
              </div>
            ) : seenBy.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-[var(--ds-text-muted)] font-['DM_Sans'] text-xs">
                Not read by anyone yet
              </div>
            ) : (
              seenBy.map((user) => {
                const isUserBlocked = Boolean(
                  (user.user_id && isBlocked(user.user_id)) ||
                  user.full_name?.toLowerCase() === "unknown user"
                );
                const displayName = isUserBlocked ? "Unknown user" : user.full_name;
                const displayAvatar = isUserBlocked ? undefined : user.avatar_url;

                return (
                  <div
                    key={user.user_id}
                    className="w-full max-w-[376px] h-[52px] flex flex-row items-center py-2 px-0 gap-2.5 shrink-0"
                  >
                    {/* Rectangle 82: Avatar 32x32 */}
                    <Avatar
                      url={displayAvatar}
                      name={displayName}
                      size="sm"
                      isUnknown={isUserBlocked}
                      className="w-8 h-8 rounded-full shrink-0"
                    />

                    {/* Frame 2609904: Text column (h: 36px) */}
                    <div className="flex flex-col items-start min-w-0 flex-1 h-9 justify-center">
                      <span className="font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-[var(--ds-text-primary)] truncate max-w-full">
                        {displayName}
                      </span>
                      <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-text-secondary)]">
                        {formatExactMessageTime(user.read_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
