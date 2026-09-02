import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface LeaveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

export function LeaveConfirmationModal({
  isOpen,
  onClose,
  title = "Leave sign up?",
  description = "You'll need to start again if you leave now",
  confirmText = "Stay",
  cancelText = "Leave",
  onConfirm,
}: LeaveConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="w-[193px] h-[142px] max-w-[193px] p-[8px_12px] rounded-[16px] border border-ds-border bg-ds-bg flex flex-col gap-[16px] items-center justify-center font-['DM_Sans',sans-serif] [&>button]:hidden"
      >
        <div className="flex flex-col items-center gap-[8px] w-[167px] h-[72px]">
          <DialogTitle className="text-[16px] font-medium text-ds-text-primary m-0 leading-[24px] text-center w-full">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[14px] font-normal text-ds-text-secondary m-0 leading-[20px] text-center w-full">
            {description}
          </DialogDescription>
        </div>

        <div className="flex flex-row justify-center items-start gap-[8px] w-[144px] h-[36px]">
          <button
            onClick={onClose}
            className="flex flex-row justify-center items-center w-[68px] h-[36px] p-[6px_12px] gap-[10px] rounded-[100px] bg-ds-accent text-white font-medium text-[16px] leading-[24px] hover:opacity-90 transition-opacity cursor-pointer"
          >
            {confirmText}
          </button>
          <button
            onClick={onConfirm}
            className="flex flex-row justify-center items-center w-[68px] h-[36px] p-[6px_12px] gap-[10px] rounded-[100px] border border-ds-border bg-transparent text-ds-text-primary font-medium text-[16px] leading-[24px] hover:bg-ds-surface-1 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
