"use client"

import React from "react"
import Link from "next/link"
import { ChatThread } from "@/types/messaging"
import { avatarGradients } from "@/constants/messaging"

import Avatar from "@/components/shared/Avatar"

const getAvatarGradient = (avatar: string) => {
  return avatarGradients[avatar] || "from-gray-400 to-gray-500";
}

interface ChatListItemProps {
  chat: ChatThread
  isSelected: boolean
  isMobile: boolean
}

export function ChatListItem({ chat, isSelected, isMobile }: ChatListItemProps) {
  const content = (
    <div
      className={`p-4 cursor-pointer transition-colors border-b border-border hover:bg-muted/50 ${!isMobile && isSelected ? "bg-muted" : ""
        }`}
    >
      <div className="flex gap-3">
        {chat.isGroup ? (
          <Avatar
            url={chat.avatar}
            name={chat.name}
            size="lg"
            online={chat.online}
            fallbackGradient="gradient-1"
          />
        ) : (
          <Link
            href={chat.otherUserType === 'COMPANY' ? `/organization/${chat.otherUserSlug || chat.otherUserId}` : `/profile/${chat.otherUserSlug || chat.otherUserId}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 hover:opacity-80 transition-opacity"
          >
            <Avatar
              url={chat.avatar}
              name={chat.name}
              size="lg"
              online={chat.online}
              fallbackGradient="gradient-1"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
              {/* Session indicator */}
              {chat.sessionStatus === 'mine' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="You are handling" />
              )}
              {chat.sessionStatus === 'other' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title={`Handled by ${chat.sessionHandlerName || 'another member'}`} />
              )}
              {chat.sessionStatus === 'unclaimed' && (
                <span className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" title="Unclaimed" />
              )}
              {chat.isGroup ? (
                <h3 className="font-semibold truncate text-foreground min-w-0">
                  {chat.name}
                </h3>
              ) : (
                <h3 className="font-semibold truncate text-foreground min-w-0">
                  {chat.name}
                </h3>
              )}
              {chat.role && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap flex-shrink-0">
                  {chat.role}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {chat.time}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <p className="text-sm truncate text-muted-foreground">
                {chat.lastMessage}
              </p>
            </div>
            {chat.unread > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                {chat.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return content
}

function arePropsEqual(prevProps: ChatListItemProps, nextProps: ChatListItemProps) {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.chat.id === nextProps.chat.id &&
    prevProps.chat.lastMessage === nextProps.chat.lastMessage &&
    prevProps.chat.time === nextProps.chat.time &&
    prevProps.chat.unread === nextProps.chat.unread &&
    prevProps.chat.online === nextProps.chat.online &&
    prevProps.chat.name === nextProps.chat.name &&
    prevProps.chat.avatar === nextProps.chat.avatar &&
    prevProps.chat.role === nextProps.chat.role &&
    prevProps.chat.sessionStatus === nextProps.chat.sessionStatus &&
    prevProps.chat.sessionHandlerName === nextProps.chat.sessionHandlerName
  );
}

const MemoizedChatListItem = React.memo(ChatListItem, arePropsEqual);

export default MemoizedChatListItem;
