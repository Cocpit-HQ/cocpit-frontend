"use client";

import React, { useEffect, useState } from "react";
import { LoadingIcon } from "@/components/icons";

interface LogoutOtherDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (logoutOtherDevices: boolean) => void;
  isLoading: boolean;
}

export const LogoutOtherDevicesModal: React.FC<LogoutOtherDevicesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [clickedAction, setClickedAction] = useState<"keep" | "logout" | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Reset clicked action when modal closes or loading stops
  useEffect(() => {
    if (!isLoading) {
      setClickedAction(null);
    }
  }, [isLoading, isOpen]);

  if (!isOpen) return null;

  const handleAction = (logoutOtherDevices: boolean) => {
    setClickedAction(logoutOtherDevices ? "logout" : "keep");
    onConfirm(logoutOtherDevices);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      {/* Frame 2609473: Popover Box */}
      <div
        className="box-border w-[302px] h-[150px] p-[12px] bg-ds-bg border border-ds-border rounded-[16px] flex flex-col items-center gap-[16px] shadow-2xl font-['DM_Sans',sans-serif]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
      >
        {/* Frame 2609475: Header Text Block (width: 276px, height: 72px) */}
        <div className="w-[276px] h-[72px] flex flex-col items-center gap-[8px] p-0 text-center">
          {/* Title: Log out of other devices? */}
          <h2
            id="logout-modal-title"
            className="w-[199px] h-[24px] text-base font-medium font-['DM_Sans'] leading-[24px] text-ds-text-primary text-center"
          >
            Log out of other devices?
          </h2>
          {/* Subtitle: Your password has been updated. Would you like to log out of all other devices? */}
          <p className="w-[276px] h-[40px] text-sm font-normal font-['DM_Sans'] leading-[20px] text-center text-ds-text-secondary">
            Your password will be updated. Would you like to log out of all other devices?
          </p>
        </div>

        {/* Frame 2609474: Buttons Row (width: 276px, height: 36px) */}
        <div className="w-[276px] h-[36px] flex flex-row justify-center items-start gap-[8px] p-0">
          {/* Button 1: Primary "Log out" (width: 134px, height: 36px) */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleAction(true)}
            className="box-border w-[134px] h-[36px] px-3 py-1.5 bg-ds-accent hover:opacity-90 rounded-[100px] transition-opacity flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {isLoading && clickedAction === "logout" ? (
              <LoadingIcon
                className="w-5 h-5 animate-spin-smooth text-white shrink-0"
                style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
              />
            ) : (
              <span className="text-base font-medium font-['DM_Sans'] leading-[24px] text-white text-center whitespace-nowrap">
                Log out
              </span>
              
            )}
          </button>

          {/* Button 2: Secondary "Keep signed in" (width: 134px, height: 36px) */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleAction(false)}
            className="box-border w-[134px] h-[36px] px-3 py-1.5 border border-ds-border rounded-[100px] bg-transparent hover:bg-ds-surface-1 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {isLoading && clickedAction === "keep" ? (
              <LoadingIcon
                className="w-5 h-5 animate-spin-smooth text-ds-text-primary shrink-0"
                style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
              />
            ) : (
              <span className="text-base font-medium font-['DM_Sans'] leading-[24px] text-ds-text-primary text-center whitespace-nowrap">
                Keep signed in
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutOtherDevicesModal;
