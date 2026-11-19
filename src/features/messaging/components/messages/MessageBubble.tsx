"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@/types/messaging";
import { MessageBubbleProps } from "../../types";
import {
  SmileIcon,
  MenuIcon,
  CopyIcon,
  InfoIcon,
  EditIcon,
  DeleteIcon,
  RetryIcon,
  PinIcon,
  CheckboxCheckIcon,
  UserIcon,
  BusinessBuildingIcon,
} from "@/components/icons";
import { isMessagePinned } from "../../utils/pinMessageUtils";
import { cn } from "@/lib/utils";
import Avatar from "@/components/shared/Avatar";
import RepliedMessageBox from "../RepliedMessageBox";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { ReactionListPopup } from "../ReactionListPopup";
import { createPortal } from "react-dom";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useSession } from "next-auth/react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import UnavailableContentCard from "../ui/UnavailableContentCard";
import { EntityPreviewCard } from "../../EntityPreviewCard";
import { Icon } from "@iconify/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  CustomReplyIcon,
  CopyButton,
  hasMessageMedia,
} from "./MessageActions";
import { JobApplicationContextCard } from "./SharedJobMessage";
import { SharedProfileCard } from "./SharedProfileMessage";
import { SharedPostCard } from "./SharedPostMessage";
import { MessageMedia, isDocumentType } from "./MediaMessage";
import { MessageText } from "./TextMessage";
import { useSocial } from "@/context/SocialContext";

