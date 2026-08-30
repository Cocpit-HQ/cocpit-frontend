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
        className="box-border w-[306px] h-[144px] p-[8px_12px] bg-[#222228] border border-[#2C2C33] rounded-[16px] flex flex-col items-center gap-[16px] shadow-2xl font-['DM_Sans',sans-serif]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
      >
        {/* Frame 2609475: Header Text Block (width: 280px, height: 72px) */}
        <div className="w-[280px] h-[72px] flex flex-col items-center gap-[8px] p-0 text-center">
          {/* Title: Log out of other devices? */}
          <h2
            id="logout-modal-title"
            className="w-[199px] h-[24px] text-base font-medium font-['DM_Sans'] leading-[24px] text-[#FFECE6] text-center"
          >
            Log out of other devices?
          </h2>
          {/* Subtitle: Your password has been updated. Would you like to log out of all other devices? */}
          <p className="w-[280px] h-[40px] text-sm font-normal font-['DM_Sans'] leading-[20px] text-center text-[#B8ADA8]">
            Your password has been updated. Would you like to log out of all other devices?
          </p>
        </div>

        {/* Frame 2609474: Buttons Row (width: 280px, height: 38px) */}
        <div className="w-[280px] h-[38px] flex flex-row justify-center items-start gap-[8px] p-0">
          {/* Button 1: Secondary "Keep signed in" (width: 136px, height: 38px) */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleAction(false)}
            className="box-border w-[136px] h-[38px] px-3 py-1.5 border border-[#2C2C33] rounded-[100px] bg-transparent hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {isLoading && clickedAction === "keep" ? (
              <LoadingIcon
                className="w-5 h-5 animate-spin-smooth text-[#B8ADA8] shrink-0"
                style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
              />
            ) : (
              <span className="text-base font-medium font-['DM_Sans'] leading-[24px] text-[#FFECE6] text-center whitespace-nowrap">
                Keep signed in
              </span>
            )}
          </button>

          {/* Button 2: Primary "Log out" (width: 136px, height: 38px) */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleAction(true)}
            className="box-border w-[136px] h-[38px] px-3 py-1.5 bg-[#1A1A20] hover:bg-[#2C2C33] rounded-[100px] transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {isLoading && clickedAction === "logout" ? (
              <LoadingIcon
                className="w-5 h-5 animate-spin-smooth text-[#B8ADA8] shrink-0"
                style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
              />
            ) : (
              <span className="text-base font-medium font-['DM_Sans'] leading-[24px] text-[#FFECE6] text-center whitespace-nowrap">
                Log out
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutOtherDevicesModal;
