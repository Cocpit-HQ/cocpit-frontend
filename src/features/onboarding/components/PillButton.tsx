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
  label = "Continue",
  children,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      className={`w-[260px] h-[36px] px-3 py-1.5 bg-[#1A1A20] rounded-[100px] inline-flex justify-center items-center gap-[10px] font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[21px] transition-colors ${
        isDisabled
          ? "text-[#726B67] cursor-default"
          : "text-[#FFECE6] cursor-pointer"
      } ${className}`}
    >
      {isLoading ? (
        <LoadingIcon
          className="w-5 h-5 animate-spin-smooth text-[#B8ADA8] shrink-0"
          style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
        />
      ) : (
        children || label
      )}
    </button>
  );
};

export default PillButton;
