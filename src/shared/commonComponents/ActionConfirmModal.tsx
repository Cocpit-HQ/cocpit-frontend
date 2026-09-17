"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type ConfirmPresetType =
  | "unfollow"
  | "remove_connection"
  | "block_profile"
  | "remove_follower"
  | "delete_post"
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
}

const PRESETS: Record<
  Exclude<ConfirmPresetType, "custom">,
  {
    getTitle: (targetName?: string) => React.ReactNode;
    description: string;
    confirmText: string;
    buttonWidthClass?: string;
  }
> = {
  unfollow: {
    getTitle: () => "Unfollow this account?",
    description: "You’ll no longer see their updates in your following feed",
    confirmText: "Unfollow",
    buttonWidthClass: "w-24",
  },
  remove_connection: {
    getTitle: () => "Remove connection?",
    description: "You’ll no longer be connected with them",
    confirmText: "Remove",
    buttonWidthClass: "w-20",
  },
  block_profile: {
    getTitle: (name) => (
      <>
        Block <span className="font-semibold">{name || "user"}</span>?
      </>
    ),
    description: "They won’t be able to view your profile, follow you, or connect with you",
    confirmText: "Remove",
    buttonWidthClass: "w-20",
  },
  remove_follower: {
    getTitle: () => "Remove follower?",
    description: "You’ll no longer have them in your followers list",
    confirmText: "Remove",
    buttonWidthClass: "w-20",
  },
  delete_post: {
    getTitle: () => "Delete post?",
    description: "This action cannot be undone and will permanently remove this post",
    confirmText: "Delete",
    buttonWidthClass: "w-20",
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
}) => {
  const preset = type !== "custom" ? PRESETS[type] : null;

  const resolvedTitle = title || (preset ? preset.getTitle(targetName) : "Are you sure?");
  const resolvedDescription = description || (preset ? preset.description : "");
  const resolvedConfirmText = confirmText || (preset ? preset.confirmText : "Confirm");
  const buttonWidthClass = preset?.buttonWidthClass || "min-w-[80px]";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="w-[240px] max-w-[240px] p-3 bg-[var(--ds-bg)] rounded-2xl border border-[var(--ds-border)] flex flex-col justify-start items-center gap-4 overflow-hidden shadow-2xl outline-none [&>button:last-child]:hidden"
      >
        <div className="self-stretch flex flex-col justify-start items-center gap-2">
          <DialogTitle className="text-center text-[var(--ds-text-primary)] text-sm font-normal font-['Poppins'] leading-5 m-0">
            {resolvedTitle}
          </DialogTitle>
          {resolvedDescription && (
            <div className="self-stretch text-center text-[var(--ds-text-secondary)] text-xs font-normal font-['Poppins'] leading-4">
              {resolvedDescription}
            </div>
          )}
        </div>

        <div className="inline-flex justify-center items-center gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`${buttonWidthClass} px-3 py-1.5 h-9 bg-[var(--ds-accent)] rounded-[100px] flex justify-center items-center gap-2.5 text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50`}
          >
            {isLoading ? "..." : resolvedConfirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className={`${buttonWidthClass} px-3 py-1.5 h-9 bg-transparent rounded-[100px] border border-[var(--ds-border)] flex justify-center items-center gap-2.5 text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50`}
          >
            {cancelText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActionConfirmModal;
