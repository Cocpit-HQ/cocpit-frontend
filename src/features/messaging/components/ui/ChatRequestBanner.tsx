"use client";

import React, { useState } from "react";
import {
  Dialog,
  BareDialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ChatRequestBannerProps {
  onDecline: () => void | Promise<void>;
  onAccept: () => void | Promise<void>;
}

export default function ChatRequestBanner({
  onDecline,
  onAccept,
}: ChatRequestBannerProps) {
  const [activeModal, setActiveModal] = useState<"accept" | "delete" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmAction = async () => {
    if (!activeModal || isProcessing) return;
    setIsProcessing(true);
    try {
      if (activeModal === "accept") {
        await onAccept();
      } else {
        await onDecline();
      }
    } finally {
      setIsProcessing(false);
      setActiveModal(null);
    }
  };

  const handleCloseModal = () => {
    if (!isProcessing) {
      setActiveModal(null);
    }
  };

  return (
    <>
      {/* Frame 2609476: Request action buttons container */}
      <div className="w-full max-w-[618px] ml-auto h-[36px] flex flex-row justify-end items-center gap-[8px] my-2 px-4 md:px-6 shrink-0">
        {/* Primary emphasis button: Accept request */}
        <button
          type="button"
          onClick={() => setActiveModal("accept")}
          className="w-[142px] h-[36px] px-[12px] py-[6px] gap-[10px] rounded-[100px] bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] transition-all text-[var(--ds-text-primary)] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex flex-row justify-center items-center cursor-pointer shrink-0"
        >
          <span>Accept request</span>
        </button>

        {/* Secondary button: Delete request */}
        <button
          type="button"
          onClick={() => setActiveModal("delete")}
          className="w-[142px] h-[36px] px-[12px] py-[6px] gap-[10px] rounded-[100px] border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-1)] active:scale-[0.98] transition-all text-[var(--ds-text-primary)] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex flex-row justify-center items-center cursor-pointer shrink-0"
        >
          <span>Delete request</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && handleCloseModal()}>
        <BareDialogContent
          className="!w-[212px] !h-[158px] !p-[12px] !gap-[16px] !rounded-[16px] bg-[var(--ds-bg)] border border-[var(--ds-border)] flex flex-col items-center justify-between box-border outline-none shadow-2xl overflow-hidden select-none"
          overlayClassName="bg-black/80 backdrop-blur-sm"
        >
          {activeModal === "accept" && (
            <>
              {/* Frame 2609475: Header & Subtext */}
              <div className="w-[186px] h-[80px] flex flex-col items-center gap-[8px] p-0 shrink-0">
                <DialogTitle className="w-[164px] h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] text-center tracking-normal p-0 m-0 truncate">
                  Accept chat request?
                </DialogTitle>
                <DialogDescription className="w-[186px] h-[48px] font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[var(--ds-text-secondary)] p-0 m-0 line-clamp-3">
                  You'll be able to start a conversation with this person once you accept their request.
                </DialogDescription>
              </div>

              {/* Frame 2609476: Action Buttons */}
              <div className="w-[186px] h-[36px] flex flex-row justify-center items-start gap-[8px] p-0 shrink-0">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmAction}
                  className="w-[89px] h-[36px] px-[12px] py-[6px] gap-[10px] rounded-[100px] bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] transition-all text-[var(--ds-text-primary)] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex flex-row justify-center items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <span>{isProcessing ? "..." : "Accept"}</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCloseModal}
                  className="w-[89px] h-[36px] px-[12px] py-[6px] gap-[10px] rounded-[100px] border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-1)] active:scale-[0.98] transition-all text-[var(--ds-text-primary)] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex flex-row justify-center items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </>
          )}

          {activeModal === "delete" && (
            <>
              {/* Frame 2609475: Header & Subtext */}
              <div className="w-[186px] h-[80px] flex flex-col items-center gap-[8px] p-0 shrink-0">
                <DialogTitle className="w-[158px] h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] text-center tracking-normal p-0 m-0 truncate">
                  Delete chat request?
                </DialogTitle>
                <DialogDescription className="w-[186px] h-[48px] font-['Poppins'] font-normal text-[12px] leading-[16px] text-center text-[var(--ds-text-secondary)] p-0 m-0 line-clamp-3">
                  Are you sure you want to delete this chat request? You won't be able to recover it.
                </DialogDescription>
              </div>

              {/* Frame 2609476: Action Buttons */}
              <div className="w-[186px] h-[36px] flex flex-row justify-center items-start gap-[8px] p-0 shrink-0">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmAction}
                  className="w-[89px] h-[36px] px-[12px] py-[6px] gap-[10px] rounded-[100px] bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] transition-all text-[var(--ds-text-primary)] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex flex-row justify-center items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <span>{isProcessing ? "..." : "Delete"}</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCloseModal}
                  className="w-[89px] h-[36px] px-[12px] py-[6px] gap-[10px] rounded-[100px] border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-1)] active:scale-[0.98] transition-all text-[var(--ds-text-primary)] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex flex-row justify-center items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </>
          )}
        </BareDialogContent>
      </Dialog>
    </>
  );
}
