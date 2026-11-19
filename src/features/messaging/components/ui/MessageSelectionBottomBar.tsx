"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { DeleteIcon } from "@/components/icons";
import { Icon } from "@iconify/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageSelectionBottomBarProps {
  selectedCount: number;
  allAreMine: boolean;
  onClose: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone?: () => void;
}

export default function MessageSelectionBottomBar({
  selectedCount,
  allAreMine,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}: MessageSelectionBottomBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const showDeleteForEveryone = Boolean(allAreMine && onDeleteForEveryone);

  return (
    <div className="w-full h-[56px] min-h-[56px] px-4 md:px-6 bg-[var(--ds-bg)] border-t border-[var(--ds-border)] flex items-center justify-between z-20 shrink-0">
      {/* Left: Dismiss cross and selection count */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-[var(--ds-surface-1)] text-[var(--ds-text-primary)] rounded-full transition-colors cursor-pointer flex items-center justify-center"
          title="Cancel selection"
          aria-label="Cancel selection"
        >
          <X className="h-5 w-5 text-[var(--ds-text-primary)]" />
        </button>
        <span className="font-['DM_Sans'] font-medium text-sm md:text-base leading-5 text-[var(--ds-text-primary)] select-none">
          {selectedCount} Selected
        </span>
      </div>

      {/* Right: Delete action - always show dropdown menu so the user explicitly confirms the action */}
      <div className="flex items-center">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1.5 hover:bg-[var(--ds-surface-1)] !text-[var(--ds-error)] hover:opacity-80 rounded-md transition-colors cursor-pointer flex items-center justify-center outline-none"
              title="Delete messages"
              aria-label="Delete messages"
            >
              <DeleteIcon className="w-5 h-5 !text-[var(--ds-error)]" fill="var(--ds-error)" size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="box-border flex flex-col items-start p-3 gap-3.5 min-w-[180px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-lg shadow-lg z-[200] outline-none"
          >
            <DropdownMenuItem
              onClick={() => {
                setIsDropdownOpen(false);
                onDeleteForMe();
              }}
              className="w-full flex items-center justify-between py-1 px-1.5 font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-opacity !text-[var(--ds-error)] hover:!text-[var(--ds-error)] focus:!text-[var(--ds-error)] data-[highlighted]:!text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:opacity-80"
            >
              <span className="!text-[var(--ds-error)]">Delete for me</span>
              <DeleteIcon className="w-[18px] h-[18px] text-[var(--ds-error)]" fill="var(--ds-error)" size={18} />
            </DropdownMenuItem>

            {showDeleteForEveryone && (
              <DropdownMenuItem
                onClick={() => {
                  setIsDropdownOpen(false);
                  onDeleteForEveryone?.();
                }}
                className="w-full flex items-center justify-between py-1 px-1.5 font-['DM_Sans'] font-normal text-sm leading-5 cursor-pointer outline-none border-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent shadow-none transition-opacity !text-[var(--ds-error)] hover:!text-[var(--ds-error)] focus:!text-[var(--ds-error)] data-[highlighted]:!text-[var(--ds-error)] hover:opacity-80 focus:opacity-80 data-[highlighted]:opacity-80"
              >
                <span className="!text-[var(--ds-error)]">Delete for everyone</span>
                <DeleteIcon className="w-[18px] h-[18px] text-[var(--ds-error)]" fill="var(--ds-error)" size={18} />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
