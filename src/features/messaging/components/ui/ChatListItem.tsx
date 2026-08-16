"use client"

import React from "react"
import Link from "next/link"
import { ChatThread } from "@/types/messaging"
import { avatarGradients } from "@/constants/messaging"
import { BellOff } from "lucide-react"

import Avatar from "@/components/shared/Avatar"
import { useSocket } from "@/context/SocketContext"
import { formatTimeAgo } from "@/lib/mappers/messaging.mapper"

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
  const isRequest = !!chat.is_requesting;
  const isGroupInvitation = isRequest && (chat.isGroup === true || (chat as any).is_group === true || chat.request_source === 'group_invitation');
  const displayUnread = isSelected 
    ? 0 
    : (isGroupInvitation 
        ? (isGroupInvitationRead ? 0 : 1)
        : (chat.unread > 0 ? chat.unread : (chat.is_read === false ? 1 : 0)));

  const isCompanyType = chat.otherUserType === 'COMPANY';
  const entityFallbackName = isCompanyType ? 'Unknown Page' : 'Unknown User';
  const entityUnavailableText = isCompanyType ? 'Page unavailable' : 'User unavailable';

  const displayName = chat.isGroup ? chat.name : (chat.name || entityFallbackName);
  const rawSubtitle = isCompanyType ? (chat.orgHeadline || chat.role || "") : (chat.role || "");
  const isUnknownEntity = Boolean(
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

  const displaySubtitle = (isUnknownEntity || chat.isBlockedByOther || chat.isDeleted || chat.isDeactivated || rawSubtitle === 'User unavailable' || rawSubtitle === 'Page unavailable')
    ? entityUnavailableText
    : rawSubtitle;

  const content = (
    <div
      className={`box-border flex flex-col justify-center items-start px-[16px] w-full cursor-pointer transition-all mx-auto ${
        isQuickChat
          ? `py-[16px] ${!isFirst ? 'border-t border-solid border-[#EEF2FF]' : ''} rounded-none mb-0`
          : 'mb-[16px] rounded-[24px]'
      } ${!isMobile && isSelected ? 'bg-chat-active-item-bg' : 'bg-[#FFFFFF]'}`}
    >
      <div className={`flex flex-col w-full relative ${isQuickChat ? 'py-0' : 'py-[8px]'}`}>
        {/* GROUP 1: Header Row */}
        <div className="flex items-center w-full">
          
          {/* Avatar Container */}
          <div className={`w-[40px] h-[40px] shrink-0 relative ${isQuickChat ? 'mt-[1px]' : ''}`}>
            {chat.isGroup ? (
              <Avatar
                url={chat.avatar}
                name={displayName}
                size="md"
                online={chat.online}
                fallbackGradient="gradient-1"
                className="w-full h-full"
              />
            ) : (
              <Link
                href={isCompanyType ? `/organization/${chat.otherUserSlug || chat.otherUserId}` : `/profile/${chat.otherUserSlug || chat.otherUserId}`}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-full block hover:opacity-80 transition-opacity"
              >
                <Avatar
                  url={chat.avatar}
                  name={displayName}
                  size="md"
                  online={chat.online}
                  fallbackGradient="gradient-1"
                  isCompany={isCompanyType}
                  isUnknown={isUnknownEntity}
                  className="w-full h-full"
                />
              </Link>
            )}
          </div>

          {/* Text Block */}
          <div className="flex flex-col items-start pl-[8px] flex-1 min-w-0">
            <div className="flex justify-between items-center w-full">
              <h3 className={`h-[24px] font-['Poppins'] text-[16px] leading-[24px] flex items-center min-w-0 pr-2 ${displayUnread > 0 ? 'font-semibold text-[#111827]' : 'font-medium text-[#000000]'}`}>
                <span className="truncate">{displayName}</span>
              </h3>
              <span className={`font-['Poppins'] text-[12px] leading-[16px] shrink-0 ${displayUnread > 0 ? 'font-semibold text-[#6366F1]' : 'font-normal text-[#6B7280]'}`}>
                {formatTimeAgo(chat.lastMessageAt || chat.time)}
              </span>
            </div>
            {!isQuickChat && (
              <p className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] w-full min-w-0">
                <span className="truncate w-full block">{displaySubtitle}</span>
              </p>
            )}
          </div>

          {chat.is_muted && (
            <span className="absolute top-[22px] right-0 flex items-center justify-center">
              <BellOff className="w-[12px] h-[12px] text-[#6B7280]" />
            </span>
          )}
        </div>

        {/* GROUP 2: Last Message */}
        <div className={`${isQuickChat ? 'mt-[-14px]' : 'mt-[8px]'} pl-[48px] flex items-center justify-between w-full`}>
          <p className={`font-['Poppins'] ${isQuickChat ? 'text-[12px] leading-[16px]' : 'text-[14px] leading-[20px]'} truncate flex-1 pr-[8px] ${displayUnread > 0 ? 'font-semibold text-[#111827]' : 'font-normal text-[#6B7280]'}`}>
            {isTyping ? (
              <span className="text-[#10B981] font-medium inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block animate-pulse shrink-0" />
                Typing...
              </span>
            ) : (
              chat.lastMessage
            )}
          </p>
          {displayUnread > 0 && (
            <span className={`bg-[#6366F1] text-[#FFFFFF] font-['Poppins'] font-medium text-[12px] leading-[16px] rounded-[100px] flex items-center justify-center shrink-0 ${isQuickChat ? 'min-w-[16px] h-[16px] px-[4px]' : 'min-w-[20px] h-[20px] px-[6px]'}`}>
              {displayUnread > 99 ? '99+' : displayUnread}
            </span>
          )}
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
    prevProps.chat.time === nextProps.chat.time &&
    prevProps.chat.unread === nextProps.chat.unread &&
    prevProps.chat.online === nextProps.chat.online &&
    prevProps.chat.name === nextProps.chat.name &&
    prevProps.chat.avatar === nextProps.chat.avatar &&
    prevProps.chat.role === nextProps.chat.role &&
    prevProps.chat.orgHeadline === nextProps.chat.orgHeadline &&
    prevProps.chat.otherUserType === nextProps.chat.otherUserType &&
    prevProps.chat.isBlockedByOther === nextProps.chat.isBlockedByOther &&
    prevProps.chat.is_requesting === nextProps.chat.is_requesting &&
    prevProps.chat.request_source === nextProps.chat.request_source &&
    prevProps.chat.is_muted === nextProps.chat.is_muted
  );
}

const MemoizedChatListItem = React.memo(ChatListItem, arePropsEqual);

export default MemoizedChatListItem;
