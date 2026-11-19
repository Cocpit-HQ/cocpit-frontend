"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { ChatThread, Message } from "@/types/messaging";
import Avatar from "@/components/shared/Avatar";
import { MenuIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isChatMuted } from "../../utils/muteUtils";

interface ChatDesktopHeaderProps {
  chat: ChatThread;
  currentUserId: string;
  selectedMessage: Message | null;
  selectedMessages?: Message[];
  isMessageSelected: boolean;
  onMessageAction: (action: string) => void;
  isBlockedByMe: boolean;
  isBlockedByOther: boolean;
  isDeletedAccount: boolean;
  isDeactivatedAccount: boolean;
  typingDisplayString: string | null;
  onShareClick: () => void;
  onReportClick: () => void;
  onBlockClick: () => void;
  onUnblockClick: () => void;
  onClearClick: () => void;
  onDeleteClick: () => void;
  onLeaveClick: () => void;
  onUnmuteClick: () => void;
  onMuteWithDuration: (hours: number | null) => void;
  onTogglePin?: () => void;
  onOpenDetails?: () => void;
}

export default function ChatDesktopHeader({
  chat,
  currentUserId,
  selectedMessage,
  selectedMessages,
  isMessageSelected,
  onMessageAction,
  isBlockedByMe,
  isBlockedByOther,
  isDeletedAccount,
  isDeactivatedAccount,
  typingDisplayString,
  onShareClick,
  onReportClick,
  onBlockClick,
  onUnblockClick,
  onClearClick,
  onDeleteClick,
  onLeaveClick,
  onUnmuteClick,
  onMuteWithDuration,
  onTogglePin,
  onOpenDetails,
}: ChatDesktopHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [menuView, setMenuView] = useState<"main" | "mute">("main");
  const isMutedActive = isChatMuted(chat);
  const isAccountUnavailable =
    isBlockedByOther ||
    isDeactivatedAccount ||
    chat.isDeactivated ||
    chat.isDeleted ||
    isDeletedAccount;

  const profileHref = isAccountUnavailable
    ? "#"
    : chat.otherUserType === "COMPANY"
      ? `/organization/${chat.otherUserSlug || chat.otherUserId}`
      : `/profile/${chat.otherUserSlug || chat.otherUserId}`;

  return (
    <div className="px-4 pt-4 pb-2 bg-[var(--ds-bg)] shrink-0 w-full">
      <div className="flex flex-row items-center justify-between gap-2.5 h-9 w-full self-stretch flex-none order-0 grow-0">
        <div className="flex flex-row items-center p-0 gap-2 min-w-0 flex-1 h-9 flex-none order-0 grow">
          {chat.isGroup ? (
            <>
              <div className="w-8 h-8 relative flex-none order-0">
                <Avatar
                  url={chat.avatar}
                  name={chat.name}
                  size="sm"
                  className="w-8 h-8"
                />
              </div>
              <div className="flex flex-col items-start justify-center p-0 min-w-0 flex-1 h-9 flex-none order-1 grow-0">
                <h2 className="font-['DM_Sans'] font-semibold text-base leading-6 flex items-center text-[var(--ds-text-primary)] w-full h-6 flex-none order-0 grow-0 min-w-0">
                  <span className="truncate">{chat.name}</span>
                </h2>
                <p className="font-['DM_Sans'] font-normal text-[10px] leading-3 flex items-center text-[var(--ds-text-secondary)] w-full h-3 flex-none order-1 grow-0 min-w-0">
                  <span className="truncate">{chat.role || "Group Chat"}</span>
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onOpenDetails && !isAccountUnavailable) {
                    onOpenDetails();
                  }
                }}
                className={`w-8 h-8 relative flex-none order-0 p-0 bg-transparent border-0 text-left ${
                  isAccountUnavailable
                    ? "pointer-events-none cursor-default"
                    : "transition-opacity hover:opacity-80 cursor-pointer"
                }`}
              >
                <Avatar
                  url={chat.avatar}
                  name={
                    chat.name ||
                    (chat.otherUserType === "COMPANY"
                      ? "Unknown Page"
                      : "Unknown User")
                  }
                  size="sm"
                  online={chat.online}
                  showOnlineStatus={false}
                  fallbackGradient="gradient-1"
                  isCompany={chat.otherUserType === "COMPANY"}
                  isUnknown={
                    isAccountUnavailable ||
                    chat.name === "Unknown Page" ||
                    chat.name === "Unknown user" ||
                    chat.name === "Unknown User" ||
                    chat.name === "Deleted Page" ||
                    chat.name === "Deleted User" ||
                    chat.name === "Deactivated User" ||
                    chat.orgHeadline === "This page has been deactivated" ||
                    chat.orgHeadline === "User unavailable" ||
                    chat.role === "User unavailable" ||
                    chat.role === "Page unavailable"
                  }
                  className="w-8 h-8"
                />
                {chat.online && !isBlockedByOther && (
                  <div
                    className="w-1 h-1 left-[25px] top-[25px] absolute bg-[var(--ds-success)] rounded-full"
                    aria-hidden="true"
                  />
                )}
              </button>
              <div className="flex flex-col items-start justify-center p-0 min-w-0 flex-1 h-9 flex-none order-1 grow-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenDetails && !isAccountUnavailable) {
                      onOpenDetails();
                    }
                  }}
                  className={`w-full min-w-0 p-0 bg-transparent border-0 text-left ${
                    isAccountUnavailable
                      ? "pointer-events-none cursor-default"
                      : "transition-opacity hover:opacity-80 cursor-pointer"
                  }`}
                >
                  <h2 className="font-['DM_Sans'] font-semibold text-base leading-6 flex items-center text-[var(--ds-text-primary)] w-full h-6 flex-none order-0 grow-0 min-w-0">
                    <span className="truncate">
                      {chat.name ||
                        (chat.otherUserType === "COMPANY"
                          ? "Unknown Page"
                          : "Unknown User")}
                    </span>
                  </h2>
                </button>
                <p className="font-['DM_Sans'] font-normal text-[10px] leading-3 flex items-center text-[var(--ds-text-secondary)] w-full h-3 flex-none order-1 grow-0 min-w-0">
                  <span className="truncate">
                    {isAccountUnavailable
                      ? chat.otherUserType === "COMPANY"
                        ? "Page unavailable"
                        : "User unavailable"
                      : chat.otherUserType === "COMPANY"
                        ? chat.orgHeadline ||
                          chat.role ||
                          "Page unavailable"
                        : chat.role || ""}
                  </span>
                  {!isBlockedByOther &&
                    !chat.is_requesting &&
                    typingDisplayString && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-[var(--ds-success)] flex-none mx-1.5" />
                        <span className="text-[var(--ds-success)] truncate">
                          Typing...
                        </span>
                      </>
                    )}
                </p>
              </div>
            </>
          )}
        </div>

        {/* 3-dot conversation menu (hidden when a message is selected to avoid confusion) */}
        {!isMessageSelected && (
          <div className="flex flex-row items-center p-0 flex-none order-1 grow-0">
          <DropdownMenu
            open={isDropdownOpen}
            onOpenChange={(open) => {
              setIsDropdownOpen(open);
              if (!open) setMenuView("main");
            }}
          >
            <DropdownMenuTrigger asChild>
              <button
                className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity outline-none cursor-pointer p-0"
                aria-label="Conversation actions"
              >
                <MenuIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              id={
                menuView === "mute"
                  ? "chat-mute-dropdown"
                  : "chat-user-dropdown"
              }
              align="end"
              sideOffset={6}
              className={
                menuView === "mute"
                  ? "chat-mute-menu box-border flex flex-col items-center p-3 gap-4 w-[159px] min-w-[159px] h-[188px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg !shadow-none z-[100] outline-none overflow-hidden"
                  : chat.isGroup
                    ? "chat-user-menu box-border flex flex-col items-start p-3 gap-4 w-[113px] min-w-[113px] h-[116px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg !shadow-none z-[100] outline-none overflow-hidden"
                    : "chat-user-menu box-border flex flex-col items-start p-3 gap-4 w-[113px] min-w-[113px] h-[260px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg !shadow-none z-[100] outline-none overflow-hidden"
              }
            >
              {menuView === "mute" ? (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      onMuteWithDuration(1);
                      setIsDropdownOpen(false);
                      setMenuView("main");
                    }}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-0 grow-0"
                  >
                    For 1 hours
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      onMuteWithDuration(8);
                      setIsDropdownOpen(false);
                      setMenuView("main");
                    }}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-1 grow-0"
                  >
                    For 8 hours
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      onMuteWithDuration(24);
                      setIsDropdownOpen(false);
                      setMenuView("main");
                    }}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-2 grow-0"
                  >
                    For 24 hours
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      onMuteWithDuration(null);
                      setIsDropdownOpen(false);
                      setMenuView("main");
                    }}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-3 grow-0"
                  >
                    Until I turn it back on
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setMenuView("main");
                    }}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-center text-center !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-4 grow-0"
                  >
                    Cancel
                  </DropdownMenuItem>
                </>
              ) : chat.isGroup ? (
                <>
                  {onTogglePin && (
                    <DropdownMenuItem
                      onSelect={onTogglePin}
                      className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-0 grow-0"
                    >
                      {chat.is_pinned ? "Unpin group" : "Pin group"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={onShareClick}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-1 grow-0"
                  >
                    Share profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      if (isMutedActive) {
                        onUnmuteClick();
                      } else {
                        e.preventDefault();
                        setMenuView("mute");
                      }
                    }}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-2 grow-0"
                  >
                    {isMutedActive ? "Unmute group" : "Mute group"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={onLeaveClick}
                    className="chat-action-item danger-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:!text-[var(--ds-error)] data-[highlighted]:!opacity-80 flex-none order-3 grow-0"
                  >
                    Leave group
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {onTogglePin && (
                    <DropdownMenuItem
                      onSelect={onTogglePin}
                      className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-0 grow-0"
                    >
                      {chat.is_pinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={(e) => {
                      if (isMutedActive) {
                        onUnmuteClick();
                      } else {
                        e.preventDefault();
                        setMenuView("mute");
                      }
                    }}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-1 grow-0"
                  >
                    {isMutedActive ? "Unmute" : "Mute"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={onShareClick}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-2 grow-0"
                  >
                    Share profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={onReportClick}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-3 grow-0"
                  >
                    Report profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={isBlockedByMe ? onUnblockClick : onBlockClick}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-4 grow-0"
                  >
                    {isBlockedByMe ? "Unblock profile" : "Block profile"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={onClearClick}
                    className="chat-action-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] flex-none order-5 grow-0"
                  >
                    Clear Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={onDeleteClick}
                    className="chat-action-item danger-item !p-0 m-0 h-5 w-auto whitespace-nowrap shrink-0 select-none font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent focus:!bg-transparent hover:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-colors flex items-center justify-start !text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:!text-[var(--ds-error)] data-[highlighted]:!opacity-80 flex-none order-6 grow-0"
                  >
                    Delete Chat
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

