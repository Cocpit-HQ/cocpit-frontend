"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, MailWarning, Send } from "lucide-react";
import { Eye, EyeClosed } from "iconoir-react";
import { useToast } from "@/hooks/use-toast";
import styles from "./LoginForm.module.css";
import { signIn, getSession } from "next-auth/react";
import { GoogleLogin } from "@react-oauth/google";
import { useForceLightTheme } from "@/hooks/use-force-light-theme";
import { resendRecoveryEmail } from "@/services/api/user";

const LoginForm = () => {
  useForceLightTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Pending deletion state — shown when backend returns 403 ACCOUNT_PENDING_DELETION
  const [pendingDeletion, setPendingDeletion] = useState<{ deletionDate: string; email: string } | null>(null);
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

  useEffect(() => {
    if (reason === "session_ended") {
      setSessionEnded(true);
    }
  }, [reason]);

  // Shared redirect logic — used by both credential and Google login
  const handlePostLoginRedirect = async () => {
    const session = await getSession();
    toast({ title: "Sign in successful", description: "Redirecting..." });

    // @ts-ignore
    if (session?.user?.onboarding_complete === false) {
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

  // ─── Credential Login ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setPendingDeletion(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (!tryParseDeletionError(result.error, email)) {
          setError("Invalid email or password");
        }
        setIsLoading(false);
      } else {
        setError(null);
        await handlePostLoginRedirect();
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // ─── Google Login ────────────────────────────────────────────────────────────
  const handleGoogleLogin = async (idToken: string) => {
    setIsGoogleLoading(true);
    setPendingDeletion(null);
    try {
      const result = await signIn("credentials", {
        idToken,
        redirect: false,
      });

      if (result?.error) {
        if (!tryParseDeletionError(result.error, email)) {
          toast({
            title: "Google login failed",
            description: result.error,
            variant: "destructive",
          });
        }
        setIsGoogleLoading(false);
      } else {
        await handlePostLoginRedirect();
      }
    } catch (error: any) {
      toast({
        title: "Google login error",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  // ─── Resend Recovery Email ───────────────────────────────────────────────────
  const handleResendRecovery = async () => {
    if (!pendingDeletion?.email || resendCooldown > 0) return;
    setIsResending(true);
    try {
      await resendRecoveryEmail(pendingDeletion.email);
      toast({ title: "Recovery email sent", description: "Check your inbox for the restoration link." });
      localStorage.setItem("lastResendRecovery", Date.now().toString());
      setResendCooldown(300);
    } catch {
      toast({ title: "Failed to resend", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.container} data-theme="light">
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleText}>Welcome to</span>
          <span className={styles.titleSpacer}> </span>
          <span className={styles.titleGradient}>Cocpit</span>
        </h2>
        <p className={styles.subtitle}>
          Find jobs, connect, grow
        </p>
      </div>

      {sessionEnded && (
        <div className={styles.sessionAlert}>
          <AlertCircle className={styles.sessionAlertIcon} />
          <p className={styles.sessionAlertText}>
            You were signed out because your session ended. This happens if you log out from another device or if your session expires.
          </p>
        </div>
      )}

      {/* Pending Deletion Banner */}
      {pendingDeletion && (
        <div style={{
          background: "#fff7ed",
          border: "1px solid #f97316",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <MailWarning size={20} style={{ color: "#f97316", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: "14px", color: "#92400e", margin: 0 }}>
                Account scheduled for deletion
              </p>
              <p style={{ fontSize: "13px", color: "#b45309", margin: "4px 0 0" }}>
                Your account will be permanently deleted on{" "}
                <strong>{new Date(pendingDeletion.deletionDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>.
                Check your email for a restoration link.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResendRecovery}
            disabled={isResending || resendCooldown > 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f97316",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isResending || resendCooldown > 0 ? "not-allowed" : "pointer",
              opacity: isResending || resendCooldown > 0 ? 0.7 : 1,
              alignSelf: "flex-start",
            }}
          >
            <Send size={14} />
            {isResending 
              ? "Sending..." 
              : resendCooldown > 0 
                ? `Resend in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, "0")}` 
                : "Resend Recovery Email"
            }
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Email field */}
        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Email or Phone
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
              type="text"
              autoComplete="username"
              placeholder="Enter email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className={styles.input}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
        </div>

        {/* Password field */}
        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <div className={styles.inputWrapperFlex}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Set password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className={`${styles.input} ${styles.inputWithToggle}`}
              disabled={isLoading || isGoogleLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              disabled={isLoading || isGoogleLoading}
            >
              {showPassword ? <EyeClosed className={styles.toggleIcon} strokeWidth={2} /> : <Eye className={styles.toggleIcon} strokeWidth={2} />}
            </button>
          </div>

          <div className={styles.passwordHelperRow}>
            {error ? (
              <span className={styles.errorText}>
                *{error}
              </span>
            ) : <div />}
            <Link
              href="/forgot-password"
              className={styles.forgotPasswordLink}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          className={`${styles.submitButton} ${email && password
              ? styles.submitButtonActive
              : styles.submitButtonInactive
            }`}
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <span className={styles.loadingContent}>
              <svg className={styles.spinner} viewBox="0 0 24 24">
                <circle className={styles.spinnerTrack} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className={styles.spinnerArc} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </span>
          ) : "Continue"}
        </button>
      </form>

      {/* Google Sign In Wrapper */}
      <div className={styles.googleButtonWrapper} ref={containerRef}>
        {/* Custom Visual Button simulating designer mock exactly */}
        <div className={styles.googleButtonVisual}>
          <svg className={styles.googleIcon} viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className={styles.googleButtonText}>Continue with Google</span>
        </div>

        {/* Real Google Button layered invisibly on top */}
        <div className={styles.googleButtonReal}>
          {containerWidth !== undefined && (
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  handleGoogleLogin(credentialResponse.credential);
                }
              }}
              onError={() => {
                toast({
                  title: "Google login failed",
                  description: "Could not sign in with Google. Please try again.",
                  variant: "destructive",
                });
              }}
              text="continue_with"
              shape="pill"
              size="large"
              width={String(containerWidth)}
            />
          )}
        </div>
      </div>

      {/* Sign up link */}
      <p className={styles.signupText}>
        Don't have an account?{" "}
        <Link href="/signup" className={styles.signupLink}>
          sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
