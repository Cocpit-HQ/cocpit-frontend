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
  modalClassName?: string;
  overlayClassName?: string;
  confirmColor?: 'accent' | 'red';
  cancelTextColor?: 'primary' | 'secondary';
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
  modalClassName,
  overlayClassName,
  confirmColor = 'accent',
  cancelTextColor = 'primary',
}) => {
  const preset = type !== "custom" ? PRESETS[type] : null;

  const resolvedTitle = title || (preset ? preset.getTitle(targetName) : "Are you sure?");
  const resolvedDescription = description || (preset ? preset.description : "");
  const resolvedConfirmText = confirmText || (preset ? preset.confirmText : "Confirm");
  const buttonWidthClass = customButtonWidthClass || preset?.buttonWidthClass || "w-[85px]";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <BareDialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        overlayClassName={overlayClassName}
        className={cn(
          "box-border w-[237px] min-h-[150px] p-3 gap-4 bg-ds-bg border border-ds-border rounded-2xl flex flex-col items-center justify-between shadow-2xl outline-none select-none z-[101]",
          modalClassName
        )}
      >
        {/* Frame 2609475: Text Container */}
        <div className="w-full self-stretch flex flex-col items-center gap-2">
          <DialogTitle
            className={cn(
              "text-ds-text-primary text-center w-full m-0 p-0",
              customTitleClassName || preset?.titleClassName || "ds-text-body-1"
            )}
          >
            {resolvedTitle}
          </DialogTitle>
          {resolvedDescription && (
            <DialogDescription className="ds-text-secondary text-ds-text-secondary text-center w-full m-0 p-0">
              {resolvedDescription}
            </DialogDescription>
          )}
        </div>

        {/* Frame 2609476: Action Buttons */}
        <div className="w-full h-[36px] flex flex-row justify-center items-center gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              buttonWidthClass,
              "h-[36px] px-3 py-1.5 rounded-[100px] border-0 outline-none flex justify-center items-center ds-text-body-1 text-ds-text-primary hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 select-none whitespace-nowrap ds-focus-ring",
              confirmColor === 'red' ? 'bg-ds-error' : 'bg-ds-accent'
            )}
          >
            {isLoading ? "..." : resolvedConfirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className={cn(
              buttonWidthClass,
              "h-[36px] px-3 py-1.5 bg-transparent border border-ds-border rounded-[100px] outline-none flex justify-center items-center ds-text-body-1 hover:bg-ds-surface-1 active:bg-ds-surface-2 transition-colors cursor-pointer disabled:opacity-50 select-none whitespace-nowrap ds-focus-ring",
              cancelTextColor === 'secondary'
                ? "text-ds-text-secondary hover:text-ds-text-primary"
                : "text-ds-text-primary"
            )}
          >
            {cancelText}
          </button>
        </div>
      </BareDialogContent>
    </Dialog>
  );
};

export default ActionConfirmModal;
