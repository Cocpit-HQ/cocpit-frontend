"use client";

import React, { useEffect, useRef } from "react";
import Avatar from "@/components/shared/Avatar";
import { CloseCrossIcon } from "@/components/icons";

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
      {/* Frame: Reaction Popup Box */}
      <div
        ref={popupRef}
        className="absolute w-[250px] max-w-[calc(100vw-32px)] flex flex-col items-center p-3 gap-3 bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-[8px] box-border shadow-2xl overflow-hidden select-none"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Frame 2609688: Title Header */}
        <div className="w-full h-6 flex flex-row items-center justify-between gap-3 self-stretch shrink-0">
          {/* Reactions Title */}
          <span className="flex-1 h-6 font-['DM_Sans'] font-medium text-base leading-6 text-[var(--ds-text-primary)] text-left truncate flex items-center select-none">
            Reactions
          </span>

          {/* Frame 2609536: Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-end text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer shrink-0 p-0 border-none bg-transparent"
            title="Close"
            aria-label="Close reactions"
          >
            <CloseCrossIcon className="w-5 h-5 text-[var(--ds-text-primary)]" size={20} />
          </button>
        </div>

        {/* Frame 2610121: Reaction Items List */}
        {/* Shows up to 4 items naturally without scroll (4 * 24px + 3 * 8px = 120px); beyond 4 items, allows vertical scroll with hidden scrollbars and zero horizontal scroll */}
        <div className="w-full flex flex-col items-start gap-2 self-stretch max-h-[120px] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {sorted.map((reaction) => {
            const isMe = reaction.user_id === currentUserId;
            return (
              /* Frame 2609539: Reaction Item Row */
              <div
                key={reaction.user_id}
                className="w-full h-6 flex flex-row justify-between items-center gap-2 self-stretch shrink-0 cursor-pointer hover:opacity-85 transition-opacity overflow-hidden"
                onClick={() => {
                  if (isMe) {
                    onRemoveReaction(messageId);
                    onClose();
                  }
                }}
                title={isMe ? "Click to remove your reaction" : undefined}
              >
                {/* Left side: Avatar (Rectangle 31) + Name */}
                <div className="flex items-center gap-2 min-w-0 flex-1 h-6 overflow-hidden">
                  {/* Rectangle 31: 20x20px Avatar */}
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                    <Avatar
                      url={reaction.avatar || undefined}
                      name={reaction.full_name || "User"}
                      className="w-5 h-5 text-[10px]"
                    />
                  </div>

                  {/* Name: DM Sans 14px/20px LH, color #FFECE6 */}
                  <span className="font-['DM_Sans'] font-normal text-sm leading-5 text-[var(--ds-text-primary)] truncate text-left select-none flex-1 min-w-0">
                    {isMe ? "You" : reaction.full_name || "User"}
                  </span>
                </div>

                {/* Right side: Emoji (Poppins 16px/24px LH) */}
                <span className="w-4 h-6 font-['Poppins'] font-normal text-base leading-6 flex items-center justify-center shrink-0 select-none">
                  {reaction.emoji}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ReactionListPopup;
