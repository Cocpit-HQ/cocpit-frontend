"use client";

import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useResetPassword } from "../hooks/useResetPassword";
import ResetPasswordLayout from "../components/ResetPasswordLayout";
import StepEmail from "../components/StepEmail";
import StepOtp from "../components/StepOtp";
import StepNewPassword from "../components/StepNewPassword";
import LogoutOtherDevicesModal from "../components/LogoutOtherDevicesModal";
import BottomToast from "@/shared/commonComponents/BottomToast";

interface ResetPasswordFlowProps {
  initialToken?: string | null;
}

export const ResetPasswordFlow: React.FC<ResetPasswordFlowProps> = ({ initialToken }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastParam = searchParams.get("toast");

  const {
    step,
    email,
    setEmail,
    otp,
    setOtp,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    isResending,
    isCheckingOtp,
    isOtpVerified,
    isRateLimited,
    errorMessage,
    setErrorMessage,
    otpError,
    isOldPasswordError,
    setIsOldPasswordError,
    resendCooldown,
    isEmailValid,
    isLogoutModalOpen,
    setIsLogoutModalOpen,
    showSessionExpiredToast,
    setShowSessionExpiredToast,
    handleSendEmail,
    handleVerifyOtp,
    handleContinueFromOtp,
    handleResendOtp,
    handleValidateNewPassword,
    handlePromptResetPassword,
    handleConfirmResetPassword,
    handleGoBack,
    handleClose,
  } = useResetPassword({ initialToken });

  useEffect(() => {
    if (toastParam === "session_expired") {
      setShowSessionExpiredToast(true);
    }
  }, [toastParam, setShowSessionExpiredToast]);

  const toastMessage =
    toastParam === "session_expired" || showSessionExpiredToast
      ? "Session expired"
      : toastParam === "password_updated"
      ? "Password updated"
      : toastParam;

  return (
    <>
      <ResetPasswordLayout onClose={handleClose} showClose={step !== "SUCCESS"}>
        {step === "EMAIL" && (
          <StepEmail
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleSendEmail}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
            isEmailValid={isEmailValid}
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

        {step === "NEW_PASSWORD" && (
          <StepNewPassword
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handlePromptResetPassword}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
            isOldPasswordError={isOldPasswordError}
            onValidatePassword={handleValidateNewPassword}
            onClearOldPasswordError={() => setIsOldPasswordError(false)}
          />
        )}
      </ResetPasswordLayout>

      {/* Logout other devices modal dialog */}
      <LogoutOtherDevicesModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmResetPassword}
        isLoading={isLoading}
      />

      {/* Dynamic confirmation toast */}
      {toastMessage && (
        <BottomToast
          message={toastMessage}
          onClose={() => {
            setShowSessionExpiredToast(false);
            if (toastParam) {
              router.replace("/reset-password", { scroll: false });
            }
          }}
        />
      )}
    </>
  );
};

export default ResetPasswordFlow;


