"use client";

import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

interface UnderlineInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  errorMessage?: string | null;
  helperText?: React.ReactNode;
  helperColor?: string;
  showPasswordToggle?: boolean;
  isPassword?: boolean;
  containerClassName?: string;
  centerText?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onSuffixClick?: () => void;
}

export const UnderlineInput: React.FC<UnderlineInputProps> = ({
  errorMessage,
  helperText,
  helperColor = "var(--ds-text-muted)",
  showPasswordToggle = false,
  isPassword = false,
  containerClassName = "",
  centerText = false,
  className = "",
  prefix,
  suffix,
  onSuffixClick,
  value,
  onChange,
  disabled,
  placeholder,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : props.type || "text";

  return (
    <div className={`w-[260px] h-[60px] flex flex-col items-start p-0 gap-2 font-['DM_Sans',sans-serif] ${containerClassName}`}>
      {/* Input container with bottom border: Frame / Box */}
      <div
        className={`w-[260px] h-[36px] box-border flex flex-row items-center py-2 px-0 gap-1 border-b border-ds-border focus-within:border-ds-accent transition-colors ${
          errorMessage ? "!border-ds-error" : ""
        }`}
      >
        {prefix && <div className="shrink-0 mr-1 text-ds-text-muted">{prefix}</div>}
        <input
          {...props}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-[14px] font-normal font-['DM_Sans'] leading-[20px] ${
            centerText ? "text-center placeholder:text-center" : "text-left placeholder:text-left"
          } ${isPassword && !showPassword && value ? "tracking-[2px]" : ""} ${className}`}
        />
        {suffix && (
          <div
            onClick={onSuffixClick}
            className={`shrink-0 ml-1 flex items-center justify-center ${onSuffixClick ? "cursor-pointer" : ""}`}
          >
            {suffix}
          </div>
        )}

        {/* Eye icon toggle for password */}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="w-4 h-4 inline-flex justify-center items-center text-ds-text-muted hover:text-ds-text-primary transition-colors cursor-pointer shrink-0"
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeIcon className="w-4 h-4 shrink-0" size={16} />
            ) : (
              <EyeOffIcon className="w-4 h-4 shrink-0" size={16} />
            )}
          </button>
        )}
      </div>

      {/* Reserved 16px Status / Helper / Error Line */}
      <div className="w-[260px] h-[16px] flex items-center overflow-hidden">
        {errorMessage ? (
          <span className="w-[260px] font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-ds-error text-left truncate">
            {errorMessage}
          </span>
        ) : helperText ? (
          <span
            className="w-[260px] font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-left truncate"
            style={{ color: helperColor }}
          >
            {helperText}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default UnderlineInput;
