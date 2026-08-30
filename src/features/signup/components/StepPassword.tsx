"use client";

import React, { useState } from "react";
import { EyeIcon, EyeOffIcon, LoadingIcon } from "@/components/icons";

interface StepPasswordProps {
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
}

export const StepPassword: React.FC<StepPasswordProps> = ({
  password,
  onPasswordChange,
  onSubmit,
  isLoading,
  errorMessage,
  onClearError,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Requirement priority as specified:
  // 1. At least 8 characters
  // 2. At least 1 uppercase
  // 3. At least 1 number
  // 4. At least 1 special character
  const getPasswordHint = (pwd: string): string => {
    if (!pwd || pwd.length < 8) {
      return "At least 8 characters";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "At least 1 uppercase";
    }
    if (!/[0-9]/.test(pwd)) {
      return "At least 1 number";
    }
    if (!/[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(pwd)) {
      return "At least 1 special character";
    }
    return "";
  };

  const currentHint = getPasswordHint(password);
  const isPasswordValid = currentHint === "";

  return (
    <div className="w-full max-w-[390px] p-4 rounded-3xl flex flex-col items-center gap-5 font-['DM_Sans',sans-serif] text-[#FFECE6]">
      {/* Title & Subtitle */}
      <div className="w-full max-w-[358px] flex flex-col items-center gap-3 text-center">
        {/* Title: Create password */}
        <h1 className="w-full text-[40px] font-bold font-['DM_Sans'] leading-[48px] text-center tracking-tight">
          <span className="text-[#FFECE6]">Create </span>
          <span className="text-[#EC6229]">password</span>
        </h1>
        {/* Subtitle: Choose a new password for your account */}
        <p className="w-full text-base font-semibold font-['DM_Sans'] leading-6 text-[#FFECE6] text-center">
          Choose a new password for your account
        </p>
      </div>

      {/* Form with Input & Button */}
      <form onSubmit={onSubmit} className="flex flex-col items-center gap-5 mt-1">
        {/* Input Block: Password (width: 260px, height: 60px) */}
        <div className="w-[260px] flex flex-col items-start gap-2">
          <div
            className={`w-[260px] h-9 py-2 border-b border-[#2C2C33] flex flex-row justify-between items-center gap-1 focus-within:border-[#EC6229] transition-colors ${
              errorMessage ? "!border-[#E5484D]" : ""
            }`}
          >
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => {
                onPasswordChange(e.target.value);
                if (errorMessage) onClearError();
              }}
              onFocus={() => {
                if (errorMessage) onClearError();
              }}
              disabled={isLoading}
              maxLength={15}
              className={`w-full bg-transparent border-none outline-none text-[#FFECE6] placeholder:text-[#726B67] text-sm font-normal font-['DM_Sans'] leading-5 text-left placeholder:text-left ${
                !showPassword && password.length > 0 ? "tracking-[2px]" : ""
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="w-4 h-4 p-0.5 flex items-center justify-center text-[#726B67] hover:text-[#FFECE6] transition-colors cursor-pointer shrink-0"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeIcon className="w-4 h-4 shrink-0" size={16} />
              ) : (
                <EyeOffIcon className="w-4 h-4 shrink-0" size={16} />
              )}
            </button>
          </div>

          {/* Note below input (width: 260px, height: 16px) */}
          <div className="w-[260px] h-4 flex items-center">
            {errorMessage ? (
              <span className="w-full font-['DM_Sans'] font-normal text-xs leading-4 text-[#E5484D] text-left">
                {errorMessage}
              </span>
            ) : (
              <span className="w-full font-['DM_Sans'] font-normal text-xs leading-4 text-[#B8ADA8] text-left">
                {currentHint}
              </span>
            )}
          </div>
        </div>

        {/* Primary Button (width: 260px, height: 36px, rounded: 100px) */}
        <button
          type="submit"
          disabled={!isPasswordValid || isLoading}
          className={`w-[260px] h-9 px-3 py-1.5 bg-[#1A1A20] rounded-[100px] inline-flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] leading-[21px] transition-all ${
            isPasswordValid && !isLoading
              ? "text-[#FFECE6] hover:bg-[#222228] cursor-pointer shadow-[0_0_0_1px_#27272A]"
              : "text-[#726B67] opacity-60"
          }`}
        >
          {isLoading ? (
            <LoadingIcon
              className="w-6 h-6 animate-spin-smooth text-[#B8ADA8] shrink-0"
              style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
            />
          ) : (
            "Set password"
          )}
        </button>
      </form>
    </div>
  );
};

export default StepPassword;

