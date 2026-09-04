"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { CloseCrossIcon, CocpitLogoIcon, LeftArrowIcon } from "@/components/icons";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  onClose?: () => void;
  showClose?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  onBack,
  showBack = false,
  onClose,
  showClose = true,
}) => {
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleCloseClick = () => {
    setShowConfirmClose(true);
  };

  const handleStay = () => {
    setShowConfirmClose(false);
  };

  const handleLeave = async () => {
    if (onClose) {
      onClose();
    } else {
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("nextauth.message");
          sessionStorage.removeItem("cocpit_active_onboarding_session");
          sessionStorage.removeItem("cocpit_onboarding_step");
        }
      } catch (e) {
        // ignore
      }
      await signOut({ redirect: true, callbackUrl: "/" });
    }
  };

  return (
    <main
      className="h-[100dvh] sm:h-screen w-full bg-ds-bg text-ds-text-primary relative flex flex-col items-center justify-center overflow-hidden font-['DM_Sans',sans-serif] p-0 select-none"
    >
      {/* Top Left: Back Button (Frame 2609475: top: 40px, left: 40px) */}
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="absolute left-6 top-8 sm:left-[40px] sm:top-[40px] h-[24px] flex flex-row items-center p-0 gap-[8px] cursor-pointer text-ds-text-primary hover:opacity-80 transition-opacity z-20"
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <LeftArrowIcon size={20} className="w-[20px] h-[20px] text-ds-text-primary" />
          </div>
          <span className="h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center text-ds-text-primary">
            Back
          </span>
        </button>
      )}

      {/* Top Right: Close / Cross Button (top: 40px, right: 40px) */}
      {showClose && (
        <button
          type="button"
          onClick={handleCloseClick}
          aria-label="Close"
          className="absolute right-6 top-8 sm:right-[40px] sm:top-[40px] w-[24px] h-[24px] flex flex-row items-center justify-center p-0 text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer z-20"
        >
          <CloseCrossIcon className="w-[20px] h-[20px] text-ds-text-primary" size={20} />
        </button>
      )}

      {/* Center Content Area */}
      <div className="w-full flex items-center justify-center z-10 flex-1 sm:flex-none sm:my-auto pt-[104px] sm:pt-0 pb-6 sm:pb-0 overflow-y-auto sm:overflow-visible">
        {children}
      </div>

      {/* Company Logo Mark */}
      <div className={`absolute ${showBack ? "hidden sm:block" : "block"} left-6 top-8 sm:left-auto sm:top-auto sm:right-[40px] sm:bottom-[40px] z-20 pointer-events-auto`}>
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

      {/* Confirmation Popup */}
      {showConfirmClose && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="flex flex-col items-center p-[8px_12px] gap-[16px] bg-ds-bg border border-ds-border rounded-[16px] box-border absolute"
            style={{ width: "193px", height: "142px" }}
          >
            <div className="flex flex-col items-center p-0 gap-[8px] w-[167px] h-[72px]">
              <span className="font-medium text-[16px] leading-[24px] text-ds-text-primary whitespace-nowrap">
                Leave profile setup?
              </span>
              <span className="font-normal text-[14px] leading-[20px] text-center text-ds-text-secondary">
                Don't worry, your progress will be saved
              </span>
            </div>
            
            <div className="flex flex-row justify-center items-start p-0 gap-[8px] w-[144px] h-[36px]">
              <button
                type="button"
                onClick={handleStay}
                className="flex flex-row justify-center items-center p-[6px_12px] gap-[10px] w-[68px] h-[36px] bg-ds-accent rounded-[100px] font-medium text-[16px] leading-[24px] text-white hover:opacity-90 transition-opacity"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={handleLeave}
                className="flex flex-row justify-center items-center p-[6px_12px] gap-[10px] w-[68px] h-[36px] border border-ds-border rounded-[100px] font-medium text-[16px] leading-[24px] text-ds-text-primary hover:opacity-80 transition-opacity bg-transparent"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default OnboardingLayout;
