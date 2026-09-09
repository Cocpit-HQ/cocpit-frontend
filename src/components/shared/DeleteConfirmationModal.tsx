import React from "react";
import { Dialog, BareDialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete this post?",
  description = "This post will be permanently deleted",
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <BareDialogContent className="w-[193px] h-[150px] p-[12px] bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-[16px] flex flex-col items-center gap-[16px] shadow-xl outline-none">
        
        <div className="flex flex-col items-center justify-start gap-[8px] w-full">
          <DialogTitle className="font-['DM_Sans'] text-[16px] font-medium leading-[24px] text-[var(--ds-text-primary)] text-center w-full">
            {title}
          </DialogTitle>
          <DialogDescription className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[var(--ds-text-secondary)] text-center w-full">
            {description}
          </DialogDescription>
        </div>

        <div className="flex flex-row justify-center items-start gap-[8px] w-full mt-auto">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-row justify-center items-center px-[12px] py-[6px] w-[77px] h-[36px] bg-[var(--ds-accent)] rounded-[100px] outline-none cursor-pointer hover:brightness-90 transition-all"
          >
            <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)]">
              {isDeleting ? "..." : "Delete"}
            </span>
          </button>
          
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex flex-row justify-center items-center px-[12px] py-[6px] w-[77px] h-[36px] bg-transparent border border-[var(--ds-border)] rounded-[100px] outline-none cursor-pointer hover:bg-[var(--ds-surface-1)] transition-colors"
          >
            <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)]">
              Cancel
            </span>
          </button>
        </div>

      </BareDialogContent>
    </Dialog>
  );
}
