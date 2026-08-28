"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { signupService } from "../services/signup.service";
import { SignUpStep, PasswordCriteria, PendingDeletionInfo } from "../types/signup.types";

const SESSION_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes

export function useSignUp() {
  const router = useRouter();

  const [step, setStep] = useState<SignUpStep>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOtp, setIsCheckingOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [targetCooldownExpiry, setTargetCooldownExpiry] = useState<number | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletionInfo | null>(null);
  const [showSessionExpiredToast, setShowSessionExpiredToast] = useState(false);

  // Email format validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // Password validation criteria
  const passwordCriteria: PasswordCriteria = {
    length: password.length >= 8 && password.length <= 15,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(password),
  };

  const isPasswordValid =
    passwordCriteria.length &&
    passwordCriteria.uppercase &&
    passwordCriteria.number &&
    passwordCriteria.specialChar;

  // Live countdown timer computed against exact target timestamp (immune to API lag/time drift)
  useEffect(() => {
    if (!targetCooldownExpiry) {
      setResendCooldown(0);
      return;
    }

    const updateCooldown = () => {
      const remaining = Math.max(0, Math.ceil((targetCooldownExpiry - Date.now()) / 1000));
      const clamped = Math.min(120, remaining);
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

  // Edge Case 2: 10-Minute session timeout monitor (active on password screen)
  useEffect(() => {
    const checkSessionExpiry = () => {
      if (typeof window === "undefined") return;
      const expiryStr = sessionStorage.getItem("cocpit_signup_session_expiry");
      if (!expiryStr) return;

      const expiry = Number(expiryStr);
      if (Date.now() > expiry) {
        // Session expired!
        sessionStorage.removeItem("cocpit_signup_session_expiry");
        sessionStorage.removeItem("cocpit_signup_session_email");
        sessionStorage.removeItem("cocpit_signup_session_otp");

        // Reset all state to clean initial email screen
        setEmail("");
        setOtp("");
        setPassword("");
        setIsOtpVerified(false);
        setErrorMessage(null);
        setStep("EMAIL");
        setTargetCooldownExpiry(null);
        setShowSessionExpiredToast(true);

        if (window.location.pathname !== "/signup" && window.location.pathname !== "/") {
          router.replace("/signup?toast=session_expired");
        }
      }
    };

    const interval = setInterval(checkSessionExpiry, 1000);
    window.addEventListener("focus", checkSessionExpiry);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkSessionExpiry);
    };
  }, [router]);

  // Helper to compute target cooldown timestamp with clock skew compensation
  const computeTargetExpiry = (cooldownExpiresAt?: string | null, serverTime?: string | null, fallbackSecs?: number): number | null => {
    if (cooldownExpiresAt) {
      const serverTimeMs = serverTime ? new Date(serverTime).getTime() : Date.now();
      const clockSkew = Date.now() - serverTimeMs;
      const target = new Date(cooldownExpiresAt).getTime() + clockSkew;
      if (target > Date.now()) return target;
      return null;
    }
    if (typeof fallbackSecs === "number" && fallbackSecs > 0) {
      return Date.now() + Math.min(120, fallbackSecs) * 1000;
    }
    return null;
  };

  // Check pending deletion localStorage cooldown
  useEffect(() => {
    const lastResend = localStorage.getItem("lastResendRecovery");
    if (lastResend) {
      const elapsed = Math.floor((Date.now() - parseInt(lastResend)) / 1000);
      if (elapsed < 300) {
        setTargetCooldownExpiry(Date.now() + (300 - elapsed) * 1000);
      }
    }
  }, []);

  // Initialize Apple Sign-In SDK
  useEffect(() => {
    const initApple = () => {
      try {
        if (typeof window !== "undefined" && (window as any).AppleID?.auth) {
          (window as any).AppleID.auth.init({
            clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "com.cocpit.app.web",
            scope: "name email",
            redirectURI: `${window.location.origin}/`,
            usePopup: true,
          });
        }
      } catch (err) {
        console.warn("AppleID initialization error:", err);
      }
    };

    if (typeof window !== "undefined") {
      if ((window as any).AppleID) {
        initApple();
      } else {
        const script = document.createElement("script");
        script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
        script.async = true;
        script.onload = initApple;
        document.head.appendChild(script);
      }
    }
  }, []);

  // Helper: check for ACCOUNT_PENDING_DELETION error from NextAuth
  const tryParseDeletionError = (errorStr: string, emailHint?: string): boolean => {
    try {
      const parsed = JSON.parse(errorStr);
      if (parsed?.code === "ACCOUNT_PENDING_DELETION") {
        setPendingDeletion({ deletionDate: parsed.deletionDate, email: emailHint || email });
        return true;
      }
    } catch {
      // Not a JSON error
    }
    return false;
  };

  // Shared post-login redirect logic
  const handlePostLoginRedirect = async () => {
    const session = await getSession();
    if (!session || !session.user) {
      window.location.href = "/onboarding";
      return;
    }

    // @ts-ignore
    if (!session.user.onboarding_complete) {
      router.push("/onboarding");
    } else {
      router.push("/feed");
    }
  };

  // ─── Step 1: Send OTP to Email (Direct Step Resolution based on Email check) ──
  const handleSendEmail = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isEmailValid) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPendingDeletion(null);

    try {
      const res = await signupService.requestOtp(email);
      if (res && res.error) {
        if (res.error.status === 409) {
          setErrorMessage("An account with this email already exists");
        } else {
          setErrorMessage(res.error.message || "Failed to send verification code.");
        }
        return;
      }

      // Edge Case 1: Verified 10-minute session is already active for this email -> Go directly to PASSWORD
      if (res && res.sessionActive) {
        const expiryMs = res.sessionExpiresAt
          ? new Date(res.sessionExpiresAt).getTime()
          : Date.now() + (res.remainingSeconds || 600) * 1000;

        if (typeof window !== "undefined") {
          sessionStorage.setItem("cocpit_signup_session_expiry", String(expiryMs));
          sessionStorage.setItem("cocpit_signup_session_email", email.toLowerCase().trim());
        }

        setIsOtpVerified(true);
        setStep("PASSWORD");
        return;
      }

      // Edge Case 3: Active OTP already sent & not expired for this email
      if (res && res.otpActive) {
        const targetExpiry = computeTargetExpiry(res.cooldownExpiresAt, res.serverTime, res.remainingCooldown);
        setTargetCooldownExpiry(targetExpiry);
        setOtp("");
        setIsOtpVerified(false);
        setStep("OTP");
        return;
      }

      // Fresh OTP generated & sent
      const targetExpiry = computeTargetExpiry(res?.cooldownExpiresAt, res?.serverTime, 120);
      setTargetCooldownExpiry(targetExpiry);
      setOtp("");
      setIsOtpVerified(false);
      setStep("OTP");
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      if (status === 409 || msg?.toLowerCase().includes("already exists") || msg?.toLowerCase().includes("registered")) {
        setErrorMessage("An account with this email already exists");
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

  // ─── Step 2: Live Verify OTP ────────────────────────────────────────────────
  const handleVerifyOtp = useCallback(async (codeToVerify: string) => {
    const code = codeToVerify.trim();
    if (code.length !== 6 || isCheckingOtp) return;

    setIsCheckingOtp(true);
    setOtpError(false);
    setErrorMessage(null);

    try {
      const res = await signupService.verifyOtp(email, code);
      if (res && res.error) {
        setIsOtpVerified(false);
        setOtpError(true);
        setErrorMessage(res.error.message || "Incorrect code");
        return;
      }

      setIsOtpVerified(true);
      setOtpError(false);
      setErrorMessage(null);

      // Start 10-minute post-verification session in sessionStorage
      if (typeof window !== "undefined") {
        const expiryMs = res?.sessionExpiresAt
          ? new Date(res.sessionExpiresAt).getTime()
          : Date.now() + SESSION_LIFETIME_MS;

        sessionStorage.setItem("cocpit_signup_session_expiry", String(expiryMs));
        sessionStorage.setItem("cocpit_signup_session_email", email.toLowerCase().trim());
        sessionStorage.setItem("cocpit_signup_session_otp", code);
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

  // ─── Step 2: Continue Button from OTP Step ──────────────────────────────────
  const handleContinueFromOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) return;

    if (isOtpVerified) {
      setStep("PASSWORD");
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    try {
      const res = await signupService.verifyOtp(email, otp.trim());
      setIsOtpVerified(true);
      setOtpError(false);
      setStep("PASSWORD");
      setErrorMessage(null);

      // Start 10-minute post-verification session in sessionStorage
      if (typeof window !== "undefined") {
        const expiryMs = res?.sessionExpiresAt
          ? new Date(res.sessionExpiresAt).getTime()
          : Date.now() + SESSION_LIFETIME_MS;

        sessionStorage.setItem("cocpit_signup_session_expiry", String(expiryMs));
        sessionStorage.setItem("cocpit_signup_session_email", email.toLowerCase().trim());
        sessionStorage.setItem("cocpit_signup_session_otp", otp.trim());
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

  // ─── Step 2: Resend OTP (Restarts 2-min timer from backend timestamp) ───────
  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0 || isResending || isCheckingOtp) return;

    setIsResending(true);
    setErrorMessage(null);
    setOtpError(false);

    try {
      const res = await signupService.requestOtp(email, true);
      const targetExpiry = computeTargetExpiry(res?.cooldownExpiresAt, res?.serverTime, 120);
      setTargetCooldownExpiry(targetExpiry);
      setOtp("");
      setIsOtpVerified(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setErrorMessage(msg || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  }, [email, resendCooldown, isResending, isCheckingOtp]);

  // ─── Step 3: Register & Auto Login ──────────────────────────────────────────
  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await signupService.registerUser({
        email: email.toLowerCase().trim(),
        password,
        otp: otp.trim(),
      });

      // Clear signup session storage upon successful registration
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cocpit_signup_session_expiry");
        sessionStorage.removeItem("cocpit_signup_session_email");
        sessionStorage.removeItem("cocpit_signup_session_otp");
      }

      // Auto-login after successful registration
      const loginResult = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase().trim(),
        password,
      });

      if (loginResult?.error) {
        router.push("/?toast=account_created");
        return;
      }

      await handlePostLoginRedirect();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Registration failed. Please try again.";
      if (msg.toLowerCase().includes("expired")) {
        // Edge Case 2: Expired session during registration -> reset to clean Step 1 with toast
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("cocpit_signup_session_expiry");
          sessionStorage.removeItem("cocpit_signup_session_email");
          sessionStorage.removeItem("cocpit_signup_session_otp");
        }
        setEmail("");
        setOtp("");
        setPassword("");
        setIsOtpVerified(false);
        setTargetCooldownExpiry(null);
        setStep("EMAIL");
        setShowSessionExpiredToast(true);
      } else {
        setErrorMessage(msg);
        if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("code") || msg.toLowerCase().includes("expired")) {
          setStep("OTP");
          setIsOtpVerified(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, otp, isPasswordValid, isLoading, router]);

  // ─── Google Login ────────────────────────────────────────────────────────────
  const handleGoogleLogin = async (idToken: string) => {
    setIsGoogleLoading(true);
    setPendingDeletion(null);
    setErrorMessage(null);
    try {
      const result = await signIn("credentials", {
        idToken,
        accountType: "Student",
        redirect: false,
      });

      if (result?.error) {
        if (!tryParseDeletionError(result.error, email)) {
          setErrorMessage("Google sign up failed. Please try again.");
        }
        setIsGoogleLoading(false);
      } else {
        await handlePostLoginRedirect();
      }
    } catch (err: any) {
      console.error("Google sign up error:", err);
      setErrorMessage("Google sign up failed. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  // ─── Apple Login ─────────────────────────────────────────────────────────────
  const handleAppleLogin = async () => {
    setIsAppleLoading(true);
    setPendingDeletion(null);
    setErrorMessage(null);
    try {
      if (typeof window === "undefined" || !(window as any).AppleID?.auth) {
        throw new Error("Apple Sign-In is not available");
      }

      const data = await (window as any).AppleID.auth.signIn();
      const idToken = data?.authorization?.id_token;

      if (!idToken) {
        throw new Error("No identity token received from Apple");
      }

      const result = await signIn("credentials", {
        appleIdToken: idToken,
        accountType: "Student",
        redirect: false,
      });

      if (result?.error) {
        if (!tryParseDeletionError(result.error, email)) {
          setErrorMessage("Apple sign up failed. Please try again.");
        }
        setIsAppleLoading(false);
      } else {
        await handlePostLoginRedirect();
      }
    } catch (err: any) {
      console.error("Apple sign up error:", err);
      if (err?.error !== "popup_closed_by_user") {
        setErrorMessage(err?.message || "Apple sign up failed. Please try again.");
      }
      setIsAppleLoading(false);
    }
  };

  // ─── Resend Recovery ─────────────────────────────────────────────────────────
  const handleResendRecovery = async () => {
    if (!pendingDeletion || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    try {
      await signupService.resendRecoveryEmail(pendingDeletion.email);
      localStorage.setItem("lastResendRecovery", Date.now().toString());
      setTargetCooldownExpiry(Date.now() + 300000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Failed to send recovery email.");
    } finally {
      setIsResending(false);
    }
  };

  // ─── Navigation Handlers ─────────────────────────────────────────────────────
  const handleGoBack = useCallback(() => {
    // When navigating back or closing screen, always return to clean empty Email screen
    setStep("EMAIL");
    setEmail("");
    setOtp("");
    setPassword("");
    setOtpError(false);
    setIsOtpVerified(false);
    setIsRateLimited(false);
    setTargetCooldownExpiry(null);
    setResendCooldown(0);
    setErrorMessage(null);
  }, []);

  const handleClose = useCallback(() => {
    if (step === "EMAIL") {
      router.push("/");
    } else {
      // Dismissing from OTP or PASSWORD returns to clean empty Email screen
      setStep("EMAIL");
      setEmail("");
      setOtp("");
      setPassword("");
      setOtpError(false);
      setIsOtpVerified(false);
      setIsRateLimited(false);
      setTargetCooldownExpiry(null);
      setResendCooldown(0);
      setErrorMessage(null);
    }
  }, [step, router]);

  return {
    step,
    setStep,
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
    isPasswordValid,
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
    handleGoBack,
    handleClose,
  };
}

export default useSignUp;
