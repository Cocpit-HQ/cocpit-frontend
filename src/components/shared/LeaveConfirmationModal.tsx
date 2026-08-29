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
        className="w-[193px] h-[142px] max-w-[193px] p-[8px_12px] rounded-[16px] border border-[#2C2C33] bg-[#030303] flex flex-col gap-[16px] items-center justify-center font-['DM_Sans',sans-serif] [&>button]:hidden"
      >
        <div className="flex flex-col items-center gap-[8px] w-[167px] h-[72px]">
          <DialogTitle className="text-[16px] font-medium text-[#FFECE6] m-0 leading-[24px] text-center w-full">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[14px] font-normal text-[#B8ADA8] m-0 leading-[20px] text-center w-full">
            {description}
          </DialogDescription>
        </div>

        <div className="flex flex-row justify-center items-start gap-[8px] w-[144px] h-[36px]">
          <button
            onClick={onClose}
            className="flex flex-row justify-center items-center w-[68px] h-[36px] p-[6px_12px] gap-[10px] rounded-[100px] bg-[#EC6229] text-[#FFECE6] font-medium text-[16px] leading-[24px] hover:bg-[#CC4D22] transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
          <button
            onClick={onConfirm}
            className="flex flex-row justify-center items-center w-[68px] h-[36px] p-[6px_12px] gap-[10px] rounded-[100px] border border-[#2C2C33] bg-transparent text-[#FFECE6] font-medium text-[16px] leading-[24px] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
