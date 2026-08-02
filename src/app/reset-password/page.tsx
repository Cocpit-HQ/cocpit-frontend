"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Icon } from "@iconify/react";
import { verifyResetToken, resetPasswordWithToken } from "@/services/api/auth";
import { passwordSchema } from "@/lib/validators";
import { useForceLightTheme } from "@/hooks/use-force-light-theme";
import AuthImagePanel from "@/components/auth/AuthImagePanel";
import styles from "@/components/auth/ForgotPasswordForm.module.css";

type ResetStatus = "loading" | "valid" | "used" | "expired" | "invalid" | "success";

function ResetPasswordContent() {
  useForceLightTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<ResetStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPasswordValid =
    newPassword.length >= 8 &&
    newPassword.length <= 15 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(newPassword);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("No reset token provided. Please request a new password reset link.");
      return;
    }

    verifyResetToken(token)
      .then((res) => {
        if (res.valid) {
          setStatus("valid");
        } else {
          if (res.reason === "used") {
            setStatus("used");
            setErrorMessage("This password reset link has already been used.");
          } else if (res.reason === "expired") {
            setStatus("expired");
            setErrorMessage("This password reset link has expired.");
          } else {
            setStatus("invalid");
            setErrorMessage("This password reset link is invalid.");
          }
        }
      })
      .catch((err) => {
        setStatus("invalid");
        setErrorMessage(err?.response?.data?.message || "Failed to verify reset link.");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const parseResult = passwordSchema.safeParse(newPassword);
    if (!parseResult.success) {
      setErrorMessage(parseResult.error.issues[0].message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await resetPasswordWithToken(token, newPassword);
      setStatus("success");
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to reset password. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper} data-theme="light">
      <AuthImagePanel />

      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          {/* Loading state */}
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-gray-500 font-poppins">Verifying password reset link...</p>
            </div>
          )}

          {/* Invalid / Expired / Used states */}
          {(status === "invalid" || status === "expired" || status === "used") && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 font-poppins">
              <XCircle className="w-14 h-14 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                {status === "used" && "Reset Link Already Used"}
                {status === "expired" && "Reset Link Expired"}
                {status === "invalid" && "Invalid Reset Link"}
              </h2>
              <p className="text-sm text-gray-600 max-w-sm">
                {errorMessage || "Please visit settings or the login page to request a new password reset link."}
              </p>
              <Link
                href="/"
                className="mt-4 px-6 py-2.5 bg-[#6366F1] text-white text-sm font-medium rounded-full hover:bg-indigo-600 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Success state */}
          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 font-poppins">
              <CheckCircle className="w-14 h-14 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">Password Reset Successful!</h2>
              <p className="text-sm text-gray-600 max-w-sm">
                Your password has been reset and all active sessions have been logged out for your security.
              </p>
              <p className="text-xs text-gray-400">Redirecting to login in 3 seconds...</p>
              <Link
                href="/"
                className="mt-4 px-6 py-2.5 bg-[#6366F1] text-white text-sm font-medium rounded-full hover:bg-indigo-600 transition-colors"
              >
                Log In Now
              </Link>
            </div>
          )}

          {/* Valid Token -> Form */}
          {status === "valid" && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>
                  Create new <span className={styles.titleGradient}>password</span>
                </h2>
                <p className={styles.subtitle}>Set a new password for your account</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>New password</label>
                  <div className={styles.inputWrapperFlex}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      maxLength={15}
                      required
                    />
                    {newPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={styles.passwordToggle}
                      >
                        {showNewPassword ? (
                          <Icon icon="fluent:eye-20-regular" className={styles.toggleIcon} />
                        ) : (
                          <Icon icon="fluent:eye-off-20-regular" className={styles.toggleIcon} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className={styles.checklistContainer}>
                  <p className={styles.checklistTitle}>Password must contain:</p>
                  <ul className={styles.checklist}>
                    <li className={newPassword.length >= 8 && newPassword.length <= 15 ? styles.checkMet : styles.checkUnmet}>
                      <Icon
                        icon={newPassword.length >= 8 && newPassword.length <= 15 ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className={styles.checkIcon}
                      />
                      <span>8 to 15 characters</span>
                    </li>
                    <li className={/[A-Z]/.test(newPassword) ? styles.checkMet : styles.checkUnmet}>
                      <Icon
                        icon={/[A-Z]/.test(newPassword) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className={styles.checkIcon}
                      />
                      <span>At least 1 uppercase letter (A–Z)</span>
                    </li>
                    <li className={/[a-z]/.test(newPassword) ? styles.checkMet : styles.checkUnmet}>
                      <Icon
                        icon={/[a-z]/.test(newPassword) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className={styles.checkIcon}
                      />
                      <span>At least 1 lowercase letter (a–z)</span>
                    </li>
                    <li className={/[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(newPassword) ? styles.checkMet : styles.checkUnmet}>
                      <Icon
                        icon={/[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(newPassword) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className={styles.checkIcon}
                      />
                      <span>At least 1 special character (e.g., @, #, $, %, &, *)</span>
                    </li>
                  </ul>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Confirm password</label>
                  <div className={styles.inputWrapperFlex}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      maxLength={15}
                      required
                    />
                    {confirmPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={styles.passwordToggle}
                      >
                        {showConfirmPassword ? (
                          <Icon icon="fluent:eye-20-regular" className={styles.toggleIcon} />
                        ) : (
                          <Icon icon="fluent:eye-off-20-regular" className={styles.toggleIcon} />
                        )}
                      </button>
                    )}
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <span className="text-[12px] text-red-500 mt-1">Passwords do not match</span>
                  )}
                </div>

                {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting || !isPasswordValid || !confirmPassword || newPassword !== confirmPassword}
                  className={styles.primaryButton}
                >
                  {isSubmitting ? "Resetting Password..." : "Set New Password"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            By continuing, you agree to our{" "}
            <span className={styles.footerLink}>
              Terms &<br className={styles.mobileBreak} /> Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
