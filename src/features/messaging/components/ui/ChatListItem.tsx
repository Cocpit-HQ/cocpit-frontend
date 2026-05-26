"use client"

import React from "react"
import Link from "next/link"
import { ChatThread } from "@/types/messaging"
import { avatarGradients } from "@/constants/messaging"

import Avatar from "@/components/shared/Avatar"
import { useSocket } from "@/context/SocketContext"

const getAvatarGradient = (avatar: string) => {
  return avatarGradients[avatar] || "from-gray-400 to-gray-500";
}

interface ChatListItemProps {
  chat: ChatThread
  isSelected: boolean
  isMobile: boolean
  isGroupInvitationRead?: boolean
  isTyping?: boolean
}

export function ChatListItem({ chat, isSelected, isMobile, isGroupInvitationRead, isTyping }: ChatListItemProps) {
  const { activeConversationId } = useSocket();
  const isGroupInvitation = !!chat.is_requesting && (chat.isGroup === true || (chat as any).is_group === true || chat.request_source === 'group_invitation');
  const displayUnread = isGroupInvitation 
    ? ((isGroupInvitationRead || isSelected || chat.id === activeConversationId) ? 0 : 1) 
    : (chat.id !== activeConversationId ? chat.unread : 0);

  const content = (
    <div
      onClick={(e) => {
        // Handled by parent
      }}
      className={`box-border flex flex-col justify-center items-start px-[16px]  mb-[16px] w-[348px] rounded-[24px] cursor-pointer transition-all mx-auto
        ${!isMobile && isSelected
          ? "bg-[#EEF2FF]"
          : "bg-[#FFFFFF]"
        }`}
    >
      <div className="flex flex-col w-full relative py-[8px] ">
        
        {/* GROUP 1: Avatar + Name + Headline */}
        <div className="flex flex-row items-center w-full relative">
          
          {/* Avatar Container */}
          <div className="w-[40px] h-[40px] shrink-0 relative">
            {chat.isGroup ? (
              <Avatar
                url={chat.avatar}
                name={chat.name}
                size="md"
                online={chat.online}
                fallbackGradient="gradient-1"
                className="w-full h-full"
              />
            ) : (
              <Link
                href={chat.otherUserType === 'COMPANY' ? `/organization/${chat.otherUserSlug || chat.otherUserId}` : `/profile/${chat.otherUserSlug || chat.otherUserId}`}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-full block hover:opacity-80 transition-opacity"
              >
                <Avatar
                  url={chat.avatar}
                  name={chat.name}
                  size="md"
                  online={chat.online}
                  fallbackGradient="gradient-1"
                  className="w-full h-full"
                />
              </Link>
            )}
          </div>

          {/* Text Block */}
          <div className="flex flex-col items-start pl-[8px] flex-1 min-w-0 pr-[85px]">
            <h3 className="h-[24px] font-['Poppins'] font-medium text-[16px] leading-[24px] flex items-center text-[#000000] w-full">
              <span className="truncate">{chat.name}</span>
            </h3>
            <p className="h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center text-[#6B7280] w-full">
              <span className="truncate">{chat.role || "Member"}</span>
            </p>
          </div>

          {/* Time (Absolute Top Right) */}
          <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[#6B7280] absolute top-[2px] right-0">
            {chat.time}
          </span>
        </div>

        {/* GROUP 2: Last Message */}
        <div className="mt-[8px] pl-[48px] flex items-center justify-between w-full">
          <p className={`font-['Poppins'] text-[14px] leading-[20px] truncate flex-1 pr-[8px] ${displayUnread > 0 ? 'font-medium text-[#111827]' : 'font-normal text-[#6B7280]'}`}>
            {isTyping ? "Typing..." : chat.lastMessage}
          </p>
          {displayUnread > 0 && (
            <span className="bg-[#4F46E5] text-[#FFFFFF] font-['Poppins'] font-medium text-[12px] leading-[16px] rounded-[100px] min-w-[20px] h-[20px] flex items-center justify-center px-[6px] shrink-0">
              {displayUnread > 99 ? '99+' : displayUnread}
            </span>
          )}
        </div>

      </div>
    </div>
  )

  return content
}

function arePropsEqual(prevProps: ChatListItemProps, nextProps: ChatListItemProps) {
  return (
    prevProps.isTyping === nextProps.isTyping &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isGroupInvitationRead === nextProps.isGroupInvitationRead &&
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.lastMessage === nextProps.chat.lastMessage &&
    prevProps.chat.time === nextProps.chat.time &&
    prevProps.chat.unread === nextProps.chat.unread &&
    prevProps.chat.online === nextProps.chat.online &&
    prevProps.chat.name === nextProps.chat.name &&
    prevProps.chat.avatar === nextProps.chat.avatar &&
    prevProps.chat.role === nextProps.chat.role &&
    prevProps.chat.sessionStatus === nextProps.chat.sessionStatus &&
    prevProps.chat.sessionHandlerName === nextProps.chat.sessionHandlerName &&
    prevProps.chat.is_requesting === nextProps.chat.is_requesting &&
    prevProps.chat.request_source === nextProps.chat.request_source
  );
}

const MemoizedChatListItem = React.memo(ChatListItem, arePropsEqual);

export default MemoizedChatListItem;
