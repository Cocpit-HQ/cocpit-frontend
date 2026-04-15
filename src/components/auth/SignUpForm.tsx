'use client';

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { register, requestOTP, verifyOTP } from "@/services/api/auth";
import { registrationSchema } from "@/lib/validators";
import { useRouter } from "next/navigation";
import styles from "./SignUpForm.module.css";

export default function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState(1); // Step 1: Email/OTP, Step 2: Details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingOtp, setIsCheckingOtp] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const { toast } = useToast();

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
      await requestOTP(email.toLowerCase());
      setOtpSent(true);
      toast({
        title: "OTP Sent!",
        description: "A verification code has been sent to your email.",
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
    if (value.length === 6) {
      setIsCheckingOtp(true);
      try {
        await verifyOTP(email.toLowerCase(), value);
        setEmailVerified(true);
        setOtpError(false);
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified.",
        });
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

  const handleGoToStep2 = () => {
    if (emailVerified) {
      setStep(2);
    }
  };

  const handleRegister = async (data: any) => {
    setIsVerifying(true);
    try {
      const response = await register(data);
      toast({
        title: "Account Created!",
        description: "Welcome to Cocpit! Redirecting to login...",
      });
      setTimeout(() => {
        router.push("/");
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

    // Step 1: Go to step 2 on Continue click
    if (step === 1) {
      handleGoToStep2();
      return;
    }

    // Step 2: Register
    const result = registrationSchema.safeParse({
      fullName,
      email: email.toLowerCase(),
      password,
      accountType,
      otp,
    });

    if (!result.success) {
      const error = result.error.flatten();
      let errorMessage = "Please check your input.";
      if (error.fieldErrors.fullName) {
        errorMessage = error.fieldErrors.fullName[0];
      } else if (error.fieldErrors.email) {
        errorMessage = error.fieldErrors.email[0];
      } else if (error.fieldErrors.password) {
        errorMessage = error.fieldErrors.password[0];
      } else if (error.fieldErrors.accountType) {
        errorMessage = error.fieldErrors.accountType[0];
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

  return (
    <div className={styles.pageWrapper}>
      {/* Left side - Full height image */}
      <div className={styles.brandPanel}>
        <Image
          src="/assets/Rectangle 4.svg"
          alt="Sign Up"
          fill
          className={styles.brandImage}
          priority
        />
      </div>

      {/* Right side - Form container */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>

          {/* Header Title */}
          <div className={styles.header}>
            <h2 className={styles.title}>
              Welcome to{" "}
              <span className={styles.titleGradient}>
                Cocpit
              </span>
            </h2>
            <p className={styles.subtitle}>
              {step === 1 ? "Find jobs, connect, grow" : "Complete your profile"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>

            {/* ═══ STEP 1: Email + OTP ═══ */}
            {step === 1 && (
              <>
                {/* Email */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    placeholder="xyz@gmail.com"
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
                {!emailVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isVerifying || !email}
                    className={styles.verifyButton}
                  >
                    {isVerifying ? "Sending..." : otpSent ? "Resend" : "Verify"}
                  </button>
                )}

                {/* OTP Input */}
                {otpSent && !emailVerified && (
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Enter OTP</label>
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        placeholder="223344"
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

                {/* Continue Button - turns blue after OTP verified */}
                <button
                  type="submit"
                  disabled={!emailVerified || isCheckingOtp}
                  className={`${styles.submitButton} ${emailVerified ? styles.submitButtonActive : ''}`}
                >
                  Continue
                </button>

                {/* Continue with Google */}
                <button
                  type="button"
                  className={styles.googleButton}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0A8.997 8.997 0 00.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            {/* ═══ STEP 2: Full Name, Password, Account Type ═══ */}
            {step === 2 && (
              <>
                {/* Full Name */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                {/* Password */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Password</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${styles.input} ${styles.inputWithIcon}`}
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

                {/* Account Type */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Account Type</label>
                  <div className={styles.accountTypeRow}>
                    <button
                      type="button"
                      onClick={() => setAccountType("personal")}
                      className={`${styles.accountTypeButton} ${accountType === "personal" ? styles.accountTypeActive : ''}`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType("business")}
                      className={`${styles.accountTypeButton} ${accountType === "business" ? styles.accountTypeActive : ''}`}
                    >
                      Business
                    </button>
                  </div>
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={!fullName || !password || !accountType || isVerifying}
                  className={`${styles.submitButton} ${fullName && password && accountType ? styles.submitButtonActive : ''}`}
                >
                  {isVerifying ? "Creating account..." : "Continue"}
                </button>

                {/* Back to step 1 */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={styles.backButton}
                >
                  ← Back
                </button>
              </>
            )}
          </form>

          {/* Login link */}
          <div className={styles.navigation}>
            <p className={styles.navigationText}>
              Already have an account?{" "}
              <Link href="/" className={styles.navigationLink}>
                sign in
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
  );
}
