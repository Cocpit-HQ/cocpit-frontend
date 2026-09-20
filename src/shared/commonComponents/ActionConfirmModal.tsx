"use client";

import React from "react";
import { Dialog, BareDialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ConfirmPresetType =
  | "unfollow"
  | "remove_connection"
  | "block_profile"
  | "remove_follower"
  | "delete_post"
  | "logout"
  | "custom";

export interface ActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type?: ConfirmPresetType;
  targetName?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  buttonWidthClass?: string;
  titleClassName?: string;
}

const PRESETS: Record<
  Exclude<ConfirmPresetType, "custom">,
  {
    getTitle: (targetName?: string) => React.ReactNode;
    description: string;
    confirmText: string;
    buttonWidthClass?: string;
    titleClassName?: string;
  }
> = {
  unfollow: {
    getTitle: () => "Unfollow this account?",
    description: "You’ll no longer see their updates in your following feed",
    confirmText: "Unfollow",
    buttonWidthClass: "w-[84px]",
  },
  remove_connection: {
    getTitle: () => "Remove connection?",
    description: "You’ll no longer be connected with them",
    confirmText: "Remove",
    buttonWidthClass: "w-[84px]",
  },
  block_profile: {
    getTitle: (name) => (
      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px]">
        Block <span className="font-['DM_Sans'] font-semibold text-[14px] leading-[20px]">{name || "user"}</span>?
      </span>
    ),
    description: "They won’t be able to view your profile, follow you, or connect with you",
    confirmText: "Block",
    buttonWidthClass: "w-[84px]",
    titleClassName: "font-['Poppins'] font-normal text-[14px] leading-[20px]",
  },
  remove_follower: {
    getTitle: () => "Remove follower?",
    description: "You’ll no longer have them in your followers list",
    confirmText: "Remove",
    buttonWidthClass: "w-[84px]",
  },
  delete_post: {
    getTitle: () => "Delete post?",
    description: "This action cannot be undone and will permanently remove this post",
    confirmText: "Delete",
    buttonWidthClass: "w-[84px]",
  },
  logout: {
    getTitle: () => "Log out?",
    description: "Are you sure you want to log out of your account?",
    confirmText: "Log out",
    buttonWidthClass: "w-[84px]",
  },
};

export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type = "custom",
  targetName,
  title,
  description,
  confirmText,
  cancelText = "Cancel",
  isLoading = false,
  buttonWidthClass: customButtonWidthClass,
  titleClassName: customTitleClassName,
}) => {
  const preset = type !== "custom" ? PRESETS[type] : null;

  const resolvedTitle = title || (preset ? preset.getTitle(targetName) : "Are you sure?");
  const resolvedDescription = description || (preset ? preset.description : "");
  const resolvedConfirmText = confirmText || (preset ? preset.confirmText : "Confirm");
  const buttonWidthClass = customButtonWidthClass || preset?.buttonWidthClass || "w-[84px]";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <BareDialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="box-border w-[237px] p-[12px] gap-[16px] bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-[16px] flex flex-col items-center shadow-2xl outline-none select-none z-[101]"
      >
        {/* Frame 2609475: Text Container */}
        <div className="w-[211px] self-stretch flex flex-col items-center gap-[8px]">
          <DialogTitle
            className={cn(
              "text-[var(--ds-text-primary)] text-center w-full m-0 p-0",
              customTitleClassName || preset?.titleClassName || "font-['DM_Sans'] text-[16px] font-medium leading-[24px]"
            )}
          >
            {resolvedTitle}
          </DialogTitle>
          {resolvedDescription && (
            <DialogDescription className="font-['Poppins'] text-[12px] font-normal leading-[16px] text-[var(--ds-text-secondary)] text-center w-full m-0 p-0">
              {resolvedDescription}
            </DialogDescription>
          )}
        </div>

        {/* Frame 2609476: Action Buttons */}
        <div className="w-[176px] h-[36px] flex flex-row justify-center items-center gap-[8px]">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`${buttonWidthClass} h-[36px] px-[12px] py-[6px] bg-[var(--ds-accent)] rounded-[100px] border-0 outline-none flex justify-center items-center text-[var(--ds-text-primary)] text-[16px] font-medium font-['DM_Sans'] leading-[24px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 select-none whitespace-nowrap focus:outline-none focus-visible:outline-none`}
          >
            {isLoading ? "..." : resolvedConfirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className={`${buttonWidthClass} h-[36px] px-[12px] py-[6px] bg-transparent border border-[var(--ds-border)] rounded-[100px] outline-none flex justify-center items-center text-[var(--ds-text-primary)] text-[16px] font-medium font-['DM_Sans'] leading-[24px] hover:bg-[var(--ds-surface-1)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer disabled:opacity-50 select-none whitespace-nowrap focus:outline-none focus-visible:outline-none`}
          >
            {cancelText}
          </button>
        </div>
      </BareDialogContent>
    </Dialog>
  );
};

export default ActionConfirmModal;
