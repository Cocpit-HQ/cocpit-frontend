"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordService } from "../services/reset-password.service";
import { cancelOTP } from "@/services/api/auth";
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
  const [targetCooldownExpiry, setTargetCooldownExpiry] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("cocpit_reset_cooldown_expiry");
      if (stored) {
        const expiry = parseInt(stored, 10);
        if (Date.now() < expiry) return expiry;
        sessionStorage.removeItem("cocpit_reset_cooldown_expiry");
      }
    }
    return null;
  });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [showSessionExpiredToast, setShowSessionExpiredToast] = useState(false);
  const [isTokenFlow, setIsTokenFlow] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

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
        sessionStorage.removeItem("cocpit_reset_session_step");

        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setIsOtpVerified(false);
        setIsOldPasswordError(false);
        setErrorMessage(null);
        setStep("EMAIL");
        setShowSessionExpiredToast(true);
        setIsLogoutModalOpen(false);

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

  // Persist cooldown expiry
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (targetCooldownExpiry) {
        sessionStorage.setItem("cocpit_reset_cooldown_expiry", targetCooldownExpiry.toString());
      } else {
        sessionStorage.removeItem("cocpit_reset_cooldown_expiry");
      }
    }
  }, [targetCooldownExpiry]);

  // Cooldown countdown timer
  useEffect(() => {
    if (!targetCooldownExpiry) {
      setResendCooldown(0);
      return;
    }

    const updateCooldown = () => {
      const remaining = Math.max(0, Math.ceil((targetCooldownExpiry - Date.now()) / 1000));
      const clamped = Math.min(60, remaining);
      setResendCooldown(clamped);
      if (remaining <= 0) {
        setTargetCooldownExpiry(null);
      }
    };

    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    window.addEventListener("focus", updateCooldown);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", updateCooldown);
    };
  }, [targetCooldownExpiry]);

  const computeTargetExpiry = (cooldownExpiresAt?: string | null, serverTime?: string | null, fallbackSecs?: number): number | null => {
    if (cooldownExpiresAt) {
      const serverTimeMs = serverTime ? new Date(serverTime).getTime() : Date.now();
      const clockSkew = Date.now() - serverTimeMs;
      const target = new Date(cooldownExpiresAt).getTime() + clockSkew;
      if (target > Date.now()) return target;
      return null;
    }
    if (typeof fallbackSecs === "number" && fallbackSecs > 0) {
      return Date.now() + Math.min(60, fallbackSecs) * 1000;
    }
    return null;
  };

  // Persist step
  const isFirstMount = React.useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cocpit_reset_session_step", step);
    }
  }, [step]);

  // Mount Restoration for Page Refresh
  useEffect(() => {
    if (typeof window === "undefined" || token) return;
    const expiryStr = sessionStorage.getItem("cocpit_reset_session_expiry");
    const sessionEmail = sessionStorage.getItem("cocpit_reset_session_email");
    const sessionOtp = sessionStorage.getItem("cocpit_reset_session_otp");
    const sessionStep = sessionStorage.getItem("cocpit_reset_session_step");

    if (expiryStr && sessionEmail) {
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() < expiry) {
        setEmail(sessionEmail);
        if (sessionStep === "NEW_PASSWORD" && sessionOtp) {
          setOtp(sessionOtp);
          setIsOtpVerified(true);
          setStep("NEW_PASSWORD");
        } else if (sessionOtp) {
          setOtp(sessionOtp);
          setIsOtpVerified(true);
          setStep("OTP");
        } else {
          setStep("OTP");
        }
      }
    }
  }, [token]);

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
      
      // Defensive fallback if we somehow hit a stale sessionActive (which should be cleaned up by backend now)
      if (res && res.sessionActive) {
        cancelOTP(email, "password_reset").catch(() => {});
        setErrorMessage("Please try again.");
        return;
      }

      if (res && res.otpActive) {
        const targetExpiry = computeTargetExpiry(res.cooldownExpiresAt, res.serverTime, res.remainingCooldown);
        setTargetCooldownExpiry(targetExpiry);
        setOtp("");
        setIsOtpVerified(false);
        setStep("OTP");
        if (typeof window !== "undefined") {
          const expiryMs = Date.now() + SESSION_LIFETIME_MS;
          sessionStorage.setItem("cocpit_reset_session_expiry", String(expiryMs));
          sessionStorage.setItem("cocpit_reset_session_email", email.toLowerCase().trim());
        }
        return;
      }

      const targetExpiry = computeTargetExpiry(res?.cooldownExpiresAt, res?.serverTime, 60);
      setTargetCooldownExpiry(targetExpiry);
      setOtp("");
      setIsOtpVerified(false);
      setStep("OTP");
      if (typeof window !== "undefined") {
        const expiryMs = Date.now() + SESSION_LIFETIME_MS;
        sessionStorage.setItem("cocpit_reset_session_expiry", String(expiryMs));
        sessionStorage.setItem("cocpit_reset_session_email", email.toLowerCase().trim());
      }
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
      const res = await resetPasswordService.requestOtp(email, true);
      const targetExpiry = computeTargetExpiry(res?.cooldownExpiresAt, res?.serverTime, 60);
      setTargetCooldownExpiry(targetExpiry);
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
    // Session already expired locally
    if (!token && (!email || !otp)) {
      setIsLogoutModalOpen(false);
      setStep("EMAIL");
      setShowSessionExpiredToast(true);
      return;
    }

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
    if (step === "OTP" || step === "NEW_PASSWORD") {
      if (email) {
        cancelOTP(email, "password_reset").catch((err) => console.error("Failed to cancel OTP:", err));
      }
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cocpit_reset_session_expiry");
        sessionStorage.removeItem("cocpit_reset_session_email");
        sessionStorage.removeItem("cocpit_reset_session_otp");
        sessionStorage.removeItem("cocpit_reset_session_step");
      }
    }
    
    // Always return to login
    router.push("/");
  }, [step, router, email]);

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
    isMounted,
  };
}

export default useResetPassword;
