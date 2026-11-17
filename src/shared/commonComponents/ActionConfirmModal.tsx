"use client";

import React from "react";
import { Dialog, BareDialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/hooks";

export type ConfirmPresetType =
  | "unfollow"
  | "remove_connection"
  | "block_profile"
  | "remove_follower"
  | "delete_post"
  | "logout"
  | "remove_tag"
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
    modalClassName?: string;
  }
> = {
  unfollow: {
    getTitle: () => "Unfollow this account?",
    description: "You’ll no longer see their updates in your following feed",
    confirmText: "Unfollow",
    buttonWidthClass: "min-w-[84px] w-auto",
  },
  remove_connection: {
    getTitle: () => "Remove connection?",
    description: "You’ll no longer be connected with them",
    confirmText: "Remove",
    buttonWidthClass: "min-w-[84px] w-auto",
  },
  block_profile: {
    getTitle: (name) => (
      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px]">
        Block <span className="font-['DM_Sans'] font-semibold text-[14px] leading-[20px]">{name || "user"}</span>?
      </span>
    ),
    description: "They won’t be able to view your profile, follow you, or connect with you",
    confirmText: "Block",
    buttonWidthClass: "min-w-[84px] w-auto",
    titleClassName: "font-['Poppins'] font-normal text-[14px] leading-[20px]",
  },
  remove_follower: {
    getTitle: () => "Remove follower?",
    description: "You’ll no longer have them in your followers list",
    confirmText: "Remove",
    buttonWidthClass: "min-w-[84px] w-auto",
  },
  delete_post: {
    getTitle: () => "Delete post?",
    description: "This action cannot be undone and will permanently remove this post",
    confirmText: "Delete",
    buttonWidthClass: "min-w-[84px] w-auto",
  },
  logout: {
    getTitle: () => "Log out?",
    description: "Are you sure you want to log out of your account?",
    confirmText: "Log out",
    buttonWidthClass: "min-w-[84px] w-auto",
  },
  remove_tag: {
    getTitle: () => "Remove this tag?",
    description: "This tag will be removed from the post.",
    confirmText: "Remove",
    buttonWidthClass: "min-w-[84px] w-auto",
    modalClassName: "w-[202px]",
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
  const buttonWidthClass = customButtonWidthClass || preset?.buttonWidthClass || "min-w-[84px] w-auto";
  useBodyScrollLock(isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <BareDialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        overlayClassName={overlayClassName}
        className={cn(
          "box-border w-[calc(100vw-32px)] max-w-[340px] sm:max-w-[360px] min-h-[148px] p-4 gap-4 bg-ds-bg border border-ds-border rounded-2xl flex flex-col items-center justify-between shadow-2xl outline-none select-none z-[101]",
          preset?.modalClassName,
          modalClassName
        )}
      >
        {/* Frame 2609475: Text Container */}
        <div className="w-full self-stretch flex flex-col items-center gap-2">
          <DialogTitle
            className={cn(
              "text-ds-text-primary text-center w-full m-0 p-0 font-['DM_Sans'] font-medium text-[16px] leading-[24px]",
              customTitleClassName || preset?.titleClassName || "ds-text-body-1"
            )}
          >
            {resolvedTitle}
          </DialogTitle>
          {resolvedDescription && (
            <DialogDescription className="font-['DM_Sans'] text-[14px] font-normal leading-[20px] text-[var(--ds-text-secondary)] text-center w-full m-0 p-0 whitespace-normal">
              {resolvedDescription}
            </DialogDescription>
          )}
        </div>

        {/* Frame 2609476: Action Buttons */}
        <div className="w-full flex flex-row justify-center items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              buttonWidthClass,
              "h-[36px] px-4 py-1.5 rounded-[100px] border-0 outline-none flex justify-center items-center font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-ds-text-primary hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 select-none whitespace-nowrap ds-focus-ring shrink-0",
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
              "h-[36px] px-4 py-1.5 bg-transparent border border-ds-border rounded-[100px] outline-none flex justify-center items-center font-['DM_Sans'] font-medium text-[14px] leading-[20px] hover:bg-ds-surface-1 active:bg-ds-surface-2 transition-colors cursor-pointer disabled:opacity-50 select-none whitespace-nowrap ds-focus-ring shrink-0",
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
