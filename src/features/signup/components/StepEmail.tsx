"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { GoogleIcon, AppleIcon, LoadingIcon, MailWarningIcon, SendIcon } from "@/components/icons";
import UnderlineInput from "./UnderlineInput";
import PillButton from "./PillButton";
import { PendingDeletionInfo } from "../types/signup.types";

interface StepEmailProps {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  isGoogleLoading: boolean;
  isAppleLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  isEmailValid: boolean;
  onGoogleLogin: (idToken: string) => void;
  onAppleLogin: () => void;
  pendingDeletion?: PendingDeletionInfo | null;
  onResendRecovery?: () => void;
  isResending?: boolean;
  resendCooldown?: number;
}

export const StepEmail: React.FC<StepEmailProps> = ({
  email,
  onEmailChange,
  onSubmit,
  isLoading,
  isGoogleLoading,
  isAppleLoading,
  errorMessage,
  onClearError,
  isEmailValid,
  onGoogleLogin,
  onAppleLogin,
  pendingDeletion,
  onResendRecovery,
  isResending = false,
  resendCooldown = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnyLoading = isLoading || isGoogleLoading || isAppleLoading;

  return (
    <div className="w-full flex flex-col items-center gap-5 text-center font-['DM_Sans',sans-serif] text-ds-text-primary">
      {/* Title Section (Frame 2608511) */}
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-[40px] font-bold font-['DM_Sans'] leading-[48px] tracking-tight">
          <span className="text-ds-text-primary">Create your </span>
          <span className="text-ds-accent">account</span>
        </h1>
        <p className="text-base font-semibold font-['DM_Sans'] leading-6 text-ds-text-primary max-w-[295px]">
          Start building your professional profile
        </p>
      </div>

      {/* Account Pending Deletion Warning Banner */}
      {pendingDeletion && (
        <div className="w-[260px] p-3 bg-ds-surface-1 border border-ds-border rounded-xl flex flex-col gap-2 text-xs text-ds-text-secondary text-left">
          <div className="flex items-start gap-2">
            <MailWarningIcon className="w-4 h-4 text-ds-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-ds-text-primary">Account scheduled for deletion</p>
              <p className="text-ds-text-secondary text-[11px] mt-0.5">
                Your account will be permanently deleted on{" "}
                <strong>
                  {new Date(pendingDeletion.deletionDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
                .
              </p>
            </div>
          </div>
          {onResendRecovery && (
            <button
              type="button"
              onClick={onResendRecovery}
              disabled={isResending || resendCooldown > 0}
              className="inline-flex items-center gap-1.5 bg-ds-accent text-white rounded-full px-3 py-1 text-xs font-medium self-start disabled:opacity-60 cursor-pointer"
            >
              <SendIcon className="w-3 h-3" />
              {isResending
                ? "Sending..."
                : resendCooldown > 0
                ? `Resend in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, "0")}`
                : "Resend Recovery Email"}
            </button>
          )}
        </div>
      )}

      {/* Main Email Form */}
      <form onSubmit={onSubmit} className="flex flex-col items-center gap-5 mt-1">
        {/* Email Input Section */}
        <UnderlineInput
          id="email-input"
          type="email"
          autoComplete="username"
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
          disabled={isAnyLoading}
          required
        />

        {/* Action Section (width: 260px, gap: 12px) */}
        <div className="w-[260px] flex flex-col items-center gap-3">
          {/* Continue Button */}
          <PillButton
            type="submit"
            label="Continue"
            disabled={!isEmailValid || isAnyLoading}
            isLoading={isLoading}
          />

          {/* Google Sign In Button */}
          <div className="relative w-[260px] h-9 rounded-[100px] cursor-pointer overflow-hidden" ref={containerRef}>
            <div className="w-[260px] h-9 px-3 py-1.5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-ds-border inline-flex justify-center items-center gap-[10px] hover:bg-ds-surface-2 transition-all pointer-events-none cursor-pointer">
              <GoogleIcon className="w-4 h-4 shrink-0" size={16} />
              <span className="font-['DM_Sans'] font-medium text-base leading-6 text-ds-text-primary text-left shrink-0">
                Continue with Google
              </span>
            </div>

            {/* Full-coverage functional Google Login button */}
            <div className="absolute inset-0 opacity-[0.0001] cursor-pointer overflow-hidden rounded-[100px] [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:!cursor-pointer">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    onGoogleLogin(credentialResponse.credential);
                  }
                }}
                onError={() => {
                  // Google login error
                }}
                text="continue_with"
                shape="pill"
                size="large"
                width="260"
              />
            </div>
          </div>

          {/* Apple Sign In Button */}
          <button
            type="button"
            disabled={isAnyLoading}
            className="self-stretch w-[260px] h-9 px-3 py-1.5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-ds-border inline-flex justify-center items-center gap-[10px] hover:bg-ds-surface-2 transition-all cursor-pointer disabled:opacity-60"
            onClick={onAppleLogin}
          >
            {isAppleLoading ? (
              <LoadingIcon
                className="w-5 h-5 animate-spin-smooth text-ds-text-secondary shrink-0"
                style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
              />
            ) : (
              <>
                <AppleIcon className="w-4 h-4 shrink-0 text-ds-text-primary" size={16} />
                <span className="font-['DM_Sans'] font-medium text-base leading-6 text-ds-text-primary text-left shrink-0">
                  Continue with Apple
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Already Have An Account Link */}
      <div className="text-center text-xs font-['DM_Sans'] leading-4">
        <span className="text-ds-text-muted font-normal">Already have an account? </span>
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <span className="text-ds-text-primary font-medium">Log in</span>
        </Link>
      </div>

      {/* Terms & Conditions / User Policy Notice */}
      <div className="w-[298px] text-center text-[10px] font-['DM_Sans'] leading-3 text-ds-text-secondary">
        <span>By continuing, you agree to our </span>
        <Link href="https://cocpit.in/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="!text-ds-text-primary hover:opacity-80 transition-opacity">
          Terms &amp; Conditions
        </Link>
        <span> and acknowledge our </span>
        <Link href="https://cocpit.in/privacy-policy" target="_blank" rel="noopener noreferrer" className="!text-ds-text-primary hover:opacity-80 transition-opacity">
          User Policy
        </Link>
      </div>
    </div>
  );
};

export default StepEmail;
