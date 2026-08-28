"use client";

import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

interface UnderlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  errorMessage?: string | null;
  showPasswordToggle?: boolean;
  isPassword?: boolean;
  containerClassName?: string;
  centerText?: boolean;
}

export const UnderlineInput: React.FC<UnderlineInputProps> = ({
  errorMessage,
  showPasswordToggle = false,
  isPassword = false,
  containerClassName = "",
  centerText = false,
  className = "",
  value,
  onChange,
  disabled,
  placeholder,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : props.type || "text";

  return (
    <div className={`w-[260px] flex flex-col items-center gap-2 ${containerClassName}`}>
      {/* Input container with bottom border */}
      <div
        className={`w-[260px] h-9 py-2 border-b border-[#2C2C33] inline-flex items-center justify-between gap-1 focus-within:border-[#EC6229] transition-colors ${
          errorMessage ? "!border-[#E5484D]" : ""
        }`}
      >
        <input
          {...props}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-transparent border-none outline-none text-[#FFECE6] placeholder:text-[#726B67] text-sm font-normal font-['DM_Sans'] leading-5 text-left placeholder:text-left autofill:bg-transparent ${
            centerText ? "text-center placeholder:text-center" : "text-left placeholder:text-left"
          } ${isPassword && !showPassword && value ? "tracking-[2px]" : ""} ${className}`}
        />

        {/* Eye icon toggle for password */}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="w-4 h-4 inline-flex justify-center items-center text-[#726B67] hover:text-[#FFECE6] transition-colors cursor-pointer shrink-0"
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

      {/* Reserved Supporting Area for Error Feedback to prevent layout shifts */}
      <div className="w-[260px] h-4 flex items-center">
        {errorMessage && (
          <span className="w-[260px] h-4 font-['DM_Sans'] font-normal text-xs leading-4 text-[#E5484D] text-left">
            {errorMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default UnderlineInput;
