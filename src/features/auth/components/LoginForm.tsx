"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { GoogleLogin } from "@react-oauth/google";
import { resendRecoveryEmail } from "@/services/api/user";
import {
  GoogleIcon,
  AppleIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  MailWarningIcon,
  SendIcon,
  LoadingIcon,
} from "@/components/icons";
import BottomToast from "@/shared/commonComponents/BottomToast";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const toastParam = searchParams.get("toast") || searchParams.get("status");
  const toastMessage =
    toastParam === "password_updated"
      ? "Password updated"
      : toastParam === "session_expired"
      ? "Session expired"
      : toastParam;
  const [sessionEnded, setSessionEnded] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [pendingDeletion, setPendingDeletion] = useState<{ deletionDate: string; email: string } | null>(null);
  const [showNoAccountModal, setShowNoAccountModal] = useState(false);
  const [pendingSocialLogin, setPendingSocialLogin] = useState<{ idToken: string; provider: string; fullName?: string } | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const lastResend = localStorage.getItem("lastResendRecovery");
    if (lastResend) {
      const elapsed = Math.floor((Date.now() - parseInt(lastResend)) / 1000);
      if (elapsed < 300) {
        setResendCooldown(300 - elapsed);
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  // ─── Initialize Apple Sign-In SDK ──────────────────────────────────────────
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

  useEffect(() => {
    if (reason === "session_ended") {
      setSessionEnded(true);
    }
  }, [reason]);

  const validateEmailFormat = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Shared redirect logic — used by both credential and Google login
  const handlePostLoginRedirect = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cocpit_active_onboarding_session", "true");
    }
    const session = await getSession();

    // Fallback to window.location if session is not yet available
    if (!session || !session.user) {
      window.location.href = "/feed";
      return;
    }

    // @ts-ignore
    if (!session.user.onboarding_complete) {
      router.push("/onboarding");
    } else {
      router.push("/feed");
    }
  };

  // ─── Helper: parse ACCOUNT_PENDING_DELETION from NextAuth error string ────────
  const tryParseDeletionError = (errorStr: string, emailHint?: string): boolean => {
    try {
      const parsed = JSON.parse(errorStr);
      if (parsed?.code === "ACCOUNT_PENDING_DELETION") {
        setPendingDeletion({ deletionDate: parsed.deletionDate, email: emailHint || email });
        return true;
      }
    } catch {
      // Not a JSON error — treat as plain message
    }
    return false;
  };

  const tryParseNoAccountError = (errorStr: string): boolean => {
    try {
      const parsed = JSON.parse(errorStr);
      if (parsed?.code === "ACCOUNT_NOT_FOUND") {
        setShowNoAccountModal(true);
        return true;
      }
    } catch {
      // Not a JSON error
    }
    return false;
  };

  // ─── Credential Login ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading || isAppleLoading) return;

    if (!email.trim() || !validateEmailFormat(email) || !password) {
      setAuthError("Incorrect email or password. Try again");
      return;
    }

    setIsLoading(true);
    setPendingDeletion(null);
    setAuthError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (!tryParseDeletionError(result.error, email)) {
          setAuthError(
            result.error !== "CredentialsSignin"
              ? result.error
              : "Incorrect email or password. Try again"
          );
        }
        setIsLoading(false);
      } else {
        setAuthError(null);
        await handlePostLoginRedirect();
      }
    } catch (err: any) {
      setAuthError(err?.message || "Incorrect email or password. Try again");
      setIsLoading(false);
    }
  };

  // ─── Google Login ────────────────────────────────────────────────────────────
  const handleGoogleLogin = async (idToken: string) => {
    setIsGoogleLoading(true);
    setPendingDeletion(null);
    setPendingSocialLogin(null);
    try {
      const result = await signIn("credentials", {
        idToken,
        action: "login",
        redirect: false,
      });

      if (result?.error) {
        if (tryParseNoAccountError(result.error)) {
          setPendingSocialLogin({ idToken, provider: "google" });
        } else {
          tryParseDeletionError(result.error, email);
        }
        setIsGoogleLoading(false);
      } else {
        await handlePostLoginRedirect();
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
    }
  };

  // ─── Apple Login ─────────────────────────────────────────────────────────────
  const handleAppleLogin = async () => {
    if (isLoading || isGoogleLoading || isAppleLoading) return;
    setIsAppleLoading(true);
    setPendingDeletion(null);
    setPendingSocialLogin(null);
    try {
      if (typeof window === "undefined" || !(window as any).AppleID?.auth) {
        console.warn("Apple Sign-In SDK is not ready.");
        setIsAppleLoading(false);
        return;
      }

      const response = await (window as any).AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;

      if (idToken) {
        const fullName = response.user
          ? [response.user.name?.firstName, response.user.name?.lastName].filter(Boolean).join(" ")
          : undefined;

        const result = await signIn("credentials", {
          idToken,
          provider: "apple",
          fullName,
          action: "login",
          redirect: false,
        });

        if (result?.error) {
          if (tryParseNoAccountError(result.error)) {
            setPendingSocialLogin({ idToken, provider: "apple", fullName });
          } else {
            tryParseDeletionError(result.error, email);
          }
          setIsAppleLoading(false);
        } else {
          await handlePostLoginRedirect();
        }
      } else {
        setIsAppleLoading(false);
      }
    } catch (err: any) {
      console.warn("Apple login error:", err);
      setIsAppleLoading(false);
    }
  };

  // ─── Auto-Create Social Account from Modal ──────────────────────────────────
  const handleCreateSocialAccount = async () => {
    if (!pendingSocialLogin) return;
    
    setShowNoAccountModal(false);
    
    if (pendingSocialLogin.provider === "google") setIsGoogleLoading(true);
    else setIsAppleLoading(true);

    try {
      const result = await signIn("credentials", {
        idToken: pendingSocialLogin.idToken,
        provider: pendingSocialLogin.provider,
        ...(pendingSocialLogin.fullName && { fullName: pendingSocialLogin.fullName }),
        // Notice we do NOT pass action: "login" here, so backend defaults to account creation
        redirect: false,
      });

      if (result?.error) {
        setAuthError("Failed to create account. Please try again.");
        setIsGoogleLoading(false);
        setIsAppleLoading(false);
      } else {
        await handlePostLoginRedirect();
      }
    } catch (err) {
      setAuthError("Failed to create account. Please try again.");
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
    }
  };

  // ─── Resend Recovery Email ───────────────────────────────────────────────────
  const handleResendRecovery = async () => {
    if (!pendingDeletion?.email || resendCooldown > 0) return;
    setIsResending(true);
    try {
      await resendRecoveryEmail(pendingDeletion.email);
      localStorage.setItem("lastResendRecovery", Date.now().toString());
      setResendCooldown(300);
    } catch {
      // Failed to resend recovery
    } finally {
      setIsResending(false);
    }
  };

  const isFormValid = validateEmailFormat(email) && password.length > 0;

  return (
    <div className="w-96 p-4 rounded-3xl inline-flex flex-col justify-start items-center gap-5 overflow-hidden font-['DM_Sans'] text-ds-text-primary">
      {/* Header */}
      <div className="flex flex-col justify-start items-center gap-3">
        <div className="text-center justify-start">
          <span className="text-ds-text-primary text-[40px] font-bold font-['DM_Sans'] leading-[48px]">Just</span>
          <span className="text-ds-accent text-[40px] font-bold font-['DM_Sans'] leading-[48px]"> Build.</span>
        </div>
        <div className="flex flex-col justify-start items-center gap-3">
          <div className="text-center justify-start text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
            Log in to continue to your account
          </div>
        </div>
      </div>

      {/* Session Ended Alert */}
      {sessionEnded && (
        <div className="w-64 p-3 bg-ds-surface-1 border border-ds-border rounded-xl flex items-start gap-2 text-xs text-ds-text-secondary">
          <AlertCircleIcon className="w-4 h-4 text-ds-warning shrink-0 mt-0.5" />
          <p className="text-ds-text-primary">
            You were signed out because your session ended. Please log in again.
          </p>
        </div>
      )}

      {/* Deactivated Alert */}
      {reason === "deactivated" && (
        <div className="w-64 p-3 bg-ds-surface-1 border border-ds-border rounded-xl flex items-start gap-2 text-xs text-ds-text-secondary">
          <AlertCircleIcon className="w-4 h-4 text-ds-text-secondary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-ds-text-primary">Account deactivated</p>
            <p className="text-ds-text-secondary text-[11px] mt-0.5">
              Your account is currently deactivated. Log in to automatically reactivate it.
            </p>
          </div>
        </div>
      )}

      {/* Pending Deletion Alert */}
      {pendingDeletion && (
        <div className="w-64 p-3 bg-ds-surface-1 border border-ds-border rounded-xl flex flex-col gap-2 text-xs text-ds-text-secondary">
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
          <button
            type="button"
            onClick={handleResendRecovery}
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
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="w-[260px] flex flex-col justify-start items-start">
        {/* Email Field */}
        <div className="w-[260px] flex flex-col justify-start items-start">
          <div className={`w-full py-2.5 border-b border-ds-border inline-flex justify-start items-center gap-1 focus-within:border-ds-accent transition-colors ${authError ? "!border-ds-error" : ""}`}>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="Enter your email"
              value={email}
              onFocus={() => {
                if (authError) setAuthError(null);
              }}
              onChange={(e) => {
                setEmail(e.target.value);
                if (authError) setAuthError(null);
              }}
              className="w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-xs font-medium font-['DM_Sans'] leading-4"
              disabled={isLoading || isGoogleLoading || isAppleLoading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="w-[260px] flex flex-col justify-start items-start gap-1 mt-6">
          <div className={`w-full h-9 py-2.5 border-b border-ds-border inline-flex justify-between items-center focus-within:border-ds-accent transition-colors ${authError ? "!border-ds-error" : ""}`}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onFocus={() => {
                if (authError) setAuthError(null);
              }}
              onChange={(e) => {
                setPassword(e.target.value);
                if (authError) setAuthError(null);
              }}
              className={`w-full bg-transparent border-none outline-none text-ds-text-primary placeholder:text-ds-text-muted text-xs font-medium font-['DM_Sans'] leading-4 placeholder:tracking-normal ${
                !showPassword && password.length > 0 ? "tracking-[2px]" : ""
              }`}
              disabled={isLoading || isGoogleLoading || isAppleLoading}
            />
            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="size-4 inline-flex justify-center items-center text-ds-text-muted hover:text-ds-text-primary transition-colors cursor-pointer shrink-0"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading || isGoogleLoading || isAppleLoading}
              >
                {showPassword ? (
                  <EyeIcon className="w-4 h-4 shrink-0" size={16} />
                ) : (
                  <EyeOffIcon className="w-4 h-4 shrink-0" size={16} />
                )}
              </button>
            )}
          </div>
          <div className="w-[260px] flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="group inline-flex items-center text-xs font-normal font-['DM_Sans'] leading-4 !no-underline cursor-pointer"
            >
              <span className="!text-ds-text-secondary group-hover:!text-ds-text-primary transition-colors !no-underline">
                Forgot password?
              </span>
            </Link>
          </div>
        </div>

        {/* Centered Error Message */}
        {authError && (
          <div className="w-[260px] flex justify-center items-center mt-5">
            <span className="w-[211px] h-4 font-['DM_Sans'] font-normal text-xs leading-4 text-ds-error text-center shrink-0">
              {authError}
            </span>
          </div>
        )}

        {/* Buttons / Actions */}
        <div className="w-[260px] flex flex-col justify-start items-center gap-3 mt-5">
          {/* Submit / Log in Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading || isGoogleLoading}
            className={`w-[260px] h-9 px-3 py-1.5 bg-ds-surface-1 text-ds-text-primary rounded-[100px] inline-flex justify-center items-center gap-2.5 text-base font-medium font-['DM_Sans'] transition-all ${
              isFormValid && !isLoading
                ? "hover:bg-ds-surface-2 cursor-pointer shadow-[0_0_0_1px_var(--ds-border)]"
                : "opacity-60"
            }`}
          >
            {isLoading ? (
              <LoadingIcon
                className="w-6 h-6 animate-spin-smooth text-ds-text-secondary shrink-0"
                style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
              />
            ) : (
              "Log in"
            )}
          </button>

          {/* Google Sign In Button */}
          <div className="relative w-[260px] h-9 rounded-[100px] cursor-pointer overflow-hidden" ref={containerRef}>
            <div className="w-[260px] h-9 px-3 py-1.5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-ds-border inline-flex justify-center items-center gap-[10px] hover:bg-ds-surface-2 transition-all pointer-events-none cursor-pointer">
              <GoogleIcon className="w-4 h-4 shrink-0" size={16} />
              <span className="font-['DM_Sans'] font-medium text-base leading-6 text-ds-text-primary text-left shrink-0">Continue with Google</span>
            </div>

            {/* Full-coverage functional Google Login button */}
            <div className="absolute inset-0 opacity-[0.0001] cursor-pointer overflow-hidden rounded-[100px] [&>div]:!h-full [&>div]:!w-full [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:!cursor-pointer">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    handleGoogleLogin(credentialResponse.credential);
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
            disabled={isLoading || isGoogleLoading || isAppleLoading}
            className="self-stretch w-[260px] h-9 px-3 py-1.5 rounded-[100px] outline outline-1 outline-offset-[-1px] outline-ds-border inline-flex justify-center items-center gap-[10px] hover:bg-ds-surface-2 transition-all cursor-pointer disabled:opacity-60"
            onClick={handleAppleLogin}
          >
            {isAppleLoading ? (
              <LoadingIcon
                className="w-5 h-5 animate-spin-smooth text-ds-text-secondary shrink-0"
                style={{ animation: "spinSmooth 1.2s ease-in-out infinite" }}
              />
            ) : (
              <>
                <AppleIcon className="w-4 h-4 shrink-0 text-ds-text-primary" size={16} />
                <span className="font-['DM_Sans'] font-medium text-base leading-6 text-ds-text-primary text-left shrink-0">Continue with Apple</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sign Up Link */}
      <div className="text-right justify-start text-xs font-['DM_Sans']">
        <span className="text-ds-text-muted font-normal">Don&apos;t have an account? </span>
        <Link href="/signup" className="hover:underline">
          <span className="!text-ds-text-primary font-medium">Sign up</span>
        </Link>
      </div>

      {/* Confirmation pop-up toast */}
      {toastMessage && (
        <BottomToast
          message={toastMessage}
          onClose={() => {
            router.replace("/", { scroll: false });
          }}
        />
      )}

      {/* Account Not Found Modal */}
      {showNoAccountModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="box-border w-[318px] h-[142px] bg-ds-bg border border-ds-border rounded-2xl flex flex-col items-center px-3 py-2 gap-4">
            
            <div className="w-[292px] flex flex-col items-center gap-2">
              <h3 className="font-['DM_Sans'] font-medium text-base leading-6 text-ds-text-primary">
                No account found
              </h3>
              <p className="font-['DM_Sans'] font-normal text-sm leading-5 text-center text-ds-text-secondary">
                This account isn't registered with Cocpit. Create an account to continue
              </p>
            </div>

            <div className="w-[292px] flex justify-center items-start gap-2">
              <button
                type="button"
                onClick={handleCreateSocialAccount}
                className="w-[142px] h-[36px] flex justify-center items-center px-3 py-1.5 bg-ds-accent rounded-[100px] font-['DM_Sans'] font-medium text-base leading-6 text-white hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => setShowNoAccountModal(false)}
                className="w-[142px] h-[36px] flex justify-center items-center px-3 py-1.5 border border-ds-border rounded-[100px] font-['DM_Sans'] font-medium text-base leading-6 text-ds-text-primary hover:bg-ds-surface-2 transition-colors cursor-pointer shrink-0"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
