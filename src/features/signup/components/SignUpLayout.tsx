"use client";

import React from "react";
import Link from "next/link";
import { CloseCrossIcon, CocpitLogoIcon } from "@/components/icons";
import { AuthSidebarLinks } from "@/features/auth";

interface SignUpLayoutProps {
  children: React.ReactNode;
  step?: "EMAIL" | "OTP" | "PASSWORD";
  onClose?: () => void;
  showClose?: boolean;
}

export const SignUpLayout: React.FC<SignUpLayoutProps> = ({
  children,
  step = "EMAIL",
  onClose,
  showClose = false,
}) => {
  const isSubStep = step !== "EMAIL";
  const canDismiss = showClose || (isSubStep && Boolean(onClose));

  return (
    <main
      data-theme="dark"
      className="min-h-screen w-full bg-[#030303] text-[#FFECE6] relative flex items-center justify-center overflow-x-hidden font-['DM_Sans',sans-serif] px-4 py-12"
    >
      {/* Left Sidebar Navigation (Desktop: 40px from left edge, vertically centered) */}
      {!isSubStep && (
        <div className="hidden lg:block absolute left-[40px] top-1/2 -translate-y-1/2 z-10">
          <AuthSidebarLinks />
        </div>
      )}

      {/* Top Right: Dismiss / Close Button (visible on OTP and PASSWORD steps) */}
      {canDismiss && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-6 top-6 lg:right-[40px] lg:top-[40px] w-5 h-5 flex flex-row items-center justify-center p-0 gap-2 text-[#FFECE6] hover:opacity-80 transition-opacity cursor-pointer z-20"
        >
          <CloseCrossIcon className="w-5 h-5 text-[#FFECE6]" size={20} />
        </button>
      )}

      {/* Main Centered Box Container */}
      <div className="w-full max-w-[540px] p-4 rounded-3xl flex flex-col items-center gap-5 z-10">
        {children}
      </div>

      {/* Mobile/Tablet Bottom Navigation Links (on initial step) */}
      {!isSubStep && (
        <div className="lg:hidden fixed bottom-0 left-0 w-full px-4 py-4 bg-[#030303]/90 backdrop-blur-md border-t border-zinc-900 flex justify-center z-10">
          <AuthSidebarLinks isMobile />
        </div>
      )}

      {/* Bottom Right: Company Logo Mark */}
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-10 pointer-events-auto">
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

export default SignUpLayout;
