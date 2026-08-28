"use client";

import React, { useEffect, useState } from "react";

export interface BottomToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export const BottomToast: React.FC<BottomToastProps> = ({
  message,
  duration = 3500,
  onClose,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fading out slightly before unmounting
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, Math.max(0, duration - 300));

    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  if (!isVisible || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-[36px] right-[87px] z-50 box-border h-[38px] px-4 py-2 bg-[#222228] border border-[#2C2C33] rounded-[8px] flex items-center justify-center shadow-2xl font-['DM_Sans',sans-serif] pointer-events-auto transition-all duration-300 ${
        isFadingOut ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0 animate-fade-in"
      } ${className}`}
    >
      <div className="flex items-center justify-center p-0">
        <span className="text-sm font-normal font-['DM_Sans'] leading-[20px] text-[#FFECE6] text-center whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  );
};

export default BottomToast;
