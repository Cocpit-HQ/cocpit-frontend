import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  isLoading = false
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[300px] sm:max-w-[300px] p-[16px] rounded-[24px] sm:rounded-[24px] border-0 gap-[8px]">
        <div className="flex flex-col items-center justify-center text-center font-[family-name:var(--font-poppins)]">
          
          <div className="flex flex-col items-center justify-center py-[8px] gap-[10px] w-full">
            <DialogTitle className="text-[14px] font-normal text-black m-0 leading-[20px] text-center w-full">
              {title}
            </DialogTitle>
            <DialogDescription className="text-[12px] font-normal text-[#6B7280] m-0 leading-[16px] text-center w-full">
              {description}
            </DialogDescription>
          </div>

          <div className="flex flex-row gap-[16px] w-full justify-center mt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-[40px] px-[16px] py-[8px] rounded-[24px] border border-[#818CF8] bg-white text-[#818CF8] font-normal text-[14px] leading-[20px] hover:bg-[#EEF2FF] transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 h-[40px] px-[16px] py-[8px] rounded-[24px] bg-[#FF6B6B] border border-white text-white font-normal text-[14px] leading-[20px] hover:bg-[#ff5252] transition-colors disabled:opacity-70 flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
            </button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
