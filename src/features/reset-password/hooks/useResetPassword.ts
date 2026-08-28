"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordService } from "../services/reset-password.service";
import { ResetPasswordStep, PasswordCriteria } from "../types/reset-password.types";

const SESSION_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes

export function useResetPassword(options?: { initialToken?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = options?.initialToken ?? searchParams?.get("token");

  // Main step state
  const [step, setStep] = useState<ResetPasswordStep>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading & interaction states
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCheckingOtp, setIsCheckingOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState(false);
  const [isOldPasswordError, setIsOldPasswordError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showSessionExpiredToast, setShowSessionExpiredToast] = useState(false);
  const [isTokenFlow, setIsTokenFlow] = useState(false);

  // Email format validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Password validation criteria
  const passwordCriteria: PasswordCriteria = {
    length: newPassword.length >= 8 && newPassword.length <= 15,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    specialChar: /[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(newPassword),
  };

  const isPasswordValid =
    passwordCriteria.length &&
    passwordCriteria.uppercase &&
    passwordCriteria.number &&
    passwordCriteria.specialChar;

  const isPasswordMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Direct Token Verification (Link Flow)
  useEffect(() => {
    if (!token) return;

    setIsTokenFlow(true);
    setIsLoading(true);

    resetPasswordService
      .verifyToken(token)
      .then((res: any) => {
        if (res && res.valid) {
          setStep("NEW_PASSWORD");
        } else {
          setStep("EMAIL");
          setErrorMessage(
            res?.reason === "expired"
              ? "This password reset link has expired."
              : res?.reason === "used"
              ? "This password reset link has already been used."
              : "Invalid password reset link."
          );
        }
      })
      .catch(() => {
        setStep("EMAIL");
        setErrorMessage("Unable to verify reset link. Please request a new one.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  // Session timeout monitor (10 minutes)
  useEffect(() => {
    if (token) return; // Token flow has its own backend expiry check

    const checkSessionExpiry = () => {
      if (typeof window === "undefined") return;
      const expiryStr = sessionStorage.getItem("cocpit_reset_session_expiry");
      if (!expiryStr) return;

      const expiry = Number(expiryStr);
      if (Date.now() > expiry) {
        // Session expired!
        sessionStorage.removeItem("cocpit_reset_session_expiry");
        sessionStorage.removeItem("cocpit_reset_session_email");
        sessionStorage.removeItem("cocpit_reset_session_otp");

        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setIsOtpVerified(false);
        setIsOldPasswordError(false);
        setErrorMessage(null);
        setStep("EMAIL");
        setShowSessionExpiredToast(true);

        if (window.location.pathname !== "/forgot-password" && window.location.pathname !== "/") {
          router.replace("/forgot-password?toast=session_expired");
        }
      }
    };

    const interval = setInterval(checkSessionExpiry, 1000);
    window.addEventListener("focus", checkSessionExpiry);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkSessionExpiry);
    };
  }, [token, router]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to Email
  const handleSendEmail = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isEmailValid) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await resetPasswordService.requestOtp(email);
      if (res && res.error) {
        if (res.error.status === 404) {
          setErrorMessage("We couldn't find an account with this email");
        } else {
          setErrorMessage(res.error.message || "Failed to send verification code.");
        }
        return;
      }
      setResendCooldown(120); // 2 minutes
      setOtp("");
      setIsOtpVerified(false);
      setStep("OTP");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      if (status === 404 || msg?.toLowerCase().includes("couldn't find") || msg?.toLowerCase().includes("not found")) {
        setErrorMessage("We couldn't find an account with this email");
      } else if (status === 429) {
        setIsRateLimited(true);
        setErrorMessage("Too many attempts. Please try again later.");
      } else {
        setErrorMessage(msg || "Failed to send verification code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, isEmailValid]);

  // Step 2: Auto Verify OTP as user types
  const handleVerifyOtp = useCallback(async (codeToVerify: string) => {
    const code = codeToVerify.trim();
    if (code.length !== 6 || isCheckingOtp) return;

    setIsCheckingOtp(true);
    setOtpError(false);
    setErrorMessage(null);

    try {
      const res = await resetPasswordService.verifyOtp(email, code);
      if (res && res.error) {
        setIsOtpVerified(false);
        setOtpError(true);
        setErrorMessage("Incorrect code");
        return;
      }

      setIsOtpVerified(true);
      setOtpError(false);
      setErrorMessage(null);

      // Start 10-minute session in sessionStorage
      if (typeof window !== "undefined") {
        const expiryMs = res?.sessionExpiresAt
          ? new Date(res.sessionExpiresAt).getTime()
          : Date.now() + SESSION_LIFETIME_MS;

        sessionStorage.setItem("cocpit_reset_session_expiry", String(expiryMs));
        sessionStorage.setItem("cocpit_reset_session_email", email.toLowerCase().trim());
        sessionStorage.setItem("cocpit_reset_session_otp", code);
      }
    } catch (err: any) {
      setIsOtpVerified(false);
      setOtpError(true);
      const msg = err?.response?.data?.message || "";
      if (msg.toLowerCase().includes("expired")) {
        setErrorMessage("This code has expired");
      } else {
        setErrorMessage("Incorrect code");
      }
    } finally {
      setIsCheckingOtp(false);
    }
  }, [email, isCheckingOtp]);

  // Step 2: Continue Button from OTP step
  const handleContinueFromOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) return;

    if (isOtpVerified) {
      setStep("NEW_PASSWORD");
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordService.verifyOtp(email, otp.trim());
      setIsOtpVerified(true);
      setOtpError(false);
      setStep("NEW_PASSWORD");
      setErrorMessage(null);

      // Start 10-minute session in sessionStorage
      if (typeof window !== "undefined") {
        const expiryMs = res?.sessionExpiresAt
          ? new Date(res.sessionExpiresAt).getTime()
          : Date.now() + SESSION_LIFETIME_MS;

        sessionStorage.setItem("cocpit_reset_session_expiry", String(expiryMs));
        sessionStorage.setItem("cocpit_reset_session_email", email.toLowerCase().trim());
        sessionStorage.setItem("cocpit_reset_session_otp", otp.trim());
      }
    } catch (err: any) {
      setIsOtpVerified(false);
      setOtpError(true);
      const msg = err?.response?.data?.message || "";
      if (msg.toLowerCase().includes("expired")) {
        setErrorMessage("This code has expired");
      } else {
        setErrorMessage("Incorrect code");
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, otp, isOtpVerified]);

  // Step 2: Resend OTP
  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage(null);
    setOtpError(false);

    try {
      await resetPasswordService.requestOtp(email);
      setResendCooldown(120); // 2 minutes
      setOtp("");
      setIsOtpVerified(false);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, isResending]);

  // Live validation on First Password focus out (onBlur)
  const handleValidateNewPassword = useCallback(async (pwdToCheck?: string) => {
    const pwd = pwdToCheck ?? newPassword;
    if (!pwd || pwd.length < 8) {
      setIsOldPasswordError(false);
      return;
    }

    const emailToUse = email.trim() || (typeof window !== "undefined" ? sessionStorage.getItem("cocpit_reset_session_email") || "" : "");

    try {
      const res = await resetPasswordService.validatePassword({
        email: !token ? emailToUse : undefined,
        token: token || undefined,
        password: pwd,
      });

      if (res && res.isSamePassword) {
        setIsOldPasswordError(true);
        setErrorMessage("Choose a different password");
      } else {
        setIsOldPasswordError(false);
        if (errorMessage === "Choose a different password") {
          setErrorMessage(null);
        }
      }
    } catch {
      // Non-blocking
    }
  }, [newPassword, email, token, errorMessage]);

  // Step 3: Trigger confirmation modal or reset password
  const handlePromptResetPassword = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isOldPasswordError || errorMessage === "Choose a different password") {
      setErrorMessage("Choose a different password");
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage("Please ensure all password requirements are met.");
      return;
    }
    if (!isPasswordMatch) {
      setErrorMessage("Passwords don't match.");
      return;
    }
    setErrorMessage(null);
    setIsLogoutModalOpen(true);
  }, [isPasswordValid, isPasswordMatch, isOldPasswordError, errorMessage]);

  // Execute Password Reset
  const handleConfirmResetPassword = useCallback(async (logoutOtherDevices: boolean = true) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (token) {
        await resetPasswordService.resetPasswordWithToken(token, newPassword, logoutOtherDevices);
      } else {
        await resetPasswordService.resetPassword(email, newPassword, otp, logoutOtherDevices);
      }
      // Clear reset session
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cocpit_reset_session_expiry");
        sessionStorage.removeItem("cocpit_reset_session_email");
        sessionStorage.removeItem("cocpit_reset_session_otp");
      }
      setIsLogoutModalOpen(false);
      router.push("/?toast=password_updated");
    } catch (err: any) {
      setIsLogoutModalOpen(false);
      const msg = err?.response?.data?.message || "Failed to reset password. Please try again.";
      if (msg.toLowerCase().includes("expired")) {
        // Expired session -> reset to initial step
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("cocpit_reset_session_expiry");
        }
        setStep("EMAIL");
        setShowSessionExpiredToast(true);
      } else if (msg === "Choose a different password") {
        setIsOldPasswordError(true);
        setErrorMessage("Choose a different password");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, otp, newPassword, token, router]);

  // Close / Dismiss cross button handler
  const handleClose = useCallback(() => {
    if (step === "EMAIL") {
      router.push("/");
    } else {
      // If leaving OTP or NEW_PASSWORD screen, clear verified session and return to EMAIL screen
      setStep("EMAIL");
      setEmail("");
      setOtp("");
      setOtpError(false);
      setIsOtpVerified(false);
      setIsRateLimited(false);
      setIsOldPasswordError(false);
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage(null);
      setResendCooldown(0);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cocpit_reset_session_expiry");
        sessionStorage.removeItem("cocpit_reset_session_email");
        sessionStorage.removeItem("cocpit_reset_session_otp");
      }
      if (token) {
        router.push("/");
      }
    }
  }, [step, token, router]);

  const handleGoBack = handleClose;

  return {
    step,
    setStep,
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
    setOtpError,
    isOldPasswordError,
    setIsOldPasswordError,
    resendCooldown,
    isEmailValid,
    passwordCriteria,
    isPasswordValid,
    isPasswordMatch,
    isLogoutModalOpen,
    setIsLogoutModalOpen,
    showSessionExpiredToast,
    setShowSessionExpiredToast,
    isTokenFlow,
    handleSendEmail,
    handleVerifyOtp,
    handleContinueFromOtp,
    handleResendOtp,
    handleValidateNewPassword,
    handlePromptResetPassword,
    handleConfirmResetPassword,
    handleGoBack,
    handleClose,
  };
}

export default useResetPassword;
