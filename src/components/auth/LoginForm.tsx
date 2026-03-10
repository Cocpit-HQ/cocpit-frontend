"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import styles from "./LoginForm.module.css";
import { signIn, getSession } from "next-auth/react";
import { GoogleLogin } from "@react-oauth/google";

const LoginForm = () => {
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

  // ─── Credential Login ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login failed",
          description: result.error,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
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
    try {
      // Pass the Google idToken through NextAuth's authorize function
      // which will call POST /auth/google on the backend
      const result = await signIn("credentials", {
        idToken,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Google login failed",
          description: result.error,
          variant: "destructive",
        });
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Sign in</h2>
        <p className={styles.subtitle}>
          Welcome back! Enter your details below.
        </p>
      </div>

      {sessionEnded && (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-500 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-sm font-medium leading-relaxed">
            You were signed out because your session ended. This happens if you log out from another device or if your session expires.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Email field */}
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email address
          </label>
          <div className={styles.inputWrapper}>
            <Mail className={styles.inputIcon} />
            <input
              id="email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
        </div>

        {/* Password field */}
        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className={styles.forgotPasswordLink}
            >
              Forgot password?
            </Link>
          </div>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${styles.input} ${styles.inputWithToggle}`}
              disabled={isLoading || isGoogleLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              disabled={isLoading || isGoogleLoading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Keep me logged in */}
        <div className={styles.checkboxField}>
          <input
            id="keep-logged-in"
            type="checkbox"
            checked={keepLoggedIn}
            onChange={(e) => setKeepLoggedIn(e.target.checked)}
            style={{
              cursor: 'pointer',
              accentColor: 'var(--color-primary)',
              width: '1rem',
              height: '1rem'
            }}
            disabled={isLoading || isGoogleLoading}
          />
          <label
            htmlFor="keep-logged-in"
            className={styles.checkboxLabel}
          >
            Keep me logged in
          </label>
        </div>

        {/* Sign in button */}
        <button
          type="submit"
          className={`${styles.submitButton} ${(isLoading || isGoogleLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </span>
          ) : "Sign in"}
        </button>
      </form>

      {/* Divider */}
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>Or</span>
        <div className={styles.dividerLine} />
      </div>

      {/* Google Sign In */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
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
          shape="rectangular"
          size="large"
          width="350"
        />
      </div>

      {/* Sign up link */}
      <p className={styles.footer}>
        Don't have an account?{" "}
        <Link href="/signup" className={styles.signupLink}>
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