const SeenAvatar: React.FC<{
  member: { user_id?: string; full_name?: string; avatar_url?: string; avatar?: string; is_company?: boolean };
  isBlockedUser?: boolean;
}> = ({ member, isBlockedUser }) => {
  const [hasError, setHasError] = useState(false);
  const avatarUrl = member.avatar_url || member.avatar;
  const isCompany = Boolean(member.is_company);
  const hasAvatar = Boolean(!isBlockedUser && avatarUrl && avatarUrl !== "/assets/pngegg.png" && !hasError);

  if (hasAvatar) {
    return (
      <img
        src={avatarUrl}
        alt={isBlockedUser ? "Unknown user" : (member.full_name || "member")}
        className="w-[16px] h-[16px] rounded-full border border-[var(--ds-bg,#030303)] object-cover shrink-0 select-none flex-none"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="w-[16px] h-[16px] rounded-full border border-[var(--ds-bg,#030303)] bg-[var(--ds-surface-1,#1A1A20)] text-[var(--ds-text-secondary)] flex items-center justify-center shrink-0 select-none flex-none">
      {isCompany ? (
        <BusinessBuildingIcon className="w-[10px] h-[10px] text-current" />
      ) : (
        <UserIcon className="w-[10px] h-[10px] text-current" />
      )}
    </div>
  );
};

export function MessageBubble(props: MessageBubbleProps) {
  const router = useRouter();
  const { isBlocked } = useSocial();
  const { theme, resolvedTheme } = useTheme();
  const isDarkTheme =
    resolvedTheme === "dark" || theme === "dark";

  const {
    message,
    onAction,
    isEditing,
    onSaveEdit,
    onCancelEdit,
    isSelected,
    hasSelection = false,
    onMessageClick,
    showSenderName,
    isGroup,
    showAvatar,
    showTime = true,
    isOpponentOnline = false,
    isRequesting = false,
    onMediaClick,
    onMediaLoad,
    onReply,
    onReplyClick,
    isHighlighted,
    onReaction,
    currentUserId,
    conversationId,
    otherUserType,
    otherUserSlug,
    chatAvatar,
    statusLabel,
    isPinned: isPinnedProp,
    groupMembers,
  } = props;

  const { activeProfile } = useActiveProfile();
  const isPinned =
    isPinnedProp !== undefined
      ? isPinnedProp
      : isMessagePinned(conversationId, message.id, activeProfile?.type, activeProfile?.id);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const cachedOriginalMsg = useMemo(() => {
    if (!message.repliedMessage?.messageId) return null;
    const queries = queryClient.getQueriesData<InfiniteData<Message[]>>({
      queryKey: ["messages"],
    });
    for (const [, queryData] of queries) {
      if (queryData?.pages) {
        for (const page of queryData.pages) {
          const found = page.find((m) => m.id === message.repliedMessage!.messageId);
          if (found) return found;
        }
      }
    }
    return null;
  }, [message.repliedMessage?.messageId, queryClient]);
  const isMe = message.sender === "me";
  const isDeletedForEveryone = Boolean(message.is_deleted_for_everyone);
  const isDeletedForMe = Boolean(message.is_deleted_for_me && !isDeletedForEveryone);
  const isDeleted = isDeletedForEveryone || isDeletedForMe;
  const deletedBoxWidth = isDeletedForMe ? "w-[178px]" : "w-[202px]";
  const deletedTextWidth = isDeletedForMe ? "w-[160px]" : "w-[184px]";
  const resolvedShowAvatar = Boolean(isGroup && (showAvatar !== undefined ? showAvatar : !isMe));
  const hasMedia = hasMessageMedia(message);
  const isSelectionMode = Boolean(hasSelection || isSelected);

  const isSenderBlocked = Boolean(
    (message.senderId && isBlocked(message.senderId)) ||
    message.isBlocked === true ||
    message.isBlockedByOther === true ||
    (message as any).is_blocked_by_other === true
  );

  const isUnknownSender = Boolean(
    isSenderBlocked ||
    (message as any).is_deactivated === true ||
    (message as any).is_deleted_user === true ||
    message.senderName === "Unknown Page" ||
    message.senderName === "Unknown user" ||
    message.senderName === "Unknown User" ||
    message.senderName === "Deleted Page" ||
    message.senderName === "Deleted User" ||
    (message as any).sender_org_headline === "This page has been deactivated" ||
    (message as any).sender_org_headline === "User unavailable"
  );

  // Group chat seen members resolution (only active when isGroup === true and message is sent by me)
  const seenMembers: { user_id?: string; full_name?: string; avatar_url?: string; avatar?: string; is_company?: boolean }[] = useMemo(() => {
    if (!isMe || !isGroup || message.is_deleted_for_everyone || message.is_deleted_for_me) return [];

    // 1. Direct real-time / backend seen_by list
    if (message.seen_by && message.seen_by.length > 0) {
      return message.seen_by;
    }

    // 2. Fallback when seen_count > 0 but seen_by array hasn't been populated
    if (
      message.seen_count &&
      message.seen_count > 0 &&
      groupMembers &&
      groupMembers.length > 0
    ) {
      const senderId = message.senderId || (message as any).sender_id;
      return groupMembers
        .filter((m: any) => String(m.user_id) !== String(senderId))
        .slice(0, message.seen_count)
        .map((m: any) => ({
          user_id: m.user_id,
          full_name: m.full_name || m.name,
          avatar_url: m.avatar_url || m.avatar,
        }));
    }

    return [];
  }, [isMe, isGroup, message.is_deleted_for_everyone, message.is_deleted_for_me, message.seen_by, message.seen_count, message.senderId, groupMembers]);

  const effectiveSeenCount = useMemo(() => {
    if (!isMe || !isGroup) return 0;
    return Math.max(message.seen_count || 0, seenMembers.length);
  }, [isMe, isGroup, message.seen_count, seenMembers.length]);

  // Helper to determine if message is media-only
  const isMediaOnly =
    (message.media &&
      message.media.length > 0 &&
      !message.is_deleted_for_everyone &&
      !message.is_deleted_for_me &&
      (() => {
        const text = message.text || message.text_content;
        const isDefaultMediaText = [
          "Sent a photo",
          "Sent a video",
          "Sent a document",
          "Attachment",
          "Sent an attachment",
        ].includes(text?.trim() || "");
        return !text || isDefaultMediaText;
      })()) ||
    false;

  const hasMediaAndText = Boolean(
    message.media &&
    message.media.length > 0 &&
    !message.is_deleted_for_everyone &&
    !message.is_deleted_for_me &&
    !isMediaOnly &&
    (() => {
      const text = message.text || message.text_content || "";
      const isDefaultMediaText = [
        "Sent a photo",
        "Sent a video",
        "Sent a document",
        "Attachment",
        "Sent an attachment",
      ].includes(text.trim());
      return text.trim().length > 0 && !isDefaultMediaText;
    })()
  );

  const isMultipleDocMessage = useMemo(() => {
    if (!message.media || message.media.length <= 1) return false;
    return message.media.filter((item) => isDocumentType(item)).length > 1;
  }, [message.media]);

  const isMultipleVisualMedia = useMemo(() => {
    if (!message.media || message.media.length < 2) return false;
    return message.media.filter((item) => !isDocumentType(item)).length >= 2;
  }, [message.media]);

  // Helper to determine if message contains a shared post
  const initialPost = message.sharedPost || (message as any).shared_post;
  const rawEntityType = message.entityType || (message as any).entity_type;
  const rawEntityId = message.entityId || (message as any).entity_id;
  const isPostEntity = rawEntityType === 'post' || rawEntityType === 'article';
  const textContent = message.text || message.text_content || "";
  const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:posts?))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i;
  const extractedPostId = textContent.match(postUrlRegex)?.[1];

  const hasPost = Boolean(
    initialPost ||
    initialPost?.id ||
    initialPost?.post_id ||
    initialPost?._id ||
    message.sharedPostId ||
    (message as any).shared_post_id ||
    (isPostEntity && rawEntityId) ||
    extractedPostId
  );

  // Helper to determine if message is card-only (contains a shared card and no other text)
  const isCardOnly = (() => {
    if (message.is_deleted_for_everyone || message.is_deleted_for_me) return false;

    const profileUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/profile\/([a-zA-Z0-9_.-]+)/i;
    const extractedProfileId = textContent.match(profileUrlRegex)?.[1];

    const orgUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:organization|company)\/([a-zA-Z0-9_-]+)/i;
    const extractedOrgId = textContent.match(orgUrlRegex)?.[1];

    const channelUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/channels\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/i;
    const extractedChannelId = textContent.match(channelUrlRegex)?.[1];

    const jobUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/jobs\/([a-zA-Z0-9_-]+)/i;
    const extractedJobId = textContent.match(jobUrlRegex)?.[1];

    const finalProfileId = message.sharedProfileId || ((message.entityType === 'profile' || message.entityType === 'company') ? message.entityId : null) || extractedProfileId || extractedOrgId;
    const hasProfile = Boolean(finalProfileId) && !hasPost;

    const fallbackChannelId = !message.sharedProfileId && !hasPost && !extractedProfileId && !extractedOrgId ? extractedChannelId : null;
    const hasChannel = Boolean(fallbackChannelId || ((message.entityType === 'channel' || message.entityType === 'community') && message.entityId));

    const isJobEntity = message.entityType === "job" || message.entityType === "offer";
    const finalJobId = (isJobEntity && message.entityId) || (!hasPost && !hasProfile && !hasChannel ? extractedJobId : null);
    const hasJob = Boolean(finalJobId);

    const hasCard = hasPost || hasProfile || hasChannel || hasJob;
    if (!hasCard) return false;

    const text = textContent.trim().toLowerCase().replace(/[.\s]+$/, "");
    const entityUrlRegex = /^(?:https?:\/\/[^\/\s]+)?\/(?:profile|organization|post|posts|article|channels|jobs|offer)\/[a-zA-Z0-9_\.\-\/]+(?:\?[^\s]*)?$/i;
    const isJustUrl = entityUrlRegex.test(textContent.trim()) || /^https?:\/\/[^\s]+$/i.test(textContent.trim());

    const isDefaultCardText = [
      "",
      "shared a post",
      "shared a profile",
      "shared a job",
      "shared an article",
      "shared a channel",
      "shared a video",
      "shared content",
    ].includes(text);

    return isDefaultCardText || isJustUrl;
  })();

  // Helper to determine if message is editable (authored by me, not media/card only, and within 15 minutes of sending)
  const isEditable = (() => {
    if (!isMe || isMediaOnly || isCardOnly) return false;
    const createdAtStr = message.created_at || (message as any).createdAt || (message as any).timestamp;
    if (!createdAtStr) return true; // Newly sent / optimistic
    const createdAtTime = new Date(createdAtStr).getTime();
    if (isNaN(createdAtTime)) return true;
    const diffMinutes = (Date.now() - createdAtTime) / (1000 * 60);
    return diffMinutes <= 15;
  })();

  const isCompanyProfile = activeProfile?.type === "COMPANY";

  const isBubbleUnavailable = !isGroup && message.is_unavailable;

  // Helper for dynamic classes
  const getBubbleClasses = () => {
    if (isBubbleUnavailable) {
      return "bg-transparent border-none shadow-none";
    }
    if (isDeleted) {
      return `${deletedBoxWidth} h-[30px] min-h-[30px] rounded-[16px] bg-transparent text-[var(--ds-text-muted)] border border-[var(--ds-border)] shadow-none`;
    }

    // Figma Frame 2610069: Failed outgoing message bubble has red border (#E5484D / var(--ds-error)) and rounded 16px
    if (message.status === 'failed') {
      return "rounded-[16px] border border-[var(--ds-error)] bg-transparent text-[var(--ds-text-primary)]";
    }

    // Figma Frame 2610040: Multi-doc messages (with or without context) use outline bubble
    if (isMultipleDocMessage) {
      return "rounded-[16px] border border-[var(--ds-border)] bg-transparent text-[var(--ds-text-primary)]";
    }

    // Standard outline message styling matching Figma Frame 2610036 (rounded-16px, border 1px var(--ds-border))
    const baseClasses = "rounded-[16px] border border-[var(--ds-border)] bg-transparent text-[var(--ds-text-primary)]";
    const mediaOnlyClasses = "bg-transparent rounded-[16px] shadow-none border-none";

    return isMediaOnly || isCardOnly || hasPost || hasMediaAndText
      ? mediaOnlyClasses
      : baseClasses;
  };

  const paddingClasses = isBubbleUnavailable
    ? "p-0 overflow-hidden"
    : message.is_deleted_for_everyone || message.is_deleted_for_me
      ? "p-2"
      : message.status === 'failed'
        ? "p-2" // Figma Frame 2610069: padding 8px (p-2) for failed message box
        : isMultipleDocMessage
          ? "p-2" // Figma Frame 2610040: padding 8px (p-2) for multi-doc message box
          : hasMediaAndText || (message.media && message.media.length > 1)
            ? "p-0 overflow-visible"
            : (message.media && message.media.length === 1) || isCardOnly || hasPost
              ? "p-0 overflow-hidden"
              : "px-3 py-2";

  // Long press mobile detection
  const [showMobileActions, setShowMobileActions] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [reactionListOpen, setReactionListOpen] = useState(false);
  const [reactionPopupPos, setReactionPopupPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<"main" | "delete">("main");
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    onAction?.("copy", message);
    setIsCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onReply) {
      onReply(message);
    } else {
      onAction?.("reply", message);
    }
  };

  const handleDeleteClick = (e?: React.MouseEvent | Event) => {
    e?.preventDefault();
    e?.stopPropagation();
    setMenuView("delete");
  };

  const renderMessageDropdownContent = (align: "start" | "end") => (
    <DropdownMenuContent
      align={align}
      sideOffset={6}
      className={cn(
        "box-border flex flex-col items-start p-3 gap-3.5 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg shadow-lg z-[200] outline-none",
        menuView === "delete" ? "min-w-[190px]" : "min-w-[170px]"
      )}
    >
      {menuView === "delete" ? (
        <>
          {isMe && (
            <DropdownMenuItem
              onSelect={() => {
                onAction?.("delete_for_everyone", message);
                setIsMenuOpen(false);
                setMenuView("main");
              }}
              className="w-full flex items-center justify-between py-1 px-1.5 font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-opacity !text-[var(--ds-error)] hover:!text-[var(--ds-error)] focus:!text-[var(--ds-error)] data-[highlighted]:!text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:opacity-80"
            >
              <span className="!text-[var(--ds-error)]">Delete for everyone</span>
              <DeleteIcon className="w-[18px] h-[18px] text-[var(--ds-error)]" fill="var(--ds-error)" size={18} />
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onSelect={() => {
              onAction?.("delete_for_me", message);
              setIsMenuOpen(false);
              setMenuView("main");
            }}
            className="w-full flex items-center justify-between py-1 px-1.5 font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-opacity !text-[var(--ds-error)] hover:!text-[var(--ds-error)] focus:!text-[var(--ds-error)] data-[highlighted]:!text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:opacity-80"
          >
            <span className="!text-[var(--ds-error)]">Delete for me</span>
            <DeleteIcon className="w-[18px] h-[18px] text-[var(--ds-error)]" fill="var(--ds-error)" size={18} />
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setMenuView("main");
            }}
            className="w-full flex items-center justify-between py-1 px-1.5 font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)]"
          >
            <span>Cancel</span>
          </DropdownMenuItem>
        </>
      ) : (
        <>
          <DropdownMenuItem
            onClick={() => {
              onAction?.(isPinned ? "unpin" : "pin", message);
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center justify-between py-1 px-1.5 font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)]"
          >
            <span>{isPinned ? "Unpin" : "Pin"}</span>
            <Icon icon="fluent:pin-16-regular" width={18} height={18} />
          </DropdownMenuItem>

          {isEditable && (
            <DropdownMenuItem
              onClick={() => onAction?.("edit", message)}
              className="w-full flex items-center justify-between py-1 px-1.5 font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)]"
            >
              <span>Edit</span>
              <Icon icon="fluent:edit-16-regular" width={18} height={18} />
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onSelect={handleDeleteClick}
            className="w-full flex items-center justify-between py-1 px-1.5 font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-opacity !text-[var(--ds-error)] hover:!text-[var(--ds-error)] focus:!text-[var(--ds-error)] data-[highlighted]:!text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:opacity-80"
          >
            <span className="!text-[var(--ds-error)]">Delete</span>
            <DeleteIcon className="w-[18px] h-[18px] text-[var(--ds-error)]" fill="var(--ds-error)" size={18} />
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onAction?.("info", message)}
            className="w-full flex items-center justify-between py-1 px-1.5 font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)]"
          >
            <span>Info</span>
            <Icon icon="fluent:info-16-regular" width={18} height={18} />
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );

  const handleReactionBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (reactionListOpen) {
      setReactionListOpen(false);
      setReactionPopupPos(null);
      return;
    }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const popupW = 250;
    const numReactions =
      message.reactions?.filter((r) => r.emoji && r.emoji !== "").length || 0;
    const visibleCount = Math.min(numReactions, 4);
    // Base 60px (padding 24px + header 24px + gap 12px) + list height for up to 4 items
    const estimatedH = 60 + (visibleCount > 0 ? visibleCount * 24 + (visibleCount - 1) * 8 : 24);

    let top = rect.bottom + 8;

    if (top + estimatedH > window.innerHeight - 16) {
      top = rect.top - estimatedH - 8;
      if (top < 12) top = 12;
    }

    // Anchor: on sent messages align right side of popup with badge, on received messages align left
    let left = isMe ? rect.right - popupW : rect.left;
    if (left + popupW > window.innerWidth - 16) {
      left = window.innerWidth - popupW - 16;
    }
    if (left < 16) {
      left = 16;
    }

    setReactionPopupPos({ top, left });
    setReactionListOpen(true);
  };

  const handleEmojiButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      setPickerPos(null);
      return;
    }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const pickerH = 340;
    const pickerW = 310;

    let top = rect.bottom + 8;

    if (top + pickerH > window.innerHeight - 10) {
      top = rect.top - pickerH - 8;
      if (top < 10) {
        top = 10;
      }
    }

    let left = isMe ? rect.right - pickerW : rect.left;
    if (left < 10) left = 10;
    if (left + pickerW > window.innerWidth - 10)
      left = window.innerWidth - pickerW - 10;

    setPickerPos({ top, left });
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData, event?: MouseEvent | React.MouseEvent) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    setShowEmojiPicker(false);
    setPickerPos(null);
    onReaction?.(message, emojiData.emoji);
  };

  // Close picker on ESC
  useEffect(() => {
    if (!showEmojiPicker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEmojiPicker(false);
        setPickerPos(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showEmojiPicker]);

  const handleTouchStart = () => {
    if (message.is_deleted_for_everyone || message.is_deleted_for_me) return;
    pressTimer.current = setTimeout(() => {
      setShowMobileActions(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleMobileAction = (action: string) => {
    onAction?.(action, message);
    setShowMobileActions(false);
  };

  // Compute reaction badge data
  const validReactions = (
    message.is_deleted_for_everyone || message.is_deleted_for_me
      ? []
      : message.reactions || []
  ).filter((r) => r.emoji && r.emoji !== "");

  // Group reactions by emoji to match Figma Frame 2608770 specification
  const reactionGroups = useMemo<{ emoji: string; count: number }[]>(() => {
    const map = new Map<string, number>();
    for (const r of validReactions) {
      if (r.emoji) {
        map.set(r.emoji, (map.get(r.emoji) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
  }, [validReactions]);

  // Render reaction badge (Figma Frame 2608770) with dynamic positioning:
  // - On context text bubble: attached to text bubble corner (isMe ? left-[2px] : right-[2px])
  // - On multiple visual media without text: centered under front card (left-1/2 -translate-x-1/2 -bottom-[16px])
  // - Standard bubble: (isMe ? left-[2px] : right-[2px])
  const renderReactionBadge = (positionOverride?: string) => {
    if (
      message.is_deleted_for_everyone ||
      message.is_deleted_for_me ||
      validReactions.length === 0 ||
      reactionGroups.length === 0
    ) {
      return null;
    }

    const positionClass =
      positionOverride ||
      (isMultipleVisualMedia && !hasMediaAndText
        ? (isMe ? "left-[28px] -bottom-[16px]" : "right-[28px] -bottom-[16px]")
        : isMe
          ? "left-[2px] -bottom-[16px]"
          : "right-[2px] -bottom-[16px]");

    return (
      <button
        type="button"
        onClick={handleReactionBadgeClick}
        className={cn(
          "absolute flex flex-row items-center justify-center gap-1 px-1 h-6 bg-[var(--ds-bg,#030303)] border border-[var(--ds-border)] rounded-[24px] shadow-sm cursor-pointer hover:scale-105 transition-all z-30 box-border min-w-[40px]",
          positionClass,
        )}
        style={{
          boxSizing: "border-box",
        }}
        title={validReactions.map((r) => `${r.full_name || 'User'}: ${r.emoji}`).join(', ')}
      >
        {reactionGroups.length === 1 ? (
          <>
            <span className="w-4 h-6 text-base leading-6 flex items-center justify-center select-none shrink-0 font-['Poppins']">
              {reactionGroups[0].emoji}
            </span>
            {reactionGroups[0].count > 1 && (
              <span className="min-w-[7px] h-4 font-['DM_Sans'] font-normal text-xs leading-4 flex items-center justify-center text-[var(--ds-text-primary)] shrink-0 pr-0.5">
                {reactionGroups[0].count}
              </span>
            )}
          </>
        ) : (
          <>
            {reactionGroups.slice(0, 2).map((group, idx) => (
              <span
                key={group.emoji || idx}
                className="w-4 h-6 text-base leading-6 flex items-center justify-center select-none shrink-0 font-['Poppins']"
              >
                {group.emoji}
              </span>
            ))}
            {validReactions.length > 2 && (
              <span className="min-w-[7px] h-4 font-['DM_Sans'] font-normal text-xs leading-4 flex items-center justify-center text-[var(--ds-text-primary)] shrink-0 pr-0.5">
                {validReactions.length}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  // Dynamic spacing:
  // - Same sender sequence (!isLastInGroup): 4px normal gap, or 20px if reactions (16px reaction overhang + 4px gap)
  // - Different sender switch (isLastInGroup): 12px normal gap, or 28px if reactions (16px reaction overhang + 12px gap)
  const isLastInGroup = (message as any).isLastInGroup ?? true;
  const hasReactions = validReactions.length > 0;
  const marginBottomClass = hasReactions
    ? (isLastInGroup ? "mb-[28px]" : "mb-[20px]")
    : (isLastInGroup ? "mb-[12px]" : "mb-[4px]");

  return (
    <>
      {showMobileActions && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity"
          onClick={() => setShowMobileActions(false)}
        />
      )}
      <div
        id={`message-${message.id}`}
        className={cn(
          "flex w-full group transition-colors relative py-0",
          marginBottomClass,
          isMe ? "justify-end" : "justify-start",
          message.is_deleted_for_everyone || message.is_deleted_for_me
            ? "cursor-default"
            : "",
          isHighlighted ? "duration-300 rounded-[16px]" : "duration-1000",
        )}
        style={{
          backgroundColor:
            isHighlighted ? "var(--ds-surface-1)" : "transparent",
        }}
        onClick={() =>
          !message.is_deleted_for_everyone &&
          !message.is_deleted_for_me &&
          onMessageClick?.(message)
        }
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className={cn(
            "flex flex-col relative w-full",
            // Figma Frame 2610100: Outer column uses gap: 2px (gap-[2px]) and items-end when message failed
            isMe && message.status === 'failed'
              ? "items-end gap-[2px]"
              : isMe
                ? "items-end gap-[4px]"
                : "items-start gap-[4px]",
          )}
        >
          {/* Sender name for sent messages (isMe) */}
          {isMe &&
            (message.isFirstInGroup ?? true) &&
            (isCompanyProfile || isGroup) && (
              <div className="pr-[4px] w-full flex justify-end">
                <span className="font-['DM_Sans'] font-medium text-xs leading-4 text-[var(--ds-text-primary)] truncate block max-w-[70%] md:max-w-[85%]">
                  {isCompanyProfile
                    ? message.senderMemberName || "Member"
                    : message.senderName}
                </span>
              </div>
            )}

          {/* Sender name for group/received messages */}
          {showSenderName && !isMe && (message.senderName || isUnknownSender) && (
            <div className="pl-[32px] w-full">
              <span
                className="font-['DM_Sans'] font-semibold text-[11px] leading-[14px] text-[var(--ds-text-primary)] truncate block max-w-[70%] md:max-w-[85%] cursor-pointer"
                onClick={(e) => {
                  if (message.senderId || otherUserSlug) {
                    e.stopPropagation();
                    const returnTo =
                      typeof window !== "undefined"
                        ? window.location.pathname + window.location.search
                        : "/messaging";
                    const targetRoute =
                      otherUserType === "COMPANY"
                        ? `/organization/${otherUserSlug || message.senderId}`
                        : `/profile/${message.senderId}`;
                    router.push(
                      `${targetRoute}?returnTo=${encodeURIComponent(returnTo)}`,
                    );
                  }
                }}
              >
                {isUnknownSender ? "Unknown user" : message.senderName}
              </span>
            </div>
          )}

          {/* ROW 1: Bubble — avatar placed next to it if !isMe */}
          <div
            className={cn(
              "flex w-full group/message items-center",
              isMe ? (isSelected ? "justify-between" : "justify-end") : "justify-start",
            )}
          >
            {isSelected && (
              <div
                className={cn(
                  "w-6 h-6 rounded-[4px] bg-[var(--ds-accent)] flex items-center justify-center shrink-0 select-none cursor-pointer",
                  isMe ? "mr-auto" : "mr-[10px]"
                )}
                style={{ padding: "5px 4px 6px" }}
              >
                <CheckboxCheckIcon className="w-[14px] h-[11px] text-[var(--ds-bg,#030303)] shrink-0" fill="var(--ds-bg, #030303)" />
              </div>
            )}
            {isGroup && !isMe && (
              <div
                className={cn(
                  "w-[24px] h-[24px] shrink-0 mr-[8px] self-center",
                  resolvedShowAvatar &&
                    (message.senderId || otherUserSlug) &&
                    "cursor-pointer",
                )}
                onClick={(e) => {
                  if (
                    resolvedShowAvatar &&
                    (message.senderId || otherUserSlug)
                  ) {
                    e.stopPropagation();
                    const returnTo =
                      typeof window !== "undefined"
                        ? window.location.pathname + window.location.search
                        : "/messaging";
                    const targetRoute =
                      otherUserType === "COMPANY"
                        ? `/organization/${otherUserSlug || message.senderId}`
                        : `/profile/${message.senderId}`;
                    router.push(
                      `${targetRoute}?returnTo=${encodeURIComponent(returnTo)}`,
                    );
                  }
                }}
              >
                {resolvedShowAvatar ? (
                  (() => {
                    const normalizedUserType = (
                      otherUserType ||
                      (message as any).sender_type ||
                      ""
                    ).toUpperCase();
                    const isOrgConv =
                      otherUserType === "COMPANY" ||
                      normalizedUserType === "COMPANY" ||
                      normalizedUserType === "ORGANIZATION" ||
                      normalizedUserType === "INSTITUTION";

                    const effectiveAvatar = isUnknownSender
                      ? null
                      : isMe
                      ? (activeProfile as any)?.avatar ||
                        (activeProfile as any)?.avatar_url ||
                        (session?.user as any)?.image ||
                        message.senderAvatar
                      : (!isGroup && chatAvatar)
                      ? chatAvatar
                      : message.senderAvatar || chatAvatar;

                    const effectiveName = isUnknownSender
                      ? (isOrgConv ? "Unknown Page" : "Unknown User")
                      : message.senderName || (isOrgConv ? "Organization" : "User");

                    return (
                      <Avatar
                        url={effectiveAvatar}
                        name={effectiveName}
                        size="xs"
                        isCompany={isOrgConv}
                        isUnknown={isUnknownSender}
                        className="w-6 h-6"
                      />
                    );
                  })()
                ) : (
                  <div className="w-[24px] h-[24px]" />
                )}
              </div>
            )}
            {/* Action Icons for isMe: Copy, Reply, Smile emoji, and horizontal 3 dots */}
            {isMe &&
              !message.is_deleted_for_everyone &&
              !message.is_deleted_for_me &&
              message.status !== 'failed' &&
              !isSelectionMode && (
                <div
                  className={cn(
                    "flex flex-row items-center gap-2 h-5 bg-transparent transition-opacity shrink-0 z-20 relative mr-2 hidden md:flex",
                    isMenuOpen ? "opacity-100" : "opacity-0 group-hover/message:opacity-100",
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {(!isMediaOnly || message.text || message.text_content) && (
                    <CopyButton
                      isCopied={isCopied}
                      onClick={handleCopyClick}
                      className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80"
                    />
                  )}
                  <button
                    type="button"
                    className="text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity p-0 z-50 relative cursor-pointer flex items-center justify-center outline-none"
                    onClick={handleReplyClick}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    title="Reply"
                    aria-label="Reply"
                  >
                    <CustomReplyIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity p-0 z-50 relative cursor-pointer flex items-center justify-center outline-none"
                    onClick={handleEmojiButtonClick}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    title="Add reaction"
                    aria-label="Add reaction"
                  >
                    <SmileIcon className="w-5 h-5" size={20} />
                  </button>
                  <DropdownMenu
                    open={isMenuOpen}
                    onOpenChange={(open) => {
                      setIsMenuOpen(open);
                      if (!open) setMenuView("main");
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity p-0 z-50 relative cursor-pointer flex items-center justify-center outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        title="More options"
                        aria-label="More options"
                      >
                        <MenuIcon className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    {renderMessageDropdownContent("end")}
                  </DropdownMenu>
                </div>
              )}

            <div
              style={message.repliedMessage?.senderName ? { minWidth: "210px" } : undefined}
              className={cn(
                "relative flex min-w-0",
                // Figma Frame 2610101: Row container with gap: 4px (gap-1) holding message bubble and retry icon
                isMe && message.status === 'failed'
                  ? "flex-row items-center gap-1 max-w-[85%] sm:max-w-[calc(100%-30%)] w-fit"
                  : isDeleted
                    ? deletedBoxWidth
                    : cn(
                        "max-w-[85%] sm:max-w-[calc(100%-30%)] w-fit",
                        message.repliedMessage?.senderName && "min-w-[210px]",
                        isMultipleDocMessage && "max-w-[412px]"
                      ),
              )}
            >
              <div
                style={message.repliedMessage?.senderName ? { minWidth: "210px" } : undefined}
                className={cn(
                  "relative break-words transition-all box-border",
                  isDeleted
                    ? `${deletedBoxWidth} h-[30px] min-h-[30px] flex flex-row items-center justify-center p-2 rounded-[16px] border border-[var(--ds-border)] bg-transparent text-[var(--ds-text-muted)]`
                    : cn(
                        "w-full flex flex-col justify-center min-h-[34px]",
                        message.repliedMessage?.senderName && "min-w-[210px]",
                        // Figma Frame 2610069: text is centered in failed bubble
                        isMe && message.status === 'failed'
                          ? "items-center text-center"
                          : isMe ? "items-end" : "items-start",
                        isMultipleDocMessage && hasMediaAndText && "gap-[10px]",
                        message.repliedMessage && message.repliedMessage.senderName
                          ? "font-['DM_Sans'] font-normal text-[12px] leading-[16px]"
                          : "font-['DM_Sans'] font-normal text-xs leading-4",
                        paddingClasses,
                        getBubbleClasses(),
                      ),
                )}
              >
                {isBubbleUnavailable ? (
                  <UnavailableContentCard isMe={isMe} />
                ) : isDeleted ? (
                  /* Frame 2610036 Text Layer: DM Sans 10px/12px italic text-muted text-center */
                  <span
                    className={cn(
                      "font-['DM_Sans'] italic font-normal text-[10px] leading-[12px] text-center text-[var(--ds-text-muted)] h-[12px] truncate select-none block",
                      deletedTextWidth,
                    )}
                  >
                    {isDeletedForEveryone
                      ? "This message was deleted for everyone"
                      : "This message was deleted for you."}
                  </span>
                ) : (
                  <>
                    {message.repliedMessage &&
                      message.repliedMessage.senderName &&
                      !message.is_deleted_for_everyone &&
                      !message.is_deleted_for_me && (() => {
                        const repliedSenderRaw = message.repliedMessage.senderName;
                        const isRepliedSenderMe =
                          repliedSenderRaw === "You" ||
                          (Boolean(session?.user?.name) &&
                            repliedSenderRaw.trim().toLowerCase() === session?.user?.name?.trim().toLowerCase()) ||
                          (Boolean(activeProfile?.name) &&
                            repliedSenderRaw.trim().toLowerCase() === activeProfile?.name?.trim().toLowerCase());
                        const repliedSenderId = (message.repliedMessage as any).senderId || cachedOriginalMsg?.senderId;
                        const isRepliedSenderBlocked = Boolean(
                          (repliedSenderId && isBlocked(repliedSenderId)) ||
                          repliedSenderRaw?.toLowerCase() === "unknown user"
                        );
                        const resolvedRepliedSenderName = isRepliedSenderMe ? "You" : isRepliedSenderBlocked ? "Unknown user" : repliedSenderRaw;
                        const repliedRawContent = cachedOriginalMsg?.text || cachedOriginalMsg?.text_content || message.repliedMessage.content || "";
                        const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:posts?))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i;
                        const originalUrlMatch = (cachedOriginalMsg?.text || cachedOriginalMsg?.text_content || '')?.match(postUrlRegex);
                        const extractedRepliedPostId =
                          message.repliedMessage.sharedPostId ||
                          (cachedOriginalMsg as any)?.shared_post_id ||
                          cachedOriginalMsg?.sharedPostId ||
                          (cachedOriginalMsg?.entityType === 'post' || cachedOriginalMsg?.entityType === 'article' ? cachedOriginalMsg?.entityId : null) ||
                          (message.repliedMessage.entityType === 'post' || message.repliedMessage.entityType === 'article' ? message.repliedMessage.entityId : null) ||
                          (cachedOriginalMsg?.sharedPost as any)?.id ||
                          (cachedOriginalMsg?.sharedPost as any)?.post_id ||
                          repliedRawContent.match(postUrlRegex)?.[1] ||
                          originalUrlMatch?.[1];
                        const cachedRepliedPost = extractedRepliedPostId ? (queryClient.getQueryData<any>(["repliedPostPreview", extractedRepliedPostId]) || queryClient.getQueryData<any>(["sharedPost", extractedRepliedPostId])) : null;

                        const effectiveSharedProfile = cachedOriginalMsg?.sharedProfile || message.repliedMessage.sharedProfile;
                        const effectiveSharedPost = cachedOriginalMsg?.sharedPost || cachedRepliedPost || message.repliedMessage.sharedPost;
                        const effectivePoll = cachedOriginalMsg?.sharedPost?.poll || (cachedOriginalMsg as any)?.poll || cachedRepliedPost?.poll || (cachedRepliedPost?.post_type === 'poll' ? { question: cachedRepliedPost.content } : null) || message.repliedMessage.poll;
                        const effectiveMediaUrl =
                          cachedOriginalMsg?.media?.[0]?.url ||
                          cachedOriginalMsg?.sharedPost?.media?.[0]?.url ||
                          (cachedOriginalMsg as any)?.shared_post?.media?.[0]?.url ||
                          cachedRepliedPost?.media?.[0]?.url ||
                          message.repliedMessage.mediaUrl;
                        const effectiveMediaType =
                          cachedOriginalMsg?.media?.[0]?.type ||
                          cachedOriginalMsg?.sharedPost?.media?.[0]?.type ||
                          (cachedOriginalMsg as any)?.shared_post?.media?.[0]?.type ||
                          cachedRepliedPost?.media?.[0]?.type ||
                          (effectiveMediaUrl ? 'image' : null) ||
                          message.repliedMessage.mediaType;

                        let effectiveContent = repliedRawContent;
                        if (effectivePoll) {
                          const pollQ =
                            (effectivePoll as any)?.question ||
                            cachedRepliedPost?.content ||
                            cachedOriginalMsg?.sharedPost?.content ||
                            (cachedOriginalMsg?.text && !cachedOriginalMsg.text.startsWith('http') && cachedOriginalMsg.text.trim().toLowerCase() !== 'poll' ? cachedOriginalMsg.text : null);
                          if (pollQ && !pollQ.startsWith('http') && pollQ.trim().toLowerCase() !== 'poll') {
                            effectiveContent = pollQ;
                          }
                        } else if (cachedRepliedPost?.content && repliedRawContent.startsWith('http')) {
                          effectiveContent = cachedRepliedPost.content;
                        } else if (cachedOriginalMsg?.sharedPost?.content && repliedRawContent.startsWith('http')) {
                          effectiveContent = cachedOriginalMsg.sharedPost.content;
                        }

                        return (
                          <RepliedMessageBox
                            senderName={resolvedRepliedSenderName}
                            content={effectiveContent}
                            isDeleted={message.repliedMessage.isDeleted}
                            isSent={isRepliedSenderMe}
                            mediaType={effectiveMediaType}
                            mediaName={message.repliedMessage.mediaName}
                            mediaUrl={effectiveMediaUrl}
                            sharedPostId={extractedRepliedPostId || message.repliedMessage.sharedPostId}
                            sharedProfileId={message.repliedMessage.sharedProfileId}
                            sharedProfileType={message.repliedMessage.sharedProfileType}
                            entityType={message.repliedMessage.entityType}
                            entityId={message.repliedMessage.entityId}
                            isAttachment={message.repliedMessage.isAttachment}
                            sharedProfile={effectiveSharedProfile}
                            sharedPost={effectiveSharedPost}
                            poll={effectivePoll}
                            onClick={() =>
                              onReplyClick?.(message.repliedMessage!.messageId)
                            }
                          />
                        );
                      })()}
                    {!message.is_deleted_for_everyone &&
                      !message.is_deleted_for_me && (() => {
                        const textContent = message.text || message.text_content || "";
                        const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:posts?))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i;
                        const extractedPostId = textContent.match(postUrlRegex)?.[1];

                        const profileUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/profile\/([a-zA-Z0-9_.-]+)/i;
                        const extractedProfileId = textContent.match(profileUrlRegex)?.[1];

                        const orgUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:organization|company)\/([a-zA-Z0-9_-]+)/i;
                        const extractedOrgId = textContent.match(orgUrlRegex)?.[1];

                        const channelUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/channels\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/i;
                        const extractedChannelId = textContent.match(channelUrlRegex)?.[1];

                        const jobUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/jobs\/([a-zA-Z0-9_-]+)/i;
                        const extractedJobId = textContent.match(jobUrlRegex)?.[1];

                        const resolvedHasPost = hasPost;

                        const finalProfileId = message.sharedProfileId || ((message.entityType === 'profile' || message.entityType === 'company') ? message.entityId : null) || extractedProfileId || extractedOrgId;
                        const finalProfileType = message.sharedProfileType || (message.entityType === 'profile' ? 'user' : (message.entityType === 'company' ? 'company' : null)) || (extractedProfileId ? 'user' : (extractedOrgId ? 'company' : null));

                        const fallbackChannelId = !message.sharedProfileId && !resolvedHasPost && !extractedProfileId && !extractedOrgId ? extractedChannelId : null;

                        const isJobEntity = message.entityType === "job" || message.entityType === "offer";
                        const finalJobId = (isJobEntity && message.entityId) || (!resolvedHasPost && !finalProfileId && !fallbackChannelId ? extractedJobId : null);

                        return (
                          <>
                            <SharedPostCard
                              message={message}
                              onMediaLoad={onMediaLoad}
                              isMe={isMe}
                            />
                            {finalProfileId &&
                              finalProfileType &&
                              !resolvedHasPost && (
                                <SharedProfileCard
                                  profileId={finalProfileId}
                                  profileType={finalProfileType}
                                  initialProfile={message.sharedProfile}
                                  isMe={isMe}
                                />
                              )}
                            {fallbackChannelId && (
                              <EntityPreviewCard
                                entityType="channel"
                                entityId={fallbackChannelId}
                                onLoad={onMediaLoad}
                                isMe={isMe}
                              />
                            )}
                            {message.entityType &&
                              message.entityId &&
                              !resolvedHasPost &&
                              !finalProfileId &&
                              !finalJobId &&
                              message.entityType !== "channel" &&
                              message.entityType !== "community" && (
                                <EntityPreviewCard
                                  entityType={message.entityType as any}
                                  entityId={message.entityId}
                                  onLoad={onMediaLoad}
                                  isMe={isMe}
                                />
                              )}
                            {message.entityType &&
                              message.entityId &&
                              (message.entityType === "channel" || message.entityType === "community") && (
                                <EntityPreviewCard
                                  entityType="channel"
                                  entityId={message.entityId}
                                  onLoad={onMediaLoad}
                                  isMe={isMe}
                                />
                              )}
                            {finalJobId && (
                              <div className={cn("w-full", !isCardOnly && "mb-1")}>
                                <JobApplicationContextCard
                                  entityType="job"
                                  entityId={finalJobId}
                                  conversationId={conversationId}
                                  isMe={isMe}
                                  message={message}
                                />
                              </div>
                            )}
                          </>
                        );
                      })()}
                    <MessageMedia
                      message={message}
                      isMediaOnly={isMediaOnly}
                      onMediaClick={onMediaClick}
                      onMediaLoad={onMediaLoad}
                    />
                    {hasMediaAndText ? (
                      isMultipleDocMessage ? (
                        <div
                          className={cn(
                            "w-full font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-primary)] break-words",
                            isMe ? "text-right" : "text-left"
                          )}
                        >
                          <MessageText
                            message={message}
                            isMediaOnly={false}
                            isMe={isMe}
                            conversationId={conversationId}
                          />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "relative rounded-[16px] border border-[var(--ds-border)] bg-transparent text-[var(--ds-text-primary)] w-fit max-w-full min-h-[34px] px-3.5 py-2 mt-2 box-border flex items-center justify-center text-center",
                            hasReactions && "pb-3"
                          )}
                        >
                          <MessageText
                            message={message}
                            isMediaOnly={false}
                            isMe={isMe}
                            conversationId={conversationId}
                          />
                          {renderReactionBadge(isMe ? "left-[2px] -bottom-[16px]" : "right-[2px] -bottom-[16px]")}
                        </div>
                      )
                    ) : (
                      !isMultipleDocMessage && (
                        <MessageText
                          message={message}
                          isMediaOnly={isMediaOnly || isCardOnly}
                          isMe={isMe}
                          conversationId={conversationId}
                        />
                      )
                    )}
                  </>
                )}
              </div>

              {/* Overlapping Reaction Badge (Figma Frame 2608770) - rendered at bubble level when not attached to context text */}
              {!(hasMediaAndText && !isMultipleDocMessage) && renderReactionBadge()}

              {/* Retry Icon button (Figma Frame 2610101 - at right with 4px gap) */}
              {isMe && message.status === 'failed' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.('retry', message);
                  }}
                  aria-label="Retry sending message"
                  title="Retry"
                  className="w-5 h-5 flex items-center justify-center shrink-0 cursor-pointer text-[var(--ds-error)] hover:opacity-80 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded"
                >
                  <RetryIcon className="w-5 h-5 text-[var(--ds-error)]" />
                </button>
              )}
            </div>

            {/* Action Icons for !isMe: Copy, Reply, Smile emoji, and horizontal 3 dots */}
            {!isMe &&
              !message.is_deleted_for_everyone &&
              !message.is_deleted_for_me &&
              !isSelectionMode && (
                <div
                  className={cn(
                    "flex flex-row items-center gap-2 h-5 bg-transparent transition-opacity shrink-0 z-20 relative ml-2 hidden md:flex",
                    isMenuOpen ? "opacity-100" : "opacity-0 group-hover/message:opacity-100",
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {(!isMediaOnly || message.text || message.text_content) && (
                    <CopyButton
                      isCopied={isCopied}
                      onClick={handleCopyClick}
                      className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80"
                    />
                  )}
                  <button
                    type="button"
                    className="text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity p-0 z-50 relative cursor-pointer flex items-center justify-center outline-none"
                    onClick={handleReplyClick}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    title="Reply"
                    aria-label="Reply"
                  >
                    <CustomReplyIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity p-0 z-50 relative cursor-pointer flex items-center justify-center outline-none"
                    onClick={handleEmojiButtonClick}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    title="Add reaction"
                    aria-label="Add reaction"
                  >
                    <SmileIcon className="w-5 h-5" size={20} />
                  </button>
                  <DropdownMenu
                    open={isMenuOpen}
                    onOpenChange={(open) => {
                      setIsMenuOpen(open);
                      if (!open) setMenuView("main");
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity p-0 z-50 relative cursor-pointer flex items-center justify-center outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        title="More options"
                        aria-label="More options"
                      >
                        <MenuIcon className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    {renderMessageDropdownContent("start")}
                  </DropdownMenu>
                </div>
              )}
          </div>

          {/* Frame 2609512: Group Chat Seen Avatars Stack - only on user's own sent messages */}
          {isMe && isGroup && seenMembers.length > 0 && !isDeleted && (
            <div
              className="flex flex-row items-center p-0 h-[16px] shrink-0 select-none cursor-pointer mt-1 -space-x-1 justify-end"
              onClick={(e) => {
                e.stopPropagation();
                onAction?.("info", message);
              }}
              title="View message info"
            >
              {seenMembers.slice(0, 3).map((member: any, idx: number) => {
                const isMemberBlocked = Boolean(member.user_id && isBlocked(member.user_id));
                return (
                  <SeenAvatar
                    key={member.user_id || idx}
                    member={member}
                    isBlockedUser={isMemberBlocked}
                  />
                );
              })}
              {/* Frame 2610127: Rectangle 32 + count text */}
              {effectiveSeenCount > 3 && (
                <div className="relative w-[17px] h-[16px] shrink-0 flex-none select-none">
                  <div className="absolute left-[1px] top-0 w-[16px] h-[16px] rounded-full bg-[var(--ds-surface-1,#1A1A20)] border border-[var(--ds-bg,#030303)] flex items-center justify-center">
                    <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-white">
                      +{effectiveSeenCount - 3}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROW 2: Status text below bubble ('Sending...', 'Delivered', 'Seen', 'Failed') */}
          {!isMe || (isGroup && seenMembers.length > 0) ? null : (() => {
            const statusMargin = message.status === 'failed' ? "" : (validReactions.length > 0 ? "mt-4" : "mt-1");
            // Figma Frame 2610100: "Failed" status text in DM Sans 10px/12px text-[var(--ds-error)] right-aligned below bubble row
            if (message.status === 'failed') {
              return (
                <div className="flex flex-row items-center justify-end select-none">
                  <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-error)]">
                    Failed
                  </span>
                </div>
              );
            }
            if (message.status === 'sending') {
              return (
                /* Frame Sending... : DM Sans 10px/12px 400, #B8ADA8 (var(--ds-text-secondary)) */
                <div className={`flex flex-row items-center justify-end gap-1 ${statusMargin}`}>
                  <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-text-secondary)]">
                    Sending...
                  </span>
                </div>
              );
            }
            const label = statusLabel !== undefined ? statusLabel : (showTime ? (() => {
              if (isRequesting) return 'Delivered';
              const isRead = isGroup
                ? ((message.active_member_count !== undefined && message.seen_count !== undefined && message.active_member_count > 0 && message.seen_count >= message.active_member_count) || message.status === 'read' || Boolean(message.read_at))
                : (Boolean(message.read_at) || message.status === 'read' || (message.seen_count !== undefined && message.seen_count > 0));
              return isRead ? 'Seen' : 'Delivered';
            })() : null);

            return label ? (
              /* Frame Delivered / Seen : DM Sans 10px/12px 400, #B8ADA8 (var(--ds-text-secondary)) */
              <div className={`flex flex-row items-center justify-end gap-1 ${statusMargin}`}>
                <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-text-secondary)]">
                  {label}
                </span>
              </div>
            ) : null;
          })()}
        </div>

        {/* Emoji Picker — fixed position portal */}
        {showEmojiPicker &&
          pickerPos &&
          typeof document !== "undefined" &&
          createPortal(
            <>
              <div
                className="fixed inset-0 z-[99]"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(false);
                  setPickerPos(null);
                }}
              />
              <div
                className="fixed z-[100] shadow-2xl rounded-2xl overflow-hidden"
                style={{ top: pickerPos.top, left: pickerPos.left }}
                onClick={(e) => e.stopPropagation()}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  lazyLoadEmojis
                  width={310}
                  height={340}
                  previewConfig={{ showPreview: false }}
                  theme={isDarkTheme ? Theme.DARK : Theme.LIGHT}
                />
              </div>
            </>,
            document.body,
          )}

        {/* Reaction list popup */}
        {reactionListOpen &&
          validReactions.length > 0 &&
          reactionPopupPos &&
          typeof document !== "undefined" &&
          createPortal(
            <ReactionListPopup
              reactions={validReactions}
              currentUserId={currentUserId || ""}
              messageId={message.id}
              onClose={() => {
                setReactionListOpen(false);
                setReactionPopupPos(null);
              }}
              onRemoveReaction={() => {
                onReaction?.(message, "");
                setReactionListOpen(false);
                setReactionPopupPos(null);
              }}
              position={reactionPopupPos}
            />,
            document.body,
          )}

        {/* Mobile Action Bottom Sheet */}
        {showMobileActions && (
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border rounded-t-2xl shadow-xl overflow-hidden md:hidden animate-in slide-in-from-bottom flex flex-col text-sm font-medium">
            <div className="flex justify-center p-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>
            {!hasMedia && (
              <button
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left"
                onClick={() => handleMobileAction("copy")}
              >
                <CopyIcon className="w-5 h-5 text-muted-foreground" size={20} />
                <span>Copy</span>
              </button>
            )}
            <button
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left border-t border-border/50"
              onClick={() => handleMobileAction(isPinned ? "unpin" : "pin")}
            >
              <PinIcon className="w-5 h-5 text-muted-foreground" size={20} />
              <span>{isPinned ? "Unpin" : "Pin"}</span>
            </button>
            {isMe && (
              <>
                <button
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left border-t border-border/50"
                  onClick={() => handleMobileAction("info")}
                >
                  <InfoIcon className="w-5 h-5 text-muted-foreground" size={20} />
                  <span>Info</span>
                </button>
                {isEditable && (
                  <button
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left border-t border-border/50"
                    onClick={() => handleMobileAction("edit")}
                  >
                    <EditIcon className="w-5 h-5 text-muted-foreground" size={20} />
                    <span>Edit</span>
                  </button>
                )}
              </>
            )}
            <button
              className="flex items-center gap-3 p-4 hover:opacity-80 transition-opacity w-full text-left border-t border-border/50 text-[var(--ds-error)]"
              onClick={() => {
                setShowMobileActions(false);
                handleDeleteClick();
              }}
            >
              <DeleteIcon className="w-5 h-5 text-[var(--ds-error)]" fill="var(--ds-error)" size={20} />
              <span className="text-[var(--ds-error)]">Delete</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default React.memo(MessageBubble, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    (prevProps.message.text_content || "") === (nextProps.message.text_content || "") &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.showSenderName === nextProps.showSenderName &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.chatAvatar === nextProps.chatAvatar &&
    prevProps.showTime === nextProps.showTime &&
    prevProps.isOpponentOnline === nextProps.isOpponentOnline &&
    prevProps.message.is_deleted_for_everyone ===
      nextProps.message.is_deleted_for_everyone &&
    prevProps.message.is_deleted_for_me ===
      nextProps.message.is_deleted_for_me &&
    prevProps.message.is_edited === nextProps.message.is_edited &&
    prevProps.message.isBlocked === nextProps.message.isBlocked &&
    prevProps.message.media === nextProps.message.media &&
    prevProps.message.sharedPost === nextProps.message.sharedPost &&
    prevProps.message.sharedPostId === nextProps.message.sharedPostId &&
    (prevProps.message as any).shared_post_id === (nextProps.message as any).shared_post_id &&
    prevProps.message.sharedProfile === nextProps.message.sharedProfile &&
    prevProps.message.sharedProfileId === nextProps.message.sharedProfileId &&
    prevProps.message.entityType === nextProps.message.entityType &&
    prevProps.message.entityId === nextProps.message.entityId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.hasSelection === nextProps.hasSelection &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.message.reactions === nextProps.message.reactions &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.message.read_at === nextProps.message.read_at &&
    prevProps.message.seen_count === nextProps.message.seen_count &&
    prevProps.message.delivered_count === nextProps.message.delivered_count &&
    prevProps.message.active_member_count ===
      nextProps.message.active_member_count &&
    prevProps.statusLabel === nextProps.statusLabel &&
    prevProps.isPinned === nextProps.isPinned
  );
});

