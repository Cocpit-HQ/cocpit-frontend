"use client";

import React, { useEffect, useRef } from "react";
import Avatar from "@/components/shared/Avatar";
import { X } from "lucide-react";

interface Reaction {
  user_id: string;
  emoji: string;
  full_name: string;
  avatar: string | null;
  updated_at: string;
}

interface ReactionListPopupProps {
  reactions: Reaction[];
  currentUserId: string;
  messageId: string;
  onClose: () => void;
  onRemoveReaction: (messageId: string) => void;
  position: { top: number; left: number };
}

export function ReactionListPopup({
  reactions,
  currentUserId,
  messageId,
  onClose,
  onRemoveReaction,
  position,
}: ReactionListPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Filter out empty emoji reactions
  const validReactions = reactions.filter((r) => r.emoji && r.emoji !== "");

  // Sort: my reaction first, then others
  const sorted = [...validReactions].sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    return 0;
  });

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (validReactions.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-transparent"
      onClick={handleBackdropClick}
    >
      <div
        ref={popupRef}
        className="absolute bg-white rounded-2xl shadow-2xl w-[320px] max-w-[90vw] max-h-[60vh] flex flex-col overflow-hidden border border-[#EEF2FF]"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEF2FF]">
          <span className="font-['Poppins'] font-semibold text-[15px] text-[#000000]">
            Reactions
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#EEF2FF] rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Reaction list */}
        <div className="overflow-y-auto flex-1">
          {sorted.map((reaction) => {
            const isMe = reaction.user_id === currentUserId;
            return (
              <div
                key={reaction.user_id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isMe
                    ? "hover:bg-[#EEF2FF] cursor-pointer"
                    : "hover:bg-[#F9FAFB]"
                }`}
                onClick={() => {
                  if (isMe) {
                    onRemoveReaction(messageId);
                    onClose();
                  }
                }}
                title={isMe ? "Click to remove your reaction" : undefined}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                  <Avatar
                    url={reaction.avatar || undefined}
                    name={reaction.full_name || "User"}
                    size="sm"
                  />
                </div>

                {/* Name */}
                <span className="flex-1 font-['Poppins'] font-normal text-[13px] text-[#000000] truncate">
                  {isMe ? "You" : reaction.full_name || "User"}
                </span>

                {/* Emoji */}
                <span className="text-[18px] shrink-0">{reaction.emoji}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ReactionListPopup;
