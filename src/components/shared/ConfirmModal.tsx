/**
 * @deprecated LEGACY COMPONENT
 * DO NOT USE this modal for new features. It is considered legacy.
 * Use `ActionConfirmModal` (from @/shared/commonComponents/ActionConfirmModal) 
 * or `DeleteConfirmationModal` (from @/components/shared/DeleteConfirmationModal) instead.
 */
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
      <DialogContent className="w-[340px] sm:max-w-[340px] p-6 rounded-2xl bg-ds-surface-2 border border-ds-border shadow-2xl">
        <div className="flex flex-col items-center justify-center text-center">
          
          <div className="flex flex-col items-center justify-center gap-2 w-full">
            <DialogTitle className="ds-text-body-2 text-base font-semibold text-ds-text-primary text-center w-full">
              {title}
            </DialogTitle>
            <DialogDescription className="ds-text-small text-ds-text-secondary text-center w-full leading-relaxed">
              {description}
            </DialogDescription>
          </div>

          <div className="flex flex-row gap-3 w-full justify-center mt-5">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="ds-btn flex-1 h-[36px] px-4 rounded-full border border-ds-border bg-ds-surface-1 text-ds-text-primary ds-text-small font-medium hover:bg-ds-surface-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="ds-btn flex-1 h-[36px] px-4 rounded-full bg-ds-error text-white ds-text-small font-medium hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
            </button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
