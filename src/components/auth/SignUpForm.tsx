'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { MailWarning, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthImagePanel from "@/components/auth/AuthImagePanel";
import { register, requestOTP, verifyOTP } from "@/services/api/auth";
import { registrationSchema } from "@/lib/validators";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { GoogleLogin } from "@react-oauth/google";
import { useForceLightTheme } from "@/hooks/use-force-light-theme";
import { resendRecoveryEmail } from "@/services/api/user";

import styles from "./SignUpForm.module.css";

export default function SignUpForm() {
  useForceLightTheme();

  const router = useRouter();
  const [step, setStep] = useState(1); // Step 1: Email/OTP, Step 2: Details
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingOtp, setIsCheckingOtp] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const { toast } = useToast();
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

  const handleGoogleLogin = async (idToken: string) => {
    setIsGoogleLoading(true);
    setPendingDeletion(null);
    try {
      const result = await signIn("credentials", {
        idToken,
        accountType: "Student",
        redirect: false,
      });

      if (result?.error) {
        // Check if it's a pending deletion error
        try {
          const parsed = JSON.parse(result.error);
          if (parsed?.code === "ACCOUNT_PENDING_DELETION") {
            setPendingDeletion({ deletionDate: parsed.deletionDate, email: parsed.email || "" });
            setIsGoogleLoading(false);
            return;
          }
        } catch { /* not a JSON error */ }
        toast({
          title: "Google sign-up failed",
          description: result.error,
          variant: "destructive",
        });
        setIsGoogleLoading(false);
      } else {
        await handlePostLoginRedirect();
      }
    } catch (error: any) {
      toast({
        title: "Google sign-up error",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

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

  const handleSendOtp = async () => {
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
      await requestOTP(email.toLowerCase(), "signup");
      setOtpSent(true);
      toast({
        title: "OTP Sent!",
        description: "A verification code has been sent to your email.",
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Please try again.";
      toast({
        title: "Failed to send OTP",
        description: message,
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
        setEmailVerified(true);
        setOtpError(false);
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified.",
        });
        // Automatically proceed to password creation
        setTimeout(() => {
          setStep(2);
        }, 800);
      } catch (error: any) {
        setEmailVerified(false);
        setOtpError(true);
      } finally {
        setIsCheckingOtp(false);
      }
    } else {
      setEmailVerified(false);
    }
  };


  const handleRegister = async (data: any) => {
    setIsVerifying(true);
    try {
      await register(data);
      
      // Auto-login after registration
      const loginResult = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (loginResult?.error) {
        throw new Error("Registration successful, but automatic login failed. Please sign in manually.");
      }

      toast({
        title: "Account Created!",
        description: "Welcome to Cocpit! Setting up your profile...",
      });
      
      setTimeout(() => {
        router.push("/onboarding");
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) return; // Guard clause, shouldn't happen, but just in case
    // Step 2: Register
    const result = registrationSchema.safeParse({
      email: email.toLowerCase(),
      password,
      otp,
    });

    if (!result.success) {
      const error = result.error.flatten();
      let errorMessage = "Please check your input.";
      if (error.fieldErrors.password) {
        errorMessage = error.fieldErrors.password[0];
      } else if (error.fieldErrors.otp) {
        errorMessage = error.fieldErrors.otp[0];
      }
      toast({
        title: "Invalid Input",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    await handleRegister(result.data);
  };

  const isPasswordValid = password.length >= 8 &&
    password.length <= 15 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(password);

  return (
    <div className={styles.pageWrapper} data-theme="light">
      {/* Left side - Branded overlay */}
      <AuthImagePanel />
      {/* Right side - Form container */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>

          {/* Header Title */}
          <div className={styles.header}>
            <h2 className={styles.title}>
              {step === 2 ? (
                <>Create{" "}<span className={styles.titleGradient}>password</span></>
              ) : otpSent ? (
                <>Verify your{" "}<span className={styles.titleGradient}>account</span></>
              ) : pendingDeletion ? (
                <>Account{" "}<span className={styles.titleGradient}>pending deletion</span></>
              ) : (
                <>Welcome to{" "}<span className={styles.titleGradient}>Cocpit</span></>
              )}
            </h2>
            <p className={styles.subtitle}>
              {step === 2
                ? "Set a password to continue"
                : otpSent
                  ? "Enter the code sent to your email"
                  : pendingDeletion
                    ? "Your account is scheduled for deletion"
                    : "Find jobs, connect, grow"
              }
            </p>
          </div>

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
                    {pendingDeletion.deletionDate
                      ? <>Permanently deleted on <strong>{new Date(pendingDeletion.deletionDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>. </>
                      : ""}
                    Check your email for the restoration link.
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

          <form onSubmit={handleSubmit} className={styles.form}>

            {/* ═══ STEP 1: Email + OTP ═══ */}
            {step === 1 && (
              <>
                {/* Email */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailVerified(false);
                      setOtpSent(false);
                      setOtp("");
                    }}
                    disabled={emailVerified}
                    className={styles.input}
                    required
                  />
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isVerifying || !email || otpSent || emailVerified}
                  className={`${styles.verifyButton} ${email && !emailVerified ? styles.verifyButtonActive : ""
                    }`}
                  style={{ display: otpSent ? 'none' : 'block' }}
                >
                  {isVerifying ? "Sending..." : emailVerified ? "Verified" : "Verify"}
                </button>

                {/* OTP Input */}
                {otpSent && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Verification code</label>
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
                          <svg className={styles.spinnerIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className={styles.spinnerTrack} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className={styles.spinnerArc} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                        </div>
                      )}
                      {emailVerified && !isCheckingOtp && (
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
                        onClick={handleSendOtp}
                        disabled={isVerifying}
                        className={styles.resendButton}
                      >
                        Resend code
                      </button>
                    </div>
                  </div>
                )}


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
              </>
            )}

            {/* ═══ STEP 2: Create Password ═══ */}
            {step === 2 && (
              <>
                {/* Password */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Password</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Set password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      maxLength={15}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.passwordToggle}
                    >
                      {showPassword
                        ? <Icon icon="fluent:eye-20-regular" width={20} height={20} />
                        : <Icon icon="fluent:eye-off-20-regular" width={20} height={20} />
                      }
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className={styles.checklistContainer}>
                  <p className={styles.checklistTitle}>Password must contain:</p>
                  <ul className={styles.checklist}>
                    <li className={(password.length >= 8 && password.length <= 15) ? styles.checkMet : styles.checkUnmet}>
                      <Icon
                        icon={(password.length >= 8 && password.length <= 15) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className={styles.checkIcon}
                      />
                      <span>8 to 15 characters</span>
                    </li>
                    <li className={/[A-Z]/.test(password) ? styles.checkMet : styles.checkUnmet}>
                      <Icon
                        icon={/[A-Z]/.test(password) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className={styles.checkIcon}
                      />
                      <span>At least 1 uppercase letter (A–Z)</span>
                    </li>
                    <li className={/[a-z]/.test(password) ? styles.checkMet : styles.checkUnmet}>
                      <Icon
                        icon={/[a-z]/.test(password) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className={styles.checkIcon}
                      />
                      <span>At least 1 lowercase letter (a–z)</span>
                    </li>
                    <li className={/[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(password) ? styles.checkMet : styles.checkUnmet}>
                      <Icon
                        icon={/[@#$%\^&*!?:;_=\-+(){}[\]|\\/.,~`"'<>]/.test(password) ? "carbon:checkmark-filled" : "carbon:dot-mark"}
                        className={styles.checkIcon}
                      />
                      <span>At least 1 special character (e.g., @, #, $, %, &, *)</span>
                    </li>
                  </ul>
                </div>

                {/* Continue Button - turns blue when password meets requirements */}
                <button
                  type="submit"
                  disabled={!isPasswordValid || isVerifying}
                  className={`${styles.submitButton} ${isPasswordValid ? styles.submitButtonActive : ''}`}
                >
                  {isVerifying ? "Creating account..." : "Continue"}
                </button>
              </>
            )}
          </form>

          {/* Login link */}
          {step === 1 && (
            <div className={styles.navigation}>
              <p className={styles.navigationText}>
                Already have an account?{" "}
                <Link href="/" className={styles.navigationLink}>
                  sign in
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            By continuing, you agree to our <span className={styles.footerLink}>Terms &<br className={styles.mobileBreak} /> Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
