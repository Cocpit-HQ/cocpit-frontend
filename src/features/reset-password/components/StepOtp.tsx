"use client";

import React from "react";
import { LoadingIcon } from "@/components/icons";

interface StepOtpProps {
  email: string;
  otp: string;
  onOtpChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  isCheckingOtp: boolean;
  isOtpVerified: boolean;
  isRateLimited?: boolean;
  isLoading: boolean;
  isResending?: boolean;
  errorMessage: string | null;
  otpError: boolean;
  resendCooldown: number;
  onClearError: () => void;
}

export const StepOtp: React.FC<StepOtpProps> = ({
  email,
  otp,
  onOtpChange,
  onSubmit,
  onResend,
  isCheckingOtp,
  isOtpVerified,
  isRateLimited = false,
  isLoading,
  isResending = false,
  errorMessage,
  otpError,
  resendCooldown,
  onClearError,
}) => {
  const isOtpComplete = otp.trim().length === 6;
  const isButtonActive = (isOtpComplete || isOtpVerified) && !isCheckingOtp && !isLoading && !isRateLimited;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRateLimited) return;
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    onOtpChange(val);
    if (errorMessage || otpError) onClearError();
  };

  const formattedMinutes = Math.floor(resendCooldown / 60).toString().padStart(2, "0");
  const formattedSeconds = (resendCooldown % 60).toString().padStart(2, "0");

  const isExpired = errorMessage?.toLowerCase().includes("expired");

  return (
    <div className="w-full max-w-[540px] p-4 rounded-3xl flex flex-col items-center gap-5 font-['DM_Sans',sans-serif] text-[#FFECE6]">
      {/* Header */}
      <div className="w-full flex flex-col items-center gap-3 text-center">
        {/* Title: Verify your email */}
        <h1 className="w-full text-[40px] font-bold font-['DM_Sans'] leading-[48px] text-center tracking-tight">
          <span className="text-[#FFECE6]">Verify your </span>
          <span className="text-[#EC6229]">email</span>
        </h1>
        {/* Subtitle: We sent a 6-digit code to [email] (No truncation, full email center-aligned in 1 line) */}
        <p className="text-base font-semibold font-['DM_Sans'] leading-6 text-[#FFECE6] text-center px-1 whitespace-nowrap">
          We sent a 6-digit code to <span className="font-semibold">{email || "[email]"}</span>
        </p>
      </div>

      {/* Form with Input & Button */}
      <form onSubmit={onSubmit} className="flex flex-col items-center gap-5 mt-1">
        {/* Frame 2609471: Input error block (width: 260px, height: 60px) */}
        <div className="w-[260px] flex flex-col items-start gap-2">
          {/* Input Row (width: 260px, height: 36px) */}
          <div
            className={`w-[260px] h-9 py-2 border-b border-[#2C2C33] flex flex-row items-center gap-1 transition-colors ${
              isOtpVerified
                ? "!border-[#3FB950]"
                : otpError || errorMessage
                ? "!border-[#E5484D]"
                : "focus-within:border-[#EC6229]"
            }`}
          >
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter code"
              maxLength={6}
              value={otp}
              onChange={handleInputChange}
              onFocus={() => {
                if (errorMessage || otpError) onClearError();
              }}
              disabled={isCheckingOtp || isLoading || isRateLimited}
              className={`w-full bg-transparent border-none outline-none text-[#FFECE6] placeholder:text-[#726B67] text-sm font-normal font-['DM_Sans'] leading-5 text-left placeholder:text-left ${
                isRateLimited ? "opacity-40 cursor-not-allowed" : ""
              }`}
              required
            />
          </div>

          {/* Supporting Note Row below input (width: 260px, height: 16px, align-self: stretch) */}
          <div className="w-[260px] h-4 flex items-center justify-between self-stretch shrink-0">
            {/* Left side: Status or Error messages */}
            {isRateLimited ? (
              <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[#E5484D] text-left">
                Too many attempts
              </span>
            ) : isOtpVerified ? (
              <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[#3FB950] text-left">
                Account verified
              </span>
            ) : isExpired ? (
              <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[#E5484D] text-left">
                This code has expired
              </span>
            ) : errorMessage ? (
              <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[#E5484D] text-left">
                {errorMessage}
              </span>
            ) : (
              <span />
            )}

            {/* Right side: Timer or Resend code link (width: 260px or hug, text-right, #EC6229) */}
            {!isRateLimited && !isOtpVerified && (
              <div className="text-right flex items-center justify-end">
                {resendCooldown > 0 && !isExpired ? (
                  <span className="font-['DM_Sans'] font-normal text-xs leading-4 whitespace-nowrap flex items-center">
                    <span className="text-[#B8ADA8]">Resend code in </span>
                    <span className="text-[#EC6229] tabular-nums font-mono text-xs ml-1 inline-block min-w-[34px] text-right">
                      {formattedMinutes}:{formattedSeconds}
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={isResending || isCheckingOtp}
                    className="font-['DM_Sans'] font-normal text-xs leading-4 text-[#EC6229] hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 whitespace-nowrap text-right"
                  >
                    Resend code
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Primary Button: Continue (width: 260px, height: 36px, rounded: 100px) */}
        <button
          type="submit"
          disabled={!isButtonActive}
          className={`w-[260px] h-9 px-3 py-1.5 bg-[#1A1A20] rounded-[100px] inline-flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] leading-[21px] transition-all ${
            isButtonActive
              ? "text-[#FFECE6] hover:bg-[#222228] cursor-pointer shadow-[0_0_0_1px_#27272A]"
              : "text-[#726B67] opacity-60 cursor-not-allowed"
          }`}
        >
          {isCheckingOtp || isLoading ? (
            <LoadingIcon
              className="w-6 h-6 animate-spin-smooth text-[#B8ADA8] shrink-0"
              style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
            />
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </div>
  );
};

export default StepOtp;
