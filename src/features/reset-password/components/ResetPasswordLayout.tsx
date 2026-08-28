"use client";

import React from "react";
import Link from "next/link";
import { CloseCrossIcon, CocpitLogoIcon } from "@/components/icons";

interface ResetPasswordLayoutProps {
  children: React.ReactNode;
  onClose?: () => void;
  showClose?: boolean;
  onBack?: () => void;
  showBack?: boolean;
}

export const ResetPasswordLayout: React.FC<ResetPasswordLayoutProps> = ({
  children,
  onClose,
  showClose = true,
  onBack,
  showBack = true,
}) => {
  const handleDismiss = onClose || onBack;
  const isVisible = (onClose ? showClose : showBack) && Boolean(handleDismiss);

  return (
    <main
      data-theme="dark"
      className="min-h-screen w-full bg-[#030303] text-[#FFECE6] relative flex flex-col items-center justify-center overflow-x-hidden font-['DM_Sans',sans-serif] px-4 py-12"
    >
      {/* Top Right: Cross Button (Frame 2609473 - width: 20px, height: 20px, right: 40px, top: 40px) */}
      {isVisible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute right-6 top-6 lg:right-[40px] lg:top-[40px] w-5 h-5 flex flex-row items-center justify-center p-0 gap-2 text-[#FFECE6] hover:opacity-80 transition-opacity cursor-pointer z-20"
        >
          <CloseCrossIcon className="w-5 h-5 text-[#FFECE6]" size={20} />
        </button>
      )}

      {/* Center Container */}
      <div className="w-full max-w-[540px] p-4 rounded-3xl flex flex-col items-center gap-5 z-10">
        {children}
      </div>

      {/* Bottom Right: Company Logo Mark */}
      <div className="absolute right-6 bottom-6 lg:right-[40px] lg:bottom-[40px] z-20 pointer-events-auto">
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

export default ResetPasswordLayout;
