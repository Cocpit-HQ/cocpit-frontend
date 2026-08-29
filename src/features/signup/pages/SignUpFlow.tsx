"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSignUp } from "../hooks/useSignUp";
import SignUpLayout from "../components/SignUpLayout";
import StepEmail from "../components/StepEmail";
import StepOtp from "../components/StepOtp";
import StepPassword from "../components/StepPassword";
import BottomToast from "@/shared/commonComponents/BottomToast";
import { LeaveConfirmationModal } from "@/components/shared";

export const SignUpFlow: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastParam = searchParams.get("toast");

  const {
    step,
    email,
    setEmail,
    otp,
    setOtp,
    password,
    setPassword,
    isLoading,
    isCheckingOtp,
    isOtpVerified,
    isResending,
    isGoogleLoading,
    isAppleLoading,
    isRateLimited,
    errorMessage,
    setErrorMessage,
    otpError,
    resendCooldown,
    isEmailValid,
    pendingDeletion,
    showSessionExpiredToast,
    setShowSessionExpiredToast,
    handleSendEmail,
    handleVerifyOtp,
    handleContinueFromOtp,
    handleResendOtp,
    handleRegister,
    handleGoogleLogin,
    handleAppleLogin,
    handleResendRecovery,
    handleClose,
    isMounted,
  } = useSignUp();
  
  const [isLeaveModalOpen, setIsLeaveModalOpen] = React.useState(false);


  useEffect(() => {
    if (toastParam === "session_expired") {
      setShowSessionExpiredToast(true);
    }
  }, [toastParam, setShowSessionExpiredToast]);

  const toastMessage =
    toastParam === "session_expired" || showSessionExpiredToast
      ? "Session expired"
      : toastParam;

  if (!isMounted) return null;

  return (
    <>
      <SignUpLayout step={step} onClose={step === "EMAIL" ? undefined : () => setIsLeaveModalOpen(true)} showClose={step !== "EMAIL"}>
        {step === "EMAIL" && (
          <StepEmail
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleSendEmail}
            isLoading={isLoading}
            isGoogleLoading={isGoogleLoading}
            isAppleLoading={isAppleLoading}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
            isEmailValid={isEmailValid}
            onGoogleLogin={handleGoogleLogin}
            onAppleLogin={handleAppleLogin}
            pendingDeletion={pendingDeletion}
            onResendRecovery={handleResendRecovery}
            isResending={isResending}
            resendCooldown={resendCooldown}
          />
        )}

        {step === "OTP" && (
          <StepOtp
            email={email}
            otp={otp}
            onOtpChange={(val) => {
              setOtp(val);
              if (val.length === 6) {
                handleVerifyOtp(val);
              }
            }}
            onSubmit={handleContinueFromOtp}
            onResend={handleResendOtp}
            isCheckingOtp={isCheckingOtp}
            isOtpVerified={isOtpVerified}
            isRateLimited={isRateLimited}
            isLoading={isLoading}
            isResending={isResending}
            errorMessage={errorMessage}
            otpError={otpError}
            resendCooldown={resendCooldown}
            onClearError={() => setErrorMessage(null)}
          />
        )}

        {step === "PASSWORD" && (
          <StepPassword
            password={password}
            onPasswordChange={setPassword}
            onSubmit={handleRegister}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
          />
        )}
      </SignUpLayout>

      {/* Dynamic bottom toast notification */}
      {toastMessage && (
        <BottomToast
          message={toastMessage}
          onClose={() => {
            setShowSessionExpiredToast(false);
            if (toastParam) {
              router.replace("/signup", { scroll: false });
            }
          }}
        />
      )}

      <LeaveConfirmationModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={() => {
          setIsLeaveModalOpen(false);
          handleClose();
        }}
      />
    </>
  );
};

export default SignUpFlow;
