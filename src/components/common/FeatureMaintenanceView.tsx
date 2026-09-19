"use client";

import React from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface FeatureMaintenanceViewProps {
  title?: string;
  message?: string;
  moduleName?: string;
  onRefresh?: () => void;
  onClose?: () => void;
}

export const FeatureMaintenanceView: React.FC<FeatureMaintenanceViewProps> = ({
  title,
  message,
  moduleName,
  onRefresh,
  onClose,
}) => {
  const router = useRouter();

  const displayTitle = title || "We’re building something worth coming back to";
  const displayMessage = message || "We’re still refining the experience behind the scenes. Thanks for being here while we make it better.";

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#030303] flex flex-col items-center justify-center p-6 text-center select-none font-['DM_Sans'] overflow-hidden">
      {/* Top Right Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 sm:top-10 sm:right-10 p-2 text-[#FFECE6] hover:opacity-75 transition-opacity outline-none rounded-full cursor-pointer z-20"
        aria-label="Close"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
      </button>

      {/* Main Content Box (Frame 2609776) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-[524px] w-full flex flex-col items-center gap-[20px] z-10 px-4"
      >
        {/* Chips Badge */}
        <div className="inline-flex flex-row justify-center items-center px-[12px] py-[8px] gap-[10px] bg-[#1A1A20] border border-[#2C2C33] rounded-[100px] shadow-sm">
          {/* Ellipse 15 Indicator Dot */}
          <span className="w-[4px] h-[4px] rounded-full bg-[#EC6229] shadow-[-1px_-1px_4px_rgba(255,236,230,0.4),1px_1px_4px_rgba(255,236,230,0.4)] shrink-0" />
          
          <span className="font-['DM_Sans'] font-semibold text-[14px] sm:text-[16px] leading-[24px] text-[#FFECE6]">
            Work in progress
          </span>
        </div>

        {/* Title */}
        <h1 className="font-['DM_Sans'] font-bold text-[28px] sm:text-[40px] leading-[36px] sm:leading-[48px] text-center text-[#FFECE6] tracking-tight self-stretch">
          {displayTitle}
        </h1>

        {/* Subtitle / Message */}
        <p className="font-['DM_Sans'] font-medium text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-center text-[#B8ADA8] self-stretch">
          {displayMessage}
        </p>
      </motion.div>

      {/* Bottom Right Logo Accent */}
      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-10 opacity-90 pointer-events-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 19C19 16.2386 16.7614 14 14 14H19V19Z" fill="#FFECE6"/>
          <path d="M14 19C11.2386 19 9 16.7614 9 14C9 11.2386 11.2386 9 14 9C16.7614 9 19 11.2386 19 14V19H14Z" fill="#FFECE6"/>
        </svg>
      </div>
    </div>
  );
};
