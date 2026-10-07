"use client";

import React from "react";
import { CloseCrossIcon } from "@/components/icons";
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
      className="min-h-screen w-full bg-ds-bg text-ds-text-primary relative flex items-center justify-center overflow-x-hidden font-['DM_Sans',sans-serif] px-4 py-12"
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
          className="absolute right-6 top-10 lg:right-[40px] lg:top-[40px] w-5 h-5 flex flex-row items-center justify-center p-0 gap-2 text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer z-20"
        >
          <CloseCrossIcon className="w-5 h-5 text-ds-text-primary" size={20} />
        </button>
      )}

      {/* Main Centered Box Container */}
      <div className="w-full max-w-[540px] p-4 rounded-3xl flex flex-col items-center gap-5 z-10">
        {children}
      </div>

      {/* Mobile/Tablet Bottom Navigation Links (on initial step) */}
      {!isSubStep && (
        <div className="hidden sm:flex lg:hidden fixed bottom-0 left-0 w-full px-4 py-4 bg-ds-bg/90 backdrop-blur-md border-t border-ds-border justify-center z-10">
          <AuthSidebarLinks isMobile />
        </div>
      )}
    </main>
  );
};

export default SignUpLayout;
