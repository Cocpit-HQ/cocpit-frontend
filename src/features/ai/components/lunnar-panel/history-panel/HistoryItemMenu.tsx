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

interface HistoryItemMenuProps {
  isPinned: boolean;
  onRename: () => void;
  onTogglePin: () => void;
  onShare: () => void;
  onMoveToProject: () => void;
  onDelete: () => void;
  onOpenChange?: (open: boolean) => void;
  iconColor?: string;
}

export default function HistoryItemMenu({
  isPinned,
  onRename,
  onTogglePin,
  onShare,
  onMoveToProject,
  onDelete,
  onOpenChange,
  iconColor = "var(--foreground)",
}: HistoryItemMenuProps) {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        {/* The 3-dot vertical trigger button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSheetOpen(true);
            onOpenChange?.(true);
          }}
          className="flex items-center justify-center w-[24px] h-[24px] p-0 bg-transparent border-none cursor-pointer outline-none hover:text-[var(--primary)] transition-all duration-200"
          style={{ color: iconColor }}
          title="Actions"
        >
          <Icon icon="ph:dots-three-outline-vertical-light" width={24} height={24} />
        </button>

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
                backgroundColor: "var(--background)",
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
                  backgroundColor: "var(--border)",
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
                className="flex items-center gap-[12px] w-full px-4 py-3 bg-transparent border-none cursor-pointer text-zinc-700 hover:bg-[#EEF2FF] hover:text-[var(--primary)] rounded-xl outline-none transition-all duration-200"
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

              {/* Pin */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSheetOpen(false);
                  onOpenChange?.(false);
                  onTogglePin();
                }}
                className="flex items-center gap-[12px] w-full px-4 py-3 bg-transparent border-none cursor-pointer text-zinc-700 hover:bg-[#EEF2FF] hover:text-[var(--primary)] rounded-xl outline-none transition-all duration-200"
                style={{ textAlign: "left" }}
              >
                <Icon
                  icon={isPinned ? "ph:push-pin-slash-light" : "ph:push-pin-light"}
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
                className="flex items-center gap-[12px] w-full px-4 py-3 bg-transparent border-none cursor-pointer text-zinc-700 hover:bg-[#EEF2FF] hover:text-[var(--primary)] rounded-xl outline-none transition-all duration-200"
                style={{ textAlign: "left" }}
              >
                <Icon icon="fluent:share-28-regular" className="w-[20px] h-[20px]" />
                <span className="text-[16px] font-sans font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Share
                </span>
              </button>

              {/* Move to project */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSheetOpen(false);
                  onOpenChange?.(false);
                  onMoveToProject();
                }}
                className="flex items-center gap-[12px] w-full px-4 py-3 bg-transparent border-none cursor-pointer text-zinc-700 hover:bg-[#EEF2FF] hover:text-[var(--primary)] rounded-xl outline-none transition-all duration-200"
                style={{ textAlign: "left" }}
              >
                <Icon icon="codicon:github-project" className="w-[20px] h-[20px]" />
                <span className="text-[16px] font-sans font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Move to project
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
                className="flex items-center gap-[12px] w-full px-4 py-3 bg-transparent border-none cursor-pointer text-[var(--destructive)] hover:bg-[var(--destructive)]/10 rounded-xl outline-none transition-all duration-200"
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
        <button
          type="button"
          className="flex items-center justify-center w-[24px] h-[24px] p-0 bg-transparent border-none cursor-pointer outline-none hover:text-[var(--primary)] transition-all duration-200"
          style={{ color: iconColor }}
          title="Actions"
        >
          {/* Vertical 3-dot menu icon */}
          <Icon icon="ph:dots-three-outline-vertical-light" width={24} height={24} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[180px] p-2 bg-[var(--popover)] border border-[var(--border)] rounded-[24px] shadow-lg z-[200]"
        align="end"
      >
        <div className="flex flex-col gap-1">
          {/* 1. Rename */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="flex items-center gap-[12px] w-full px-3 py-2 cursor-pointer focus:bg-[var(--primary-tint)] text-[var(--foreground)] focus:text-[var(--primary)] rounded-xl outline-none transition-all duration-200"
          >
            <Icon
              icon="hugeicons:edit-03"
              className="w-[20px] h-[20px] text-[var(--muted-foreground)] focus:text-[var(--primary)] group-focus:text-[var(--primary)]"
              style={{ strokeWidth: "1.5px" }}
            />
            <span
              className="text-[14px] font-sans font-normal"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Rename
            </span>
          </DropdownMenuItem>

          {/* 2. Pin / Unpin */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="flex items-center gap-[12px] w-full px-3 py-2 cursor-pointer focus:bg-[var(--primary-tint)] text-[var(--foreground)] focus:text-[var(--primary)] rounded-xl outline-none transition-all duration-200"
          >
            <Icon
              icon={isPinned ? "ph:push-pin-slash-light" : "ph:push-pin-light"}
              className="w-[20px] h-[20px] text-[var(--muted-foreground)]"
            />
            <span
              className="text-[14px] font-sans font-normal"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {isPinned ? "Unpin" : "Pin"}
            </span>
          </DropdownMenuItem>

          {/* 3. Share */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="flex items-center gap-[12px] w-full px-3 py-2 cursor-pointer focus:bg-[var(--primary-tint)] text-[var(--foreground)] focus:text-[var(--primary)] rounded-xl outline-none transition-all duration-200"
          >
            <Icon icon="fluent:share-28-regular" className="w-[20px] h-[20px] text-[var(--muted-foreground)]" />
            <span
              className="text-[14px] font-sans font-normal"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Share
            </span>
          </DropdownMenuItem>

          {/* 4. Move to project */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMoveToProject();
            }}
            className="flex items-center gap-[12px] w-full px-3 py-2 cursor-pointer focus:bg-[var(--primary-tint)] text-[var(--foreground)] focus:text-[var(--primary)] rounded-xl outline-none transition-all duration-200"
          >
            <Icon icon="codicon:github-project" className="w-[20px] h-[20px] text-[var(--muted-foreground)]" />
            <span
              className="text-[14px] font-sans font-normal"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Move to project
            </span>
          </DropdownMenuItem>

          {/* 5. Delete (Red) */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex items-center gap-[12px] w-full px-3 py-2 cursor-pointer focus:bg-[var(--destructive)]/10 text-[var(--destructive)] rounded-xl outline-none transition-all duration-200"
          >
            <Icon icon="hugeicons:delete-02" className="w-[20px] h-[20px] text-[var(--destructive)]" />
            <span
              className="text-[14px] font-sans font-normal"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Delete
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
