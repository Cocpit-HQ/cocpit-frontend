"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSheetOpen(true);
    onOpenChange?.(true);
  };

  if (isMobile) {
    const trigger = triggerElement && React.isValidElement(triggerElement) ? (
      React.cloneElement(triggerElement as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          const props = (triggerElement as any).props;
          if (props && typeof props.onClick === "function") {
            props.onClick(e);
          }
          handleTriggerClick(e);
        }
      })
    ) : (
      <button
        type="button"
        onClick={handleTriggerClick}
        className="flex items-center justify-center w-[24px] h-[24px] p-0 bg-transparent border-none cursor-pointer outline-none text-[#000000] hover:text-[#6366F1] transition-all duration-200"
        title="Actions"
      >
        <Icon icon="ph:dots-three-outline-vertical-light" width={24} height={24} />
      </button>
    );

    return (
      <>
        {trigger}

        {/* Bottom Sheet Modal */}
        {isSheetOpen && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsSheetOpen(false);
              onOpenChange?.(false);
            }}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              zIndex: 9999,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            {/* Slide up sheet */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="animate-in slide-in-from-bottom duration-300 ease-out"
              style={{
                width: "100%",
                backgroundColor: "#FFFFFF",
                borderRadius: "24px 24px 0px 0px",
                padding: "16px 16px 32px 16px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {/* Drag handle */}
              <div
                style={{
                  width: "36px",
                  height: "4px",
                  backgroundColor: "#E5E7EB",
                  borderRadius: "2px",
                  margin: "0 auto 12px auto",
                }}
              />

              {/* Rename */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSheetOpen(false);
                  onOpenChange?.(false);
                  onRename();
                }}
                className="flex items-center gap-[12px] w-full px-4 py-3 bg-transparent border-none cursor-pointer text-zinc-700 hover:bg-[#EEF2FF] hover:text-[#6366F1] rounded-xl outline-none transition-all duration-200"
                style={{ textAlign: "left" }}
              >
                <Icon
                  icon="hugeicons:edit-03"
                  className="w-[20px] h-[20px]"
                  style={{ strokeWidth: "1.5px" }}
                />
                <span className="text-[16px] font-sans font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Rename
                </span>
              </button>

              {/* Pin / Unpin */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSheetOpen(false);
                  onOpenChange?.(false);
                  onTogglePin();
                }}
                className="flex items-center gap-[12px] w-full px-4 py-3 bg-transparent border-none cursor-pointer text-zinc-700 hover:bg-[#EEF2FF] hover:text-[#6366F1] rounded-xl outline-none transition-all duration-200"
                style={{ textAlign: "left" }}
              >
                <Icon
                  icon={isPinned ? "iconoir:pin-slash" : "iconoir:pin"}
                  className="w-[20px] h-[20px]"
                />
                <span className="text-[16px] font-sans font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {isPinned ? "Unpin" : "Pin"}
                </span>
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSheetOpen(false);
                  onOpenChange?.(false);
                  onShare();
                }}
                className="flex items-center gap-[12px] w-full px-4 py-3 bg-transparent border-none cursor-pointer text-zinc-700 hover:bg-[#EEF2FF] hover:text-[#6366F1] rounded-xl outline-none transition-all duration-200"
                style={{ textAlign: "left" }}
              >
                <Icon icon="fluent:share-28-regular" className="w-[20px] h-[20px]" />
                <span className="text-[16px] font-sans font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Share
                </span>
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSheetOpen(false);
                  onOpenChange?.(false);
                  onDelete();
                }}
                className="flex items-center gap-[12px] w-full px-4 py-3 bg-transparent border-none cursor-pointer text-[#FF6B6B] hover:bg-red-50 rounded-xl outline-none transition-all duration-200"
                style={{ textAlign: "left" }}
              >
                <Icon icon="hugeicons:delete-02" className="w-[20px] h-[20px]" />
                <span className="text-[16px] font-sans font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Delete
                </span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

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
            <Icon icon="hugeicons:delete-02" className="w-[20px] h-[20px]" />
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
