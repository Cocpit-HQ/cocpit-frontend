"use client";

import React from "react";
import { Message } from "@/types/messaging";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  CopyIcon,
  ReplyIcon,
  InfoIcon,
  EditIcon,
  DeleteIcon,
  PinIcon,
} from "@/components/icons";

export const CustomReplyIcon = ({ className }: { className?: string }) => (
  <ReplyIcon className={className} size={20} />
);

export const CopyButton = ({
  isCopied,
  onClick,
  className,
}: {
  isCopied: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) => (
  <button
    className={cn(
      "p-0 z-50 relative transition-all cursor-pointer outline-none",
      isCopied
        ? "text-[var(--ds-accent)]"
        : "text-[var(--ds-text-primary)] hover:opacity-80",
      className,
    )}
    onClick={onClick}
    onPointerDown={(e) => {
      e.stopPropagation();
      e.preventDefault();
    }}
    onMouseDown={(e) => {
      e.stopPropagation();
      e.preventDefault();
    }}
    title={isCopied ? "Copied" : "Copy message"}
    aria-label="Copy message"
  >
    <CopyIcon className="w-5 h-5" size={20} filled={isCopied} />
  </button>
);

export const hasMessageMedia = (msg?: any): boolean => {
  if (!msg || !msg.media) return false;
  if (Array.isArray(msg.media)) return msg.media.length > 0;
  if (typeof msg.media === "object") return Object.keys(msg.media).length > 0;
  return false;
};

export const MessageActionsDropdown = ({
  message,
  onAction,
  currentUserId,
  isPinned = false,
}: {
  message: Message;
  onAction?: (action: string, message: Message) => void;
  currentUserId?: string;
  isPinned?: boolean;
}) => {
  if (!onAction) return null;
  const isMedia = hasMessageMedia(message);
  const isMine = message.senderId === currentUserId || message.sender === "me";
  const createdAtStr = message.created_at || (message as any).createdAt || (message as any).timestamp;
  const isWithin15Minutes = (() => {
    if (!createdAtStr) return true;
    const createdAtTime = new Date(createdAtStr).getTime();
    if (isNaN(createdAtTime)) return true;
    return (Date.now() - createdAtTime) / (1000 * 60) <= 15;
  })();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 hover:bg-[var(--primary-tint)] rounded-full transition-colors text-muted-foreground">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction(isPinned ? "unpin" : "pin", message)}>
          <PinIcon className="w-4 h-4 mr-2" size={16} /> {isPinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("info", message)}>
          <InfoIcon className="w-4 h-4 mr-2" size={16} /> Info
        </DropdownMenuItem>
        {!isMedia && (
          <DropdownMenuItem onClick={() => onAction("copy", message)}>
            <CopyIcon className="w-4 h-4 mr-2" size={16} /> Copy
          </DropdownMenuItem>
        )}
        {!isMedia && isMine && isWithin15Minutes && (
          <DropdownMenuItem onClick={() => onAction("edit", message)}>
            <EditIcon className="w-4 h-4 mr-2" size={16} /> Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onAction("delete_for_me", message)}
          className="cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-opacity !text-[var(--ds-error)] hover:!text-[var(--ds-error)] focus:!text-[var(--ds-error)] data-[highlighted]:!text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:opacity-80"
        >
          <DeleteIcon className="w-4 h-4 mr-2 text-[var(--ds-error)]" fill="var(--ds-error)" size={16} />
          <span className="!text-[var(--ds-error)]">Delete for me</span>
        </DropdownMenuItem>
        {(message.senderId === currentUserId || message.sender === "me") && (
          <DropdownMenuItem
            onClick={() => onAction("delete_for_everyone", message)}
            className="cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-opacity !text-[var(--ds-error)] hover:!text-[var(--ds-error)] focus:!text-[var(--ds-error)] data-[highlighted]:!text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:opacity-80"
          >
            <DeleteIcon className="w-4 h-4 mr-2 text-[var(--ds-error)]" fill="var(--ds-error)" size={16} />
            <span className="!text-[var(--ds-error)]">Delete for everyone</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

