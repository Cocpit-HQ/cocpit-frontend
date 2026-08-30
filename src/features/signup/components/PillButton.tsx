"use client";

import React from "react";
import { LoadingIcon } from "@/components/icons";

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  label?: string;
  children?: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({
  isLoading = false,
  label,
  children,
  disabled,
  className = "",
  type = "submit",
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      className={`w-[260px] h-9 px-3 py-1.5 bg-[#1A1A20] rounded-[100px] inline-flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] leading-[21px] transition-all ${
        isDisabled
          ? "text-[#726B67] opacity-60"
          : "text-[#FFECE6] hover:bg-[#222228] cursor-pointer shadow-[0_0_0_1px_#27272A]"
      } ${className}`}
    >
      {isLoading ? (
        <LoadingIcon
          className="w-6 h-6 animate-spin-smooth text-[#B8ADA8] shrink-0"
          style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
        />
      ) : (
        children || label
      )}
    </button>
  );
};

export default PillButton;
