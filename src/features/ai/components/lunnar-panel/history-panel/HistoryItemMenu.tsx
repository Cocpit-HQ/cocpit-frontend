"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";

interface HistoryItemMenuProps {
  isPinned: boolean;
  onRename: () => void;
  onTogglePin: () => void;
  onShare: () => void;
  onMoveToProject: () => void;
  onDelete: () => void;
  onOpenChange?: (open: boolean) => void;
}

export default function HistoryItemMenu({
  isPinned,
  onRename,
  onTogglePin,
  onShare,
  onMoveToProject,
  onDelete,
  onOpenChange,
}: HistoryItemMenuProps) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center w-[24px] h-[24px] p-0 bg-transparent border-none cursor-pointer outline-none text-[#000000] hover:text-[#6366F1] transition-all duration-200"
          title="Actions"
        >
          {/* Vertical 3-dot menu icon */}
          <Icon icon="ph:dots-three-outline-vertical-light" width={24} height={24} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[180px] p-2 bg-white border border-[#EEF2FF] rounded-[24px_0px_24px_24px] shadow-lg z-[200]"
        align="end"
      >
        <div className="flex flex-col gap-1">
          {/* 1. Rename */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
          >
            <span
              className="text-[14px] font-sans font-normal text-black font-[family-name:var(--font-poppins)]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Rename
            </span>
            <Icon
              icon="hugeicons:edit-03"
              className="w-[20px] h-[20px] text-black"
              style={{ strokeWidth: "1.5px" }}
            />
          </DropdownMenuItem>

          {/* 2. Pin / Unpin */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
          >
            <span
              className="text-[14px] font-sans font-normal text-black font-[family-name:var(--font-poppins)]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {isPinned ? "Unpin" : "Pin"}
            </span>
            <Icon
              icon={isPinned ? "ph:push-pin-slash-light" : "ph:push-pin-light"}
              className="w-[20px] h-[20px] text-black"
            />
          </DropdownMenuItem>

          {/* 3. Share */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
          >
            <span
              className="text-[14px] font-sans font-normal text-black font-[family-name:var(--font-poppins)]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Share
            </span>
            <Icon icon="fluent:share-28-regular" className="w-[20px] h-[20px] text-black" />
          </DropdownMenuItem>

          {/* 4. Move to project */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMoveToProject();
            }}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
          >
            <span
              className="text-[14px] font-sans font-normal text-black font-[family-name:var(--font-poppins)]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Move to project
            </span>
            <Icon icon="codicon:github-project" className="w-[20px] h-[20px] text-black" />
          </DropdownMenuItem>

          {/* 5. Delete (Red) */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-red-50 focus:text-[#FF6B6B] text-[#FF6B6B] rounded-xl outline-none transition-colors"
          >
            <span
              className="text-[14px] font-sans font-normal font-[family-name:var(--font-poppins)]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Delete
            </span>
            <Icon icon="hugeicons:delete-02" className="w-[20px] h-[20px] text-[#FF6B6B]" />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
