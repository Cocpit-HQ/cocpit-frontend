"use client";

import React, { useState, useRef, useEffect } from "react";
import { CalendarIcon } from "@/components/icons";
import { DarkCalendar } from "./DarkCalendar";

interface OnboardingDatePickerProps {
  value: string; // Stored as "YYYY-MM-DD"
  displayValue: string; // Formatted as "DD/MM/YYYY"
  onChange: (isoDate: string, formattedDisplay: string) => void;
  errorMessage?: string | null;
  disabled?: boolean;
}

export const OnboardingDatePicker: React.FC<OnboardingDatePickerProps> = ({
  value,
  displayValue,
  onChange,
  errorMessage,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic placement on open to prevent clipping
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < popoverHeight && spaceAbove > 150) {
        setPlacement("top");
      } else {
        setPlacement(spaceAbove > spaceBelow ? "top" : "bottom");
      }
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDateChange = (isoDate: string, formattedDisplay: string) => {
    onChange(isoDate, formattedDisplay);
    setIsOpen(false);
  };

  return (
    <div className="relative w-[260px] h-[60px] select-none" ref={containerRef}>
      {/* Underline Input Trigger (Frame: 260px x 36px) */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-[260px] h-[36px] border-b flex items-center justify-between pb-2 bg-transparent cursor-pointer transition-colors ${
          errorMessage
            ? "border-[#E5484D]"
            : isOpen
            ? "border-[#EC6229]"
            : "border-[#2C2C33] hover:border-[#726B67]"
        }`}
      >
        <span
          className={`font-['DM_Sans'] text-[14px] leading-[20px] font-normal ${
            displayValue ? "text-[#FFECE6]" : "text-[#726B67]"
          }`}
        >
          {displayValue || "Date of birth"}
        </span>
        <div className="w-5 h-5 flex items-center justify-center text-[#FFECE6]">
          <CalendarIcon size={16} className="w-4 h-4 text-[#FFECE6]" />
        </div>
      </div>

      {/* Helper / Error Status text */}
      <div className="w-[260px] h-[16px] flex items-center justify-start mt-[4px]">
        {errorMessage ? (
          <span className="font-['DM_Sans'] text-[10px] leading-[12px] text-[#E5484D]">
            {errorMessage}
          </span>
        ) : null}
      </div>

      {/* Custom Dark Theme Calendar Popover with Dynamic Placement */}
      {isOpen && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
            placement === "top" ? "bottom-[48px]" : "top-[44px]"
          }`}
        >
          <DarkCalendar
            value={value}
            onChange={handleDateChange}
          />
        </div>
      )}
    </div>
  );
};

export default OnboardingDatePicker;
