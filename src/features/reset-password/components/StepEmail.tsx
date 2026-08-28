"use client";

import React from "react";
import Link from "next/link";
import UnderlineInput from "./UnderlineInput";
import PillButton from "./PillButton";

interface StepEmailProps {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  isEmailValid: boolean;
}

export const StepEmail: React.FC<StepEmailProps> = ({
  email,
  onEmailChange,
  onSubmit,
  isLoading,
  errorMessage,
  onClearError,
  isEmailValid,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-[40px] font-bold font-['DM_Sans'] leading-[48px] tracking-tight">
          <span className="text-[#FFECE6]">Reset your </span>
          <span className="text-[#EC6229]">password</span>
        </h1>
        <p className="text-base font-semibold font-['DM_Sans'] leading-6 text-[#FFECE6] max-w-[408px]">
          Enter the email associated with your account and we&apos;ll send you a verification code
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="flex flex-col items-center gap-5 mt-1">
        <UnderlineInput
          id="email-input"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            onEmailChange(e.target.value);
            if (errorMessage) onClearError();
          }}
          onFocus={() => {
            if (errorMessage) onClearError();
          }}
          errorMessage={errorMessage}
          disabled={isLoading}
          required
        />

        <PillButton
          type="submit"
          label="Continue"
          disabled={!isEmailValid || isLoading}
          isLoading={isLoading}
        />
      </form>

      {/* Footer Link */}
      <div className="text-center text-xs font-['DM_Sans'] leading-4">
        <span className="text-[#B8ADA8] font-normal">Remember your password? </span>
        <Link href="/" className="hover:underline">
          <span className="text-[#FFECE6] font-medium">Log in</span>
        </Link>
      </div>
    </div>
  );
};

export default StepEmail;
