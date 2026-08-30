"use client";

import React from "react";
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
  const handleClose =
    onClose ||
    (async () => {
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
    });

  return (
    <main
      data-theme="dark"
      className="h-screen w-full bg-[#030303] text-[#FFECE6] relative flex flex-col items-center justify-center overflow-hidden font-['DM_Sans',sans-serif] p-0 select-none"
      style={{ backgroundColor: "#030303" }}
    >
      {/* Top Left: Back Button (Frame 2609475: top: 40px, left: 40px) */}
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="absolute left-[40px] top-[40px] h-[24px] flex flex-row items-center p-0 gap-[8px] cursor-pointer text-[#FFECE6] hover:opacity-80 transition-opacity z-20"
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <LeftArrowIcon size={20} className="w-[20px] h-[20px] text-[#FFECE6]" />
          </div>
          <span className="h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-center text-[#FFECE6]">
            Back
          </span>
        </button>
      )}

      {/* Top Right: Close / Cross Button (top: 40px, right: 40px) */}
      {showClose && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-[40px] top-[40px] w-[24px] h-[24px] flex flex-row items-center justify-center p-0 text-[#FFECE6] hover:opacity-80 transition-opacity cursor-pointer z-20"
        >
          <CloseCrossIcon className="w-[20px] h-[20px] text-[#FFECE6]" size={20} />
        </button>
      )}

      {/* Center Content Area */}
      <div className="w-full flex items-center justify-center z-10 my-auto">
        {children}
      </div>

      {/* Bottom Right: Company Logo Mark */}
      <div className="absolute right-[40px] bottom-[40px] z-20 pointer-events-auto">
        <Link
          href="https://cocpit.in"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cocpit"
          className="block relative text-[#FFECE6] hover:opacity-80 transition-opacity"
        >
          <CocpitLogoIcon className="w-[27px] h-[30px]" />
        </Link>
      </div>
    </main>
  );
};

export default OnboardingLayout;
