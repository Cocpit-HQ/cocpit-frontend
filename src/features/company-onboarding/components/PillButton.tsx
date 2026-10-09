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
      className={`w-full sm:w-64 h-9 px-3 py-1.5 bg-ds-surface-1 rounded-[100px] inline-flex justify-center items-center gap-2.5 font-['DM_Sans',sans-serif] font-medium text-[16px] leading-[24px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] ${
        isDisabled
          ? "text-ds-text-muted cursor-not-allowed"
          : "text-ds-text-primary hover:bg-ds-surface-2 cursor-pointer shadow-[0_0_0_1px_var(--ds-border)] active:scale-[0.98]"
      } ${className}`}
    >
      {isLoading ? (
        <LoadingIcon
          className="w-5 h-5 animate-spin text-ds-text-secondary shrink-0"
        />
      ) : (
        children || label
      )}
    </button>
  );
};

export default PillButton;
