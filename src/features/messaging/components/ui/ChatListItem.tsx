"use client"

import React from "react"
import Link from "next/link"
import { ChatThread } from "@/types/messaging"
import { avatarGradients } from "@/constants/messaging"
import { PinIcon, NotificationOffIcon } from "@/components/icons"

import Avatar from "@/components/shared/Avatar"
import { useSocket } from "@/context/SocketContext"
import { formatTimeAgo } from "@/lib/mappers/messaging.mapper"
import { useAuth } from "@/hooks/use-auth"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { isChatMuted } from "../../utils/muteUtils"
import { stripMentionSyntax } from "@/lib/mentions"

const getAvatarGradient = (avatar: string) => {
  return avatarGradients[avatar] || "from-gray-400 to-gray-500";
}

interface ChatListItemProps {
  chat: ChatThread
  isSelected: boolean
  isMobile: boolean
  isGroupInvitationRead?: boolean
  isTyping?: boolean
  isQuickChat?: boolean
  isFirst?: boolean
}

export function ChatListItem({ chat, isSelected, isMobile, isGroupInvitationRead, isTyping, isQuickChat, isFirst }: ChatListItemProps) {
  const { activeConversationId } = useSocket();
  const { user } = useAuth();
  const { activeProfile } = useActiveProfile();
  const currentUserName = (activeProfile?.name || user?.name || (user as any)?.full_name || '').trim();
  const currentUserId = activeProfile?.id || user?.id || (user as any)?.user_id;

  const resolvedLastMessage = React.useMemo(() => {
    if (!chat.lastMessage) {
      if ((chat as any).last_message_media || (chat as any).lastMessageMedia) {
        const media = (chat as any).last_message_media || (chat as any).lastMessageMedia;
        if (Array.isArray(media) && media.length > 0) {
          const mime = media[0]?.file_type || media[0]?.type || media[0]?.mime_type || '';
          if (mime.includes('image')) return 'Photo';
          if (mime.includes('video')) return 'Video';
          return 'Attachment';
        }
      }
      return '';
    }
    if (chat.isGroup) {
      const match = chat.lastMessage.match(/(?:^|\b)(.*)\s+created the group(?:\s*"(.*)")?/i);
      if (match) {
        const creatorName = match[1]?.trim() || '';
        const isMe =
          creatorName.toLowerCase() === 'you' ||
          (currentUserName && creatorName.toLowerCase() === currentUserName.toLowerCase()) ||
          (currentUserName && chat.lastMessage.toLowerCase().startsWith(currentUserName.toLowerCase())) ||
          ((chat as any).admin_id && String((chat as any).admin_id) === String(currentUserId));
        if (isMe) {
          return 'You created the group';
        }
      }
    }
    return stripMentionSyntax(chat.lastMessage);
  }, [chat.lastMessage, chat.isGroup, (chat as any).admin_id, (chat as any).last_message_media, (chat as any).lastMessageMedia, currentUserName, currentUserId]);
  const isRequest = !!chat.is_requesting;
  const isGroupInvitation = isRequest && (chat.isGroup === true || (chat as any).is_group === true || chat.request_source === 'group_invitation');
  const displayUnread = isSelected 
    ? 0 
    : (isGroupInvitation 
        ? (isGroupInvitationRead ? 0 : 1)
        : (chat.unread > 0 ? chat.unread : (chat.is_read === false ? 1 : 0)));

  const hasMention = Boolean(
    chat.hasMention ||
    (chat as any).has_mention ||
    ((chat as any).unread_mention_count && (chat as any).unread_mention_count > 0) ||
    ((chat.unreadMentionCount ?? 0) > 0)
  );

  const hasLastMessageMention = React.useMemo(() => {
    if (displayUnread <= 0) return false;
    const text = chat.lastMessage || (chat as any).last_message || (chat as any).last_message_text || resolvedLastMessage || "";
    if (!text) return false;
    const lower = text.toLowerCase();

    // 1. Broadcast mention: @everyone, @every one, @all (plain, autocomplete @[Everyone](...), or in group context)
    if (
      lower.includes('@everyone') ||
      lower.includes('@every one') ||
      lower.includes('@all') ||
      lower.includes('@[everyone') ||
      lower.includes('@[all') ||
      /(?:@\[?(?:everyone|all)\]?(?:\([^)]+\))?|(?<![a-zA-Z0-9._%+-])@(?:everyone|all)\b)/i.test(text) ||
      (chat.isGroup && /\b@?everyone\b/i.test(text))
    ) {
      return true;
    }

    // 2. Structured markdown mention of current user: @[Name](currentUserId) or @[Name](user:currentUserId)
    if (currentUserId) {
      const userMentionRegex = new RegExp(`@\\[[^\\]]+\\]\\((?:user:)?${currentUserId}\\)`, 'i');
      if (userMentionRegex.test(text)) return true;
    }

    // 3. User name / handle mention:
    if (currentUserName) {
      const nameRegex = new RegExp(`@${currentUserName}\\b`, 'i');
      if (nameRegex.test(text)) return true;
    }
    return false;
  }, [displayUnread, chat.lastMessage, (chat as any).last_message, (chat as any).last_message_text, resolvedLastMessage, chat.isGroup, currentUserId, currentUserName]);

  const showMentionBadge = displayUnread > 0 && (hasMention || hasLastMessageMention);

  const isCompanyType = chat.otherUserType === 'COMPANY';
  const entityFallbackName = isCompanyType ? 'Unknown Page' : 'Unknown User';
  const entityUnavailableText = isCompanyType ? 'Page unavailable' : 'User unavailable';

  const displayName = chat.isGroup ? chat.name : (chat.name || entityFallbackName);
  const rawSubtitle = isCompanyType ? (chat.orgHeadline || chat.role || "") : (chat.role || "");
  const isUnknownEntity = !chat.isGroup && Boolean(
    chat.isBlockedByOther ||
    chat.isDeactivated ||
    chat.isDeleted ||
    chat.name === "Unknown Page" ||
    chat.name === "Unknown user" ||
    chat.name === "Unknown User" ||
    chat.name === "Deleted Page" ||
    chat.name === "Deleted User" ||
    chat.orgHeadline === "This page has been deactivated" ||
    chat.orgHeadline === "User unavailable"
  );

  const displaySubtitle = chat.isGroup
    ? (chat.role || "")
    : ((isUnknownEntity || chat.isBlockedByOther || chat.isDeleted || chat.isDeactivated || rawSubtitle === 'User unavailable' || rawSubtitle === 'Page unavailable')
        ? entityUnavailableText
        : rawSubtitle);

  const content = (
    <div
      className={`box-border w-full max-w-[380px] h-[76px] px-3 py-2 cursor-pointer transition-colors rounded-[12px] flex items-center justify-center gap-2 flex-none ${
        isSelected ? 'bg-[var(--ds-surface-1)]' : 'bg-transparent hover:bg-[var(--ds-surface-1)]/50'
      }`}
    >
      {/* Frame 2608571: 356px x 60px */}
      <div className="w-full h-[60px] flex flex-row items-start p-0 gap-2 flex-1">
        {/* Avatar Container (32x32) */}
        <div className="w-8 h-8 shrink-0 relative flex-none order-0">
          {chat.isGroup ? (
            <Avatar
              url={chat.avatar}
              name={displayName}
              size="sm"
              online={chat.online}
              showOnlineStatus={false}
              fallbackGradient="gradient-1"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <Link
              href={isCompanyType ? `/organization/${chat.otherUserSlug || chat.otherUserId}` : `/profile/${chat.otherUserSlug || chat.otherUserId}`}
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 block hover:opacity-80 transition-opacity"
            >
              <Avatar
                url={chat.avatar}
                name={displayName}
                size="sm"
                online={chat.online}
                showOnlineStatus={false}
                fallbackGradient="gradient-1"
                isCompany={isCompanyType}
                isUnknown={isUnknownEntity}
                className={`w-8 h-8 ${isCompanyType ? "rounded-[6px]" : "rounded-full"}`}
              />
            </Link>
          )}
          {/* Frame 2609905: 4px x 4px at left: 25px, top: 25px */}
          {chat.online && !isUnknownEntity && !chat.isBlockedByOther && (
            <div
              className="w-1 h-1 left-[25px] top-[25px] absolute bg-[var(--ds-success)] rounded-full"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Frame 2608568: 316px x 60px, gap: 6px */}
        <div className="flex-1 h-[60px] flex flex-col justify-start items-start gap-1.5 min-w-0 p-0 order-1">
          {/* Frame 2610108: 316px x 24px */}
          <div className="w-full h-6 flex flex-row justify-between items-center p-0 gap-2.5 flex-none order-0">
            <h3 className="font-['DM_Sans'] text-base font-medium leading-6 text-[var(--ds-text-primary)] truncate flex-1 min-w-0 order-0">
              {displayName}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0 order-1">
              {chat.is_pinned && (
                <PinIcon className="w-3.5 h-3.5 text-[var(--ds-text-muted)] shrink-0" />
              )}
              {isChatMuted(chat) && (
                <NotificationOffIcon className="w-3.5 h-3.5 text-[var(--ds-text-muted)] shrink-0" />
              )}
              {!chat.is_pinned && !isChatMuted(chat) && (
                /* Frame 2608646: DM Sans 12px/16px 400 #726B67 */
                <span className="font-['DM_Sans'] text-xs font-normal leading-4 text-[var(--ds-text-muted)] shrink-0">
                  {formatTimeAgo(chat.lastMessageAt || chat.time)}
                </span>
              )}
            </div>
          </div>

          {/* Subtitle / Role: DM Sans 12px/16px 400 #B8ADA8 */}
          {!isQuickChat && (
            <p className="font-['DM_Sans'] text-xs font-normal leading-4 text-[var(--ds-text-secondary)] truncate w-full h-4 flex-none order-1">
              {displaySubtitle}
            </p>
          )}

          {/* Frame 2610107: 316px x 14px */}
          <div className="w-full h-3.5 flex flex-row justify-between items-center p-0 gap-2 flex-none order-2">
            <p className="font-['DM_Sans'] text-[10px] font-normal leading-3 text-[var(--ds-text-primary)] truncate flex-1 min-w-0 order-0">
              {isTyping ? (
                <span className="text-[var(--ds-success)] font-medium inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ds-success)] inline-block animate-pulse shrink-0" />
                  typing...
                </span>
              ) : (
                resolvedLastMessage || "No messages yet"
              )}
            </p>
            {(showMentionBadge || displayUnread > 0) && (
              <div className="flex items-center gap-2 shrink-0 order-1">
                {showMentionBadge && (
                  /* Frame 2609901: 15px x 14px, rounded-full, background #EC6229 (var(--ds-accent)), @ text DM Sans 10px/12px white */
                  <div
                    className="w-[15px] h-[14px] bg-[var(--ds-accent)] rounded-full flex items-center justify-center shrink-0"
                    title="You were mentioned"
                    aria-label="You were mentioned"
                  >
                    <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-center text-white select-none">
                      @
                    </span>
                  </div>
                )}
                {displayUnread > 0 && (
                  /* Frame 2609901: 14px x 14px, border-radius 7px, background #EC6229, padding: 1px 5px 1px 4px */
                  <div
                    className={`h-[14px] bg-[var(--ds-accent)] rounded-[7px] flex flex-col justify-center items-center shrink-0 box-border ${
                      displayUnread > 9
                        ? "min-w-[14px] w-auto px-1 py-[1px]"
                        : "w-[14px] pt-[1px] pr-[5px] pb-[1px] pl-[4px]"
                    }`}
                  >
                    <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-center text-white whitespace-nowrap flex items-center justify-center order-0 select-none">
                      {displayUnread > 99 ? '99+' : displayUnread}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return content;
}

function arePropsEqual(prevProps: ChatListItemProps, nextProps: ChatListItemProps) {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isTyping === nextProps.isTyping &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isQuickChat === nextProps.isQuickChat &&
    prevProps.isGroupInvitationRead === nextProps.isGroupInvitationRead &&
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.lastMessage === nextProps.chat.lastMessage &&
    (prevProps.chat as any).last_message === (nextProps.chat as any).last_message &&
    (prevProps.chat as any).last_message_text === (nextProps.chat as any).last_message_text &&
    prevProps.chat.time === nextProps.chat.time &&
    prevProps.chat.unread === nextProps.chat.unread &&
    prevProps.chat.hasMention === nextProps.chat.hasMention &&
    prevProps.chat.unreadMentionCount === nextProps.chat.unreadMentionCount &&
    prevProps.chat.online === nextProps.chat.online &&
    prevProps.chat.name === nextProps.chat.name &&
    prevProps.chat.avatar === nextProps.chat.avatar &&
    prevProps.chat.role === nextProps.chat.role &&
    prevProps.chat.orgHeadline === nextProps.chat.orgHeadline &&
    prevProps.chat.otherUserType === nextProps.chat.otherUserType &&
    prevProps.chat.isBlockedByOther === nextProps.chat.isBlockedByOther &&
    prevProps.chat.is_requesting === nextProps.chat.is_requesting &&
    prevProps.chat.request_source === nextProps.chat.request_source &&
    prevProps.chat.is_muted === nextProps.chat.is_muted &&
    prevProps.chat.muted_until === nextProps.chat.muted_until &&
    prevProps.chat.is_pinned === nextProps.chat.is_pinned
  );
}

const MemoizedChatListItem = React.memo(ChatListItem, arePropsEqual);

export default MemoizedChatListItem;
