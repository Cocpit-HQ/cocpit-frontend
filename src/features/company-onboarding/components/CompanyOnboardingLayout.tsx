"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloseCrossIcon, CocpitLogoIcon, LeftArrowIcon } from "@/components/icons";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";

interface CompanyOnboardingLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  onClose?: () => void;
  showClose?: boolean;
}

export const CompanyOnboardingLayout: React.FC<CompanyOnboardingLayoutProps> = ({
  children,
  onBack,
  showBack = false,
  onClose,
  showClose = true,
}) => {
  const router = useRouter();
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleCloseClick = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setShowConfirmClose(true);
    }
  }, [onClose]);

  const handleStay = useCallback(() => {
    setShowConfirmClose(false);
  }, []);

  const handleLeave = useCallback(() => {
    setShowConfirmClose(false);
    router.replace("/feed");
  }, [router]);

  return (
    <main 
      className="min-h-screen w-full bg-ds-bg text-ds-text-primary relative flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden font-['DM_Sans',sans-serif] p-0 select-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* Top Left: Back Button */}
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="fixed left-6 top-8 sm:left-[40px] sm:top-[40px] h-[24px] flex flex-row items-center p-0 gap-[8px] cursor-pointer text-ds-text-primary hover:opacity-80 transition-opacity z-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)] rounded"
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <LeftArrowIcon size={20} className="w-[20px] h-[20px] text-ds-text-primary" />
          </div>
          <span className="h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center text-ds-text-primary">
            Back
          </span>
        </button>
      )}

      {/* Top Right: Close (X) Button */}
      {showClose && (
        <button
          type="button"
          onClick={handleCloseClick}
          aria-label="Close"
          className="fixed right-6 top-8 sm:right-[40px] sm:top-[40px] w-[24px] h-[24px] flex flex-row items-center justify-center p-0 text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer z-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ds-accent)] rounded"
        >
          <CloseCrossIcon className="w-[20px] h-[20px] text-ds-text-primary" size={20} />
        </button>
      )}

      {/* Center Content Area */}
      <div className="w-full flex items-center justify-center z-10 my-auto py-3 sm:py-4 px-4">
        {children}
      </div>

      {/* Bottom Right: Cocpit Logo Mark */}
      <div className="fixed right-6 bottom-6 sm:right-[40px] sm:bottom-[40px] z-30 pointer-events-auto hidden sm:block">
        <Link
          href="https://cocpit.in"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cocpit"
          className="block relative text-ds-text-primary hover:opacity-80 transition-opacity"
        >
          <CocpitLogoIcon className="w-[27px] h-[30px]" fill="currentColor" />
        </Link>
      </div>

      {/* Exit Confirmation Dialog */}
      <ActionConfirmModal
        isOpen={showConfirmClose}
        onClose={handleStay}
        onConfirm={handleLeave}
        title="Exit business setup?"
        description="Your business page hasn't been published yet. Are you sure you want to leave?"
        confirmText="Exit setup"
        cancelText="Keep editing"
        confirmColor="accent"
        modalClassName="w-[264px] min-h-0 justify-start p-3 gap-4 rounded-2xl bg-ds-bg border border-ds-border overflow-hidden"
        buttonWidthClass="flex-1"
      />
    </main>
  );
};

export default CompanyOnboardingLayout;
