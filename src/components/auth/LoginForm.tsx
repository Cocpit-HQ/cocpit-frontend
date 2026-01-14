"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import styles from "./LoginForm.module.css";
import { signIn } from "next-auth/react";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        console.log("Login successful. Result:", result);
        toast({
          title: "Sign in successful",
          description: "Redirecting...",
        });
        // We push to /feed, but if the user is not onboarded, middleware should intercept and redirect to /onboarding
        router.push("/feed");
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
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
          />
          <label 
            htmlFor="keep-logged-in" 
            className={styles.checkboxLabel}
          >
            Keep me logged in
          </label>
        </div>

        {/* Sign in button */}
        <button type="submit" className={styles.submitButton}>
          Sign in
        </button>
      </form>

      {/* Divider */}
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>Or</span>
        <div className={styles.dividerLine} />
      </div>

      {/* Social login */}
      <div className={styles.socialGrid}>
        <button className={styles.socialButton}>
          <svg className={styles.socialIcon} viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
            />
          </svg>
          GitHub
        </button>
        <button className={styles.socialButton}>
          <svg className={styles.socialIcon} viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>
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
