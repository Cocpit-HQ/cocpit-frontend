import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  title = "Delete Post",
  description = "Are you sure you want to delete this post?\nThis action cannot be undone.",
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[300px] max-w-[300px] h-[158px] max-h-[158px] rounded-[24px] sm:rounded-[24px] p-[16px] gap-[8px] flex flex-col items-center justify-between text-center [&>button]:hidden">
        <DialogTitle className="text-[16px] font-semibold text-[#1A1A1A] font-[family-name:var(--font-poppins)]">
          {title}
        </DialogTitle>
        <p className="text-[12px] leading-[16px] text-[#6B7280] font-[family-name:var(--font-poppins)] whitespace-pre-line">
          {description}
        </p>

        <div className="flex items-center justify-center gap-[8px] w-full">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 h-[36px] flex items-center justify-center rounded-[100px] border border-[#818CF8] text-[#818CF8] font-medium text-[13px] hover:bg-[#F5F7FF] transition-colors font-[family-name:var(--font-poppins)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 h-[36px] flex items-center justify-center rounded-[100px] bg-[#FF6B6B] text-white font-medium text-[13px] hover:bg-[#FF5252] transition-colors font-[family-name:var(--font-poppins)]"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
