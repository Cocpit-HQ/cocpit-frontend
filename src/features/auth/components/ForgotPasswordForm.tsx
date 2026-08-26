'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft } from "lucide-react";
import { Icon } from "@iconify/react";
import { useToast } from "@/hooks/use-toast";
import { resetPassword, requestOTP, verifyOTP } from "@/services/api/auth";
import Image from "next/image";
import AuthImagePanel from "./AuthImagePanel";
import { useForceLightTheme } from "@/hooks/use-force-light-theme";
import { passwordSchema } from "@/lib/validators";

export default function ForgotPasswordForm() {
  useForceLightTheme();

  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCheckingOtp, setIsCheckingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerified, setShowVerified] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const isPasswordValid = newPassword.length >= 8 &&
    newPassword.length <= 15 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(newPassword);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setIsVerifying(true);
    try {
      // Always send purpose: "password_reset" — server returns 200 regardless
      // of whether the account exists, preventing account enumeration.
      await requestOTP(email.toLowerCase(), "password_reset");
      setOtpSent(true);
      toast({
        title: "OTP Sent!",
        description: "If an account exists with that email, a verification code has been sent.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async (value: string) => {
    setOtp(value);
    // In-flight guard — prevent double-fire if user types quickly or pastes
    if (value.length === 6 && !isCheckingOtp) {
      setIsCheckingOtp(true);
      try {
        await verifyOTP(email.toLowerCase(), value);
        setShowVerified(true);
        setOtpError(false);
        setError(null);
      } catch (error: any) {
        setShowVerified(false);
        setEmailVerified(false);
        setOtpError(true);
      } finally {
        setIsCheckingOtp(false);
      }
    }
  };

  const handleSubmitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const parseResult = passwordSchema.safeParse(newPassword);
    if (!parseResult.success) {
      toast({
        title: "Weak Password",
        description: parseResult.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    setIsResetting(true);
    try {
      await resetPassword(email.toLowerCase(), newPassword, otp);
      setResetSuccess(true);
      setTimeout(() => router.push("/"), 3000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "An error occurred. Please try again.";
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Resets flow back to Step 1 (enter email) from OTP or Set Password screens
  const handleGoBack = () => {
    setOtpSent(false);
    setEmailVerified(false);
    setOtp("");
    setOtpError(false);
    setShowVerified(false);
    setError(null);
  };

  return (
    <>
    {resetSuccess ? (
      <div className="min-h-screen flex w-full bg-white" data-theme="light">
        {/* Left side - Rectangle 4 image */}
        <AuthImagePanel />

        {/* Right side - Success content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-6 md:p-12 relative">
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <Image
              src="/assets/Illustration - Asset 40 1.png"
              alt="Success"
              width={182}
              height={187}
              priority
            />
            <h2 className="text-3xl font-bold text-gray-900">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                Successful
              </span>
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Account recovered successfully. Redirecting to login...
            </p>
          </div>

          {/* Footer Text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              By continuing, you agree to our <span className="text-gray-600 hover:underline cursor-pointer">Terms &<br className="block sm:hidden" /> Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    ) : (
    <div className="min-h-screen flex w-full bg-white" data-theme="light">
      {/* Left side - Branded overlay */}
      <AuthImagePanel />

      {/* Right side - Form container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-6 md:p-12 relative">
        <div className="w-full max-w-sm flex flex-col gap-4">
          
          {/* Header Title */}
          <div className="flex flex-col text-center items-center">
            <h2 className="text-[32px] md:text-[36px] font-bold text-black tracking-tight leading-tight">
              {emailVerified ? "Create new " : otpSent && !emailVerified ? "Verify your " : "Recover your "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                {emailVerified ? "password" : "account"}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {emailVerified ? "Set a new password to continue" : otpSent && !emailVerified ? "Enter the code sent to your email" : "Find jobs, connect, grow"}
            </p>
          </div>

          {/* Step 1: Request OTP */}
          {!otpSent && (
            <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="text"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
              >
                {isVerifying ? "Sending..." : "Continue"}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {otpSent && !emailVerified && (
            <div className="w-full flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Verification code
                </label>
                <div className="flex flex-col gap-1.5">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOtp(val);
                        if (otpError) setOtpError(false);
                        if (val.length === 6) {
                          handleVerifyOtp(val);
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10 ${otpError ? '!border-red-500 !ring-red-500/20' : ''}`}
                      maxLength={6}
                      required
                    />
                    {isCheckingOtp && (
                      <div className="absolute right-3 flex items-center justify-center pointer-events-none">
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      </div>
                    )}
                    {showVerified && !isCheckingOtp && (
                      <div className="absolute right-3 flex items-center justify-center pointer-events-none text-gray-400">
                        <Icon icon="bitcoin-icons:verify-outline" className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                    {otpError && !isCheckingOtp && (
                      <div className="absolute right-3 flex items-center justify-center pointer-events-none text-gray-400">
                        <Icon icon="mdi:close-circle-outline" className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    {otpError ? (
                      <span className="text-red-500 font-medium">*Incorrect code, try again</span>
                    ) : (
                      <span></span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={isVerifying}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline disabled:opacity-50 ml-auto cursor-pointer"
                    >
                      Resend code
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="p-2.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Go back to enter email"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (showVerified) {
                      setEmailVerified(true);
                      toast({
                        title: "Email Verified!",
                        description: "You may now set a new password.",
                      });
                    } else if (!isCheckingOtp) {
                      handleVerifyOtp(otp);
                    }
                  }}
                  disabled={isCheckingOtp || otp.length !== 6}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                >
                  {isCheckingOtp ? "Verifying..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {emailVerified && (
            <form onSubmit={handleSubmitNewPassword} className="w-full flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">New password</label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10"
                    maxLength={15}
                  />
                  {newPassword.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <Icon icon="fluent:eye-20-regular" className="w-4 h-4" /> : <Icon icon="fluent:eye-off-20-regular" className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Password must contain:</p>
                <ul className="space-y-1.5">
                  <li className={(newPassword.length >= 8 && newPassword.length <= 15) ? "flex items-center gap-2 text-xs text-green-600 font-medium" : "flex items-center gap-2 text-xs text-gray-400"}>
                    <Icon
                      icon={(newPassword.length >= 8 && newPassword.length <= 15) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
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
                    placeholder="Enter Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10"
                    maxLength={15}
                  />
                  {confirmPassword.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <Icon icon="fluent:eye-20-regular" className="w-4 h-4" /> : <Icon icon="fluent:eye-off-20-regular" className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="p-2.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Go back to enter email"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !isPasswordValid || !confirmPassword}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                >
                  {isResetting ? "Resetting..." : "Continue"}
                </button>
              </div>
            </form>
          )}

          {/* Navigation — only shown on Step 1 (enter email) */}
          {!otpSent && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Back to{" "}
                <Link href="/" className="text-indigo-600 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            By continuing, you agree to our <span className="text-gray-600 hover:underline cursor-pointer">Terms &<br className="block sm:hidden" /> Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
    )}
    </>
  );
}
