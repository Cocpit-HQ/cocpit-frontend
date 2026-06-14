'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { useToast } from "@/hooks/use-toast";
import { resetPassword, requestOTP, verifyOTP } from "@/services/api/auth";
import Image from "next/image";
import AuthImagePanel from "@/components/auth/AuthImagePanel";
import styles from "./ForgotPasswordForm.module.css";
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

  return (
    <>
    {resetSuccess ? (
      <div className={styles.pageWrapper} data-theme="light">
        {/* Left side - Rectangle 4 image */}
        <AuthImagePanel />

        {/* Right side - Success content */}
        <div className={styles.formPanel}>
          <div className={styles.successContent}>
            <Image
              src="/assets/Illustration - Asset 40 1.png"
              alt="Success"
              width={182}
              height={187}
              priority
            />
            <h2 className={styles.successTitle}>
              <span className={styles.titleGradient}>
                Successful
              </span>
            </h2>
            <p className={styles.successSubtitle}>
              Account recovered successfully. Redirecting to login...
            </p>
          </div>

          {/* Footer Text */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              By continuing, you agree to our <span className={styles.footerLink}>Terms &<br className={styles.mobileBreak} /> Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    ) : (
    <div className={styles.pageWrapper} data-theme="light">
      {/* Left side - Branded overlay */}
      <AuthImagePanel />

      {/* Right side - Form container */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          
          {/* Header Title */}
          <div className={styles.header}>
            <h2 className={styles.title}>
              {emailVerified ? "Create new " : otpSent && !emailVerified ? "Verify your " : "Recover your "}
              <span className={styles.titleGradient}>
                {emailVerified ? "password" : "account"}
              </span>
            </h2>
            <p className={styles.subtitle}>
              {emailVerified ? "Set a new password to continue" : otpSent && !emailVerified ? "Enter the code sent to your email" : "Find jobs, connect, grow"}
            </p>
          </div>

          {/* Step 1: Request OTP */}
          {!otpSent && (
            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Email or Phone
                </label>
                <input
                  type="text"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className={styles.input}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className={styles.primaryButton}
              >
                {isVerifying ? "Sending..." : "Continue"}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {otpSent && !emailVerified && (
            <div className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Verification code
                </label>
                <div className={styles.fieldGroup}>
                  <div className={styles.inputWrapper}>
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
                      className={`${styles.input} ${styles.inputWithIcon} ${otpError ? styles.inputError : ''}`}
                      maxLength={6}
                      required
                    />
                    {isCheckingOtp && (
                      <div className={styles.inputStatusIcon}>
                        <Loader2 className={styles.spinnerIcon} />
                      </div>
                    )}
                    {showVerified && !isCheckingOtp && (
                      <div className={`${styles.inputStatusIcon} ${styles.inputStatusIconFront}`}>
                        <Icon icon="bitcoin-icons:verify-outline" className={styles.verifyIcon} />
                      </div>
                    )}
                    {otpError && !isCheckingOtp && (
                      <div className={`${styles.inputStatusIcon} ${styles.inputStatusIconFront}`}>
                        <Icon icon="mdi:close-circle-outline" className={styles.errorIcon} />
                      </div>
                    )}
                  </div>
                  <div className={styles.otpHelperRow}>
                    {otpError ? (
                      <span className={styles.otpErrorText}>*Incorrect code, try again</span>
                    ) : (
                      <span></span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={isVerifying}
                      className={styles.resendButton}
                    >
                      Resend code
                    </button>
                  </div>
                </div>
              </div>

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
                    // Guard: don't fire if a verify request is already in-flight
                    handleVerifyOtp(otp);
                  }
                }}
                disabled={isCheckingOtp || otp.length !== 6}
                className={styles.secondaryButton}
              >
                {isCheckingOtp ? "Verifying..." : "Verify"}
              </button>
            </div>
          )}

          {/* Step 3: New Password */}
          {emailVerified && (
            <form onSubmit={handleSubmitNewPassword} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>New password</label>
                <div className={styles.inputWrapperFlex}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Set password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    maxLength={15}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={styles.passwordToggle}
                  >
                    {showNewPassword ? <Icon icon="fluent:eye-20-regular" className={styles.toggleIcon} /> : <Icon icon="fluent:eye-off-20-regular" className={styles.toggleIcon} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className={styles.checklistContainer}>
                <p className={styles.checklistTitle}>Password must contain:</p>
                <ul className={styles.checklist}>
                  <li className={(newPassword.length >= 8 && newPassword.length <= 15) ? styles.checkMet : styles.checkUnmet}>
                    <Icon
                      icon={(newPassword.length >= 8 && newPassword.length <= 15) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
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
                    placeholder="Set password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    maxLength={15}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.passwordToggle}
                  >
                    {showConfirmPassword ? <Icon icon="fluent:eye-20-regular" className={styles.toggleIcon} /> : <Icon icon="fluent:eye-off-20-regular" className={styles.toggleIcon} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting || !isPasswordValid || !confirmPassword}
                className={styles.primaryButton}
              >
                {isResetting ? "Resetting..." : "Continue"}
              </button>
            </form>
          )}

          {/* Navigation */}
          <div className={styles.navigation}>
            <p className={styles.navigationText}>
              Back to{" "}
              <Link href="/" className={styles.navigationLink}>
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            By continuing, you agree to our <span className={styles.footerLink}>Terms &<br className={styles.mobileBreak} /> Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
    )}
    </>
  );
}
