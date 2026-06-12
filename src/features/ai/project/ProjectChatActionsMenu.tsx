"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";

interface ProjectChatActionsMenuProps {
  isPinned: boolean;
  onRename: () => void;
  onTogglePin: () => void;
  onRemoveFromProject: () => void;
  onShare: () => void;
  onDelete: () => void;
  onOpenChange?: (open: boolean) => void;
  triggerElement?: React.ReactNode;
}

export default function ProjectChatActionsMenu({
  isPinned,
  onRename,
  onTogglePin,
  onRemoveFromProject,
  onShare,
  onDelete,
  onOpenChange,
  triggerElement,
}: ProjectChatActionsMenuProps) {
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
        className="w-56 p-2 bg-white rounded-tl-3xl rounded-tr-none rounded-bl-3xl rounded-br-3xl outline outline-1 outline-offset-[-1px] outline-indigo-200 flex flex-col justify-start items-center overflow-hidden z-[200]"
        align="end"
      >
        <div className="w-full flex flex-col gap-1">
          {/* Rename */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-between items-center cursor-pointer outline-none focus:bg-[#EEF2FF] focus:text-[#6366F1] transition-colors"
          >
            <span className="text-center justify-start text-black text-sm font-normal font-['Poppins'] leading-5">
              Rename
            </span>
            <Icon
              icon="hugeicons:edit-03"
              className="w-5 h-5 text-black"
            />
          </DropdownMenuItem>

          {/* Pin */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-between items-center cursor-pointer outline-none focus:bg-[#EEF2FF] focus:text-[#6366F1] transition-colors"
          >
            <span className="text-center justify-start text-black text-sm font-normal font-['Poppins'] leading-5">
              {isPinned ? "Unpin" : "Pin"}
            </span>
            <Icon
              icon={isPinned ? "ph:push-pin-slash-light" : "ph:push-pin-light"}
              className="w-5 h-5 text-black"
            />
          </DropdownMenuItem>

          {/* Remove from project */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromProject();
            }}
            className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-between items-center cursor-pointer outline-none focus:bg-[#EEF2FF] focus:text-[#6366F1] transition-colors"
          >
            <span className="text-center justify-start text-black text-sm font-normal font-['Poppins'] leading-5">
              Remove from project
            </span>
            <Icon
              icon="codicon:github-project"
              className="w-5 h-5 text-black"
            />
          </DropdownMenuItem>

          {/* Share */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-between items-center cursor-pointer outline-none focus:bg-[#EEF2FF] focus:text-[#6366F1] transition-colors"
          >
            <span className="text-center justify-start text-black text-sm font-normal font-['Poppins'] leading-5">
              Share
            </span>
            <Icon
              icon="fluent:share-28-regular"
              className="w-5 h-5 text-black"
            />
          </DropdownMenuItem>

          {/* Delete */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-between items-center cursor-pointer outline-none focus:bg-red-50 focus:text-red-500 transition-colors"
          >
            <span className="text-center justify-start text-red-400 text-sm font-normal font-['Poppins'] leading-5">
              Delete
            </span>
            <Icon
              icon="hugeicons:delete-02"
              className="w-5 h-5 text-red-400"
            />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
