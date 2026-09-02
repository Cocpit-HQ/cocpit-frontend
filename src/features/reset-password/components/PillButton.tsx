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
      className={`w-[260px] h-9 px-3 py-1.5 bg-ds-surface-1 rounded-[100px] inline-flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] leading-[21px] transition-all ${
        isDisabled
          ? "text-ds-text-muted opacity-60"
          : "text-ds-text-primary hover:bg-ds-surface-2 cursor-pointer shadow-[0_0_0_1px_var(--ds-border)]"
      } ${className}`}
    >
      {isLoading ? (
        <LoadingIcon
          className="w-6 h-6 animate-spin-smooth text-ds-text-secondary shrink-0"
          style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
        />
      ) : (
        children || label
      )}
    </button>
  );
};

export default PillButton;
