"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Icon } from "@iconify/react";
import { verifyResetToken, resetPasswordWithToken } from "@/services/api/auth";
import { passwordSchema } from "@/lib/validators";
import { useForceLightTheme } from "@/hooks/use-force-light-theme";
import AuthImagePanel from "@/features/auth/components/AuthImagePanel";

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
    <div className="min-h-screen flex w-full bg-white" data-theme="light">
      <AuthImagePanel />

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-6 md:p-12 relative">
        <div className="w-full max-w-sm flex flex-col gap-4">
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
              <div className="flex flex-col text-center items-center">
                <h2 className="text-[32px] md:text-[36px] font-bold text-black tracking-tight leading-tight">
                  Create new <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">password</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">Set a new password for your account</p>
              </div>

              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">New password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10"
                      maxLength={15}
                      required
                    />
                    {newPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNewPassword ? (
                          <Icon icon="fluent:eye-20-regular" className="w-4 h-4" />
                        ) : (
                          <Icon icon="fluent:eye-off-20-regular" className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Password must contain:</p>
                  <ul className="space-y-1.5">
                    <li className={newPassword.length >= 8 && newPassword.length <= 15 ? "flex items-center gap-2 text-xs text-green-600 font-medium" : "flex items-center gap-2 text-xs text-gray-400"}>
                      <Icon
                        icon={newPassword.length >= 8 && newPassword.length <= 15 ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                      <span>8 to 15 characters</span>
                    </li>
                    <li className={/[A-Z]/.test(newPassword) ? "flex items-center gap-2 text-xs text-green-600 font-medium" : "flex items-center gap-2 text-xs text-gray-400"}>
                      <Icon
                        icon={/[A-Z]/.test(newPassword) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                      <span>At least 1 uppercase letter (A–Z)</span>
                    </li>
                    <li className={/[a-z]/.test(newPassword) ? "flex items-center gap-2 text-xs text-green-600 font-medium" : "flex items-center gap-2 text-xs text-gray-400"}>
                      <Icon
                        icon={/[a-z]/.test(newPassword) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                      <span>At least 1 lowercase letter (a–z)</span>
                    </li>
                    <li className={/[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(newPassword) ? "flex items-center gap-2 text-xs text-green-600 font-medium" : "flex items-center gap-2 text-xs text-gray-400"}>
                      <Icon
                        icon={/[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(newPassword) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                      <span>At least 1 special character (e.g., @, #, $, %, &, *)</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Confirm password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10"
                      maxLength={15}
                      required
                    />
                    {confirmPassword.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <Icon icon="fluent:eye-20-regular" className="w-4 h-4" />
                        ) : (
                          <Icon icon="fluent:eye-off-20-regular" className="w-4 h-4" />
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
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? "Resetting Password..." : "Set New Password"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            By continuing, you agree to our{" "}
            <span className="text-gray-600 hover:underline cursor-pointer">
              Terms &<br className="block sm:hidden" /> Privacy Policy
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
