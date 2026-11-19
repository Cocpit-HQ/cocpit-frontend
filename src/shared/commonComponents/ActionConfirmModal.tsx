"use client";

import React from "react";
import { Dialog, BareDialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useBodyScrollLock } from "@/hooks";

export type ConfirmPresetType =
  | "unfollow"
  | "remove_connection"
  | "block_profile"
  | "remove_pinned_message"
  | "replace_pinned_message"
  | "clear_chat"
  | "delete_conversation"
  | "leave_group"
  | "delete_group"
  | "make_admin"
  | "remove_member"
  | "cancel_invitation"
  | "clear_all_notifications"
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
  descriptionClassName?: string;
  modalClassName?: string;
  overlayClassName?: string;
  confirmColor?: 'accent' | 'red';
  cancelTextColor?: 'primary' | 'secondary';
  buttonsClassName?: string;
}

const PRESETS: Record<
  Exclude<ConfirmPresetType, "custom">,
  {
    getTitle: (targetName?: string) => React.ReactNode;
    description: string | ((targetName?: string) => string);
    confirmText: string;
    buttonWidthClass?: string;
    titleClassName?: string;
    descriptionClassName?: string;
    textContainerClassName?: string;
    modalClassName?: string;
    buttonsClassName?: string;
  }
> = {
  clear_chat: {
    getTitle: () => "Clear chat?",
    description: "Are you sure you want to clear all messages?",
    confirmText: "Clear",
    buttonWidthClass: "!box-border !w-[77px] !min-w-[77px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[40px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px]",
    buttonsClassName: "!w-[162px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  delete_conversation: {
    getTitle: () => "Delete conversation?",
    description: "Are you sure you want to delete this conversation?",
    confirmText: "Delete",
    buttonWidthClass: "!box-border !w-[77px] !min-w-[77px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[40px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px]",
    buttonsClassName: "!w-[162px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  leave_group: {
    getTitle: () => "Leave group?",
    description: "Are you sure you want to leave this group?",
    confirmText: "Leave",
    buttonWidthClass: "!box-border !w-[77px] !min-w-[77px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[40px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px]",
    buttonsClassName: "!w-[162px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  delete_group: {
    getTitle: () => "Delete group?",
    description: "Are you sure you want to delete this group?",
    confirmText: "Delete",
    buttonWidthClass: "!box-border !w-[77px] !min-w-[77px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[40px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px]",
    buttonsClassName: "!w-[162px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  make_admin: {
    getTitle: () => "Make admin?",
    description: (targetName) => `Are you sure you want to make ${targetName || "this member"} an admin of this group?`,
    confirmText: "Admin",
    buttonWidthClass: "!box-border !w-[77px] !min-w-[77px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[170px] !min-h-[170px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[92px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[60px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px] !flex !items-center !justify-center",
    buttonsClassName: "!w-[162px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  remove_member: {
    getTitle: () => "Remove member?",
    description: (targetName) => `Are you sure you want to remove ${targetName || "this member"} from this group?`,
    confirmText: "Remove",
    buttonWidthClass: "!box-border !w-[77px] !min-w-[77px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[170px] !min-h-[170px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[92px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[60px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px] !flex !items-center !justify-center",
    buttonsClassName: "!w-[162px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  cancel_invitation: {
    getTitle: () => "Cancel invitation?",
    description: "Are you sure you want to cancel the group invitation?",
    confirmText: "Delete",
    buttonWidthClass: "!box-border !w-[77px] !min-w-[77px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[40px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px]",
    buttonsClassName: "!w-[162px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  unfollow: {
    getTitle: () => "Unfollow this account?",
    description: "You’ll no longer see their updates in your following feed",
    confirmText: "Unfollow",
    buttonWidthClass: "!box-border !w-[89px] !min-w-[89px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[212px] !max-w-[212px] !h-[142px] !min-h-[142px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[186px] !h-[64px] !gap-2",
    titleClassName: "!w-[186px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[186px] !h-[32px] !font-['Poppins'] !font-normal !text-[12px] !leading-[16px]",
    buttonsClassName: "!w-[186px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  block_profile: {
    getTitle: (name) => (
      <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)]">
        Block {name || "user"}?
      </span>
    ),
    description: "They won’t be able to view your profile, follow you, or connect with you",
    confirmText: "Remove",
    buttonWidthClass: "!box-border !w-[84px] !min-w-[84px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[154px] !min-h-[154px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[76px] !gap-2",
    titleClassName: "!w-[211px] !h-[20px] !font-['Poppins'] !font-normal !text-[14px] !leading-[20px]",
    descriptionClassName: "!w-[211px] !h-[48px] !font-['Poppins'] !font-normal !text-[12px] !leading-[16px]",
    buttonsClassName: "!w-[176px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  remove_connection: {
    getTitle: () => "Remove connection?",
    description: "You’ll no longer be connected with them",
    confirmText: "Remove",
    buttonWidthClass: "!box-border !w-[84px] !min-w-[84px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[40px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px]",
    buttonsClassName: "!w-[176px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  clear_all_notifications: {
    getTitle: () => "Clear all notifications",
    description: "This will remove all your notifications",
    confirmText: "Clear all",
    buttonWidthClass: "!box-border !w-[85px] !min-w-[85px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[40px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px]",
    buttonsClassName: "!w-[178px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  remove_pinned_message: {
    getTitle: () => "Remove pinned message?",
    description: "Are you sure you want to remove this message",
    confirmText: "Remove",
    buttonWidthClass: "!box-border !w-[84px] !min-w-[84px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[40px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px]",
    buttonsClassName: "!w-[176px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  replace_pinned_message: {
    getTitle: () => "Replace pinned message?",
    description: "Do you want to replace it with this new message?",
    confirmText: "Replace",
    buttonWidthClass: "!box-border !w-[84px] !min-w-[84px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    titleClassName: "!w-[211px] !h-[24px] !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]",
    descriptionClassName: "!w-[211px] !h-[40px] !font-['DM_Sans'] !font-normal !text-[14px] !leading-[20px]",
    buttonsClassName: "!w-[176px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  remove_follower: {
    getTitle: () => "Remove follower?",
    description: "You’ll no longer have them in your followers list",
    confirmText: "Remove",
    buttonWidthClass: "!box-border !w-[84px] !min-w-[84px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    buttonsClassName: "!w-[176px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  delete_post: {
    getTitle: () => "Delete post?",
    description: "This action cannot be undone and will permanently remove this post",
    confirmText: "Delete",
    buttonWidthClass: "!box-border !w-[84px] !min-w-[84px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    buttonsClassName: "!w-[176px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  logout: {
    getTitle: () => "Log out?",
    description: "Are you sure you want to log out of your account?",
    confirmText: "Log out",
    buttonWidthClass: "!box-border !w-[89px] !min-w-[89px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[212px] !max-w-[212px] !h-[138px] !min-h-[138px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[186px] !h-[60px] !gap-2",
    titleClassName: "!w-[59px] !h-[20px] !font-['Poppins'] !font-normal !text-[14px] !leading-[20px] !text-[var(--ds-text-primary)]",
    descriptionClassName: "!w-[186px] !h-[32px] !font-['Poppins'] !font-normal !text-[12px] !leading-[16px] !text-center !text-[var(--ds-text-secondary)]",
    buttonsClassName: "!w-[186px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
  },
  remove_tag: {
    getTitle: () => "Remove this tag?",
    description: "This tag will be removed from the post.",
    confirmText: "Remove",
    buttonWidthClass: "!box-border !w-[84px] !min-w-[84px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px] !text-[var(--ds-text-primary)]",
    modalClassName: "!box-border !w-[237px] !max-w-[237px] !h-[150px] !min-h-[150px] !p-3 !gap-4 !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] !rounded-[16px]",
    textContainerClassName: "!w-[211px] !h-[72px] !gap-2",
    buttonsClassName: "!w-[176px] !h-[36px] !gap-2 !justify-center !flex-nowrap",
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
  descriptionClassName: customDescriptionClassName,
  modalClassName,
  overlayClassName,
  confirmColor = 'accent',
  cancelTextColor = 'primary',
  buttonsClassName: customButtonsClassName,
}) => {
  const preset = type !== "custom" ? PRESETS[type] : null;

  const resolvedTitle = title || (preset ? preset.getTitle(targetName) : "Are you sure?");
  const resolvedDescription =
    description ||
    (preset
      ? typeof preset.description === "function"
        ? preset.description(targetName)
        : preset.description
      : "");
  const resolvedConfirmText = confirmText || (preset ? preset.confirmText : "Confirm");
  const buttonWidthClass = customButtonWidthClass || preset?.buttonWidthClass || "!w-[84px] !min-w-[84px] !h-[36px] !px-3 !py-1.5 !rounded-full !font-['DM_Sans'] !font-medium !text-[16px] !leading-[24px]";
  const buttonsClassName = customButtonsClassName || preset?.buttonsClassName || "!w-full !gap-2 !justify-center !flex-nowrap";
  useBodyScrollLock(isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <BareDialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        overlayClassName={overlayClassName}
        className={cn(
          "box-border w-[237px] max-w-[237px] min-h-[150px] p-3 gap-4 bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-[16px] flex flex-col items-center justify-between shadow-2xl outline-none select-none z-[101]",
          preset?.modalClassName,
          modalClassName
        )}
      >
        {/* Frame 2609475: Text Container */}
        <div className={cn("w-full self-stretch flex flex-col items-center gap-2", preset?.textContainerClassName)}>
          <DialogTitle
            className={cn(
              "text-[var(--ds-text-primary)] text-center w-full m-0 p-0 font-['DM_Sans'] font-medium text-[16px] leading-[24px]",
              customTitleClassName || preset?.titleClassName
            )}
          >
            {resolvedTitle}
          </DialogTitle>
          {resolvedDescription && (
            <DialogDescription
              className={cn(
                "font-['DM_Sans'] text-[14px] font-normal leading-[20px] text-[var(--ds-text-secondary)] text-center w-full m-0 p-0 whitespace-normal",
                customDescriptionClassName || preset?.descriptionClassName
              )}
            >
              {resolvedDescription}
            </DialogDescription>
          )}
        </div>

        {/* Frame 2609476: Action Buttons */}
        <div className={cn("w-full flex flex-row justify-center items-center gap-2 flex-nowrap", buttonsClassName)}>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={cn(
              "h-[36px] px-3 py-1.5 rounded-[100px] border-0 outline-none flex justify-center items-center font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 select-none whitespace-nowrap ds-focus-ring shrink-0",
              confirmColor === 'red' ? 'bg-ds-error' : 'bg-[var(--ds-accent)]',
              buttonWidthClass
            )}
          >
            {isLoading ? "..." : resolvedConfirmText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className={cn(
              "h-[36px] px-3 py-1.5 bg-transparent border border-[var(--ds-border)] rounded-[100px] outline-none flex justify-center items-center font-['DM_Sans'] font-medium text-[16px] leading-[24px] hover:bg-ds-surface-1 active:bg-ds-surface-2 transition-colors cursor-pointer disabled:opacity-50 select-none whitespace-nowrap ds-focus-ring shrink-0",
              cancelTextColor === 'secondary'
                ? "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                : "text-[var(--ds-text-primary)]",
              buttonWidthClass
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
