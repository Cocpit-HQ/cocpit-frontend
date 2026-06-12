"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";

interface ProjectActionsMenuProps {
  isPinned: boolean;
  onRename: () => void;
  onTogglePin: () => void;
  onShare: () => void;
  onDelete: () => void;
  onOpenChange?: (open: boolean) => void;
  triggerElement?: React.ReactNode;
}

export default function ProjectActionsMenu({
  isPinned,
  onRename,
  onTogglePin,
  onShare,
  onDelete,
  onOpenChange,
  triggerElement,
}: ProjectActionsMenuProps) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {triggerElement || (
          <button
            type="button"
            className="flex items-center justify-center w-[24px] h-[24px] p-0 bg-transparent border-none cursor-pointer outline-none text-[#000000] hover:text-[#6366F1] transition-all duration-200"
            title="Actions"
          >
            <Icon icon="ph:dots-three-outline-vertical-light" width={24} height={24} />
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[200px] p-2 bg-white border border-[#EEF2FF] rounded-[24px_0px_24px_24px] shadow-lg z-[200]"
        align="end"
      >
        <div className="flex flex-col gap-1">
          {/* Rename */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
          >
            <span
              className="text-[14px] font-sans font-normal text-black"
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

          {/* Pin / Unpin */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
          >
            <span
              className="text-[14px] font-sans font-normal text-black"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {isPinned ? "Unpin" : "Pin"}
            </span>
            <Icon
              icon={isPinned ? "iconoir:pin-slash" : "iconoir:pin"}
              className="w-[20px] h-[20px] text-black"
            />
          </DropdownMenuItem>

          {/* Share */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl outline-none transition-colors"
          >
            <span
              className="text-[14px] font-sans font-normal text-black"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Share
            </span>
            <Icon icon="fluent:share-28-regular" className="w-[20px] h-[20px] text-black" />
          </DropdownMenuItem>

          {/* Delete */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer focus:bg-red-50 focus:text-[#FF6B6B] text-[#FF6B6B] rounded-xl outline-none transition-colors"
          >
            <span
              className="text-[14px] font-sans font-normal"
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
