"use client";

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export interface LeaveOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  orgName?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function LeaveOrganizationModal({
  isOpen,
  onClose,
  onConfirm,
  orgName = "Organization",
  isLoading = false,
  error = null,
}: LeaveOrganizationModalProps) {
  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-org-modal-title"
      aria-describedby="leave-org-modal-desc"
    >
      <div
        className="relative w-[309px] max-w-[calc(100vw-32px)] bg-ds-bg border border-ds-border rounded-[16px] p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200 box-border flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Text Container: 283px Fill */}
        <div className="w-full max-w-[283px] flex flex-col items-center gap-2 text-center">
          <h2
            id="leave-org-modal-title"
            className="font-['DM_Sans'] text-[16px] font-medium leading-[24px] text-ds-text-primary text-center w-full m-0 p-0"
          >
            Are you sure you want to leave &ldquo;{orgName}&rdquo;?
          </h2>
          <p
            id="leave-org-modal-desc"
            className="font-['DM_Sans'] text-[14px] font-normal leading-[20px] text-ds-text-secondary text-center w-full m-0 p-0"
          >
            You will lose access to the page and its associated features
          </p>
        </div>

        {error && (
          <div
            className="w-full p-2 bg-ds-error/10 border border-ds-error/20 rounded-lg text-center"
            role="alert"
          >
            <p className="text-ds-error ds-text-small font-medium m-0">
              {error}
            </p>
          </div>
        )}

        {/* Buttons: 77px x 36px Hug */}
        <div className="flex flex-row items-center justify-center gap-2 w-full">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-[77px] h-[36px] rounded-[100px] bg-ds-error hover:opacity-90 active:scale-95 text-white font-['DM_Sans'] text-[14px] font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ds-focus-ring whitespace-nowrap"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
            <span className="whitespace-nowrap">Leave</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-[77px] h-[36px] rounded-[100px] border border-ds-border bg-transparent hover:bg-white/5 active:bg-white/10 text-ds-text-primary font-['DM_Sans'] text-[14px] font-medium flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ds-focus-ring whitespace-nowrap"
          >
            <span className="whitespace-nowrap">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeaveOrganizationModal;
