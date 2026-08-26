'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { MailWarning, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthImagePanel from "./AuthImagePanel";
import { register, requestOTP, verifyOTP } from "@/services/api/auth";
import { registrationSchema, getFirstMissingPasswordRequirement, isPasswordFullyValid } from "@/lib/validators";
import { PasswordRequirementsCard } from "@/components/shared/PasswordRequirementsCard";

import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { GoogleLogin } from "@react-oauth/google";
import { useForceLightTheme } from "@/hooks/use-force-light-theme";
import { resendRecoveryEmail } from "@/services/api/user";

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

    // Fallback to window.location if session is not yet available to let middleware handle routing
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
          description: "Your email has been successfully verified. Click Continue to proceed.",
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
      if (errorMessage.toLowerCase().includes("otp") || errorMessage.toLowerCase().includes("expired") || errorMessage.toLowerCase().includes("code")) {
        setStep(1);
        setEmailVerified(false);
      }
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

  const isPasswordValid = isPasswordFullyValid(password);

  return (
    <div className="min-h-screen flex w-full bg-white" data-theme="light">
      {/* Left side - Branded overlay */}
      <AuthImagePanel />
      {/* Right side - Form container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-6 md:p-12 relative">
        <div className="w-full max-w-sm flex flex-col gap-4">

          {/* Header Title */}
          <div className="flex flex-col text-center items-center">
            <h2 className="text-[32px] md:text-[36px] font-bold text-black tracking-tight leading-tight">
              {step === 2 ? (
                <>Create{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">password</span></>
              ) : otpSent ? (
                <>Verify your{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">account</span></>
              ) : pendingDeletion ? (
                <>Account{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">pending deletion</span></>
              ) : (
                <>Welcome to{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Cocpit</span></>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
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

          {/* Deletion Warning Banner */}
          {pendingDeletion && (
            <div className="w-full p-4 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col gap-3 text-xs text-orange-900">
              <div className="flex items-start gap-2.5">
                <MailWarning className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-950">Account scheduled for deletion</p>
                  <p className="text-orange-800 text-[11px] mt-0.5">
                    An account with this email is set to be permanently deleted on{" "}
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
                className="inline-flex items-center gap-1.5 bg-[#EC6229] text-white rounded-full px-3.5 py-1.5 text-xs font-medium self-start disabled:opacity-60 cursor-pointer shadow-xs hover:opacity-90 transition-opacity"
              >
                <Send className="w-3 h-3" />
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend in ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, "0")}`
                    : "Resend Recovery Email"
                }
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mt-4">

            {/* ═══ STEP 1: Email + OTP ═══ */}
            {step === 1 && (
              <>
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
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
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isVerifying || !email || otpSent || emailVerified}
                  className={`w-full py-2.5 px-4 font-medium text-sm rounded-full transition-colors ${
                    email && !emailVerified
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-sm"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  style={{ display: otpSent ? 'none' : 'block' }}
                >
                  {isVerifying ? "Sending..." : emailVerified ? "Verified" : "Verify"}
                </button>

                {/* OTP Input */}
                {otpSent && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Verification code</label>
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
                          <svg className="w-4 h-4 text-indigo-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                        </div>
                      )}
                      {emailVerified && !isCheckingOtp && (
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
                        onClick={handleSendOtp}
                        disabled={isVerifying}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline disabled:opacity-50 ml-auto cursor-pointer"
                      >
                        Resend code
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (emailVerified) {
                          setStep(2);
                        } else if (otp.length === 6) {
                          handleVerifyOtp(otp);
                        }
                      }}
                      disabled={isCheckingOtp || (!emailVerified && otp.length !== 6)}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center mt-2 cursor-pointer"
                    >
                      {isCheckingOtp ? "Verifying..." : "Continue"}
                    </button>
                  </div>
                )}


                {/* Google Sign In Wrapper */}
                <div className="relative w-full h-10" ref={containerRef}>
                  {/* Custom Visual Button simulating designer mock exactly */}
                  <div className="w-full h-10 px-4 py-2 border border-gray-200 rounded-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 transition-colors pointer-events-none shadow-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                  </div>

                  {/* Real Google Button layered invisibly on top */}
                  <div className="absolute inset-0 opacity-0 overflow-hidden rounded-full">
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10"
                      maxLength={15}
                      required
                    />
                    {password.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        {showPassword
                          ? <Icon icon="fluent:eye-20-regular" width={20} height={20} />
                          : <Icon icon="fluent:eye-off-20-regular" width={20} height={20} />
                        }
                      </button>
                    )}
                  </div>
                  <PasswordRequirementsCard password={password} className="mt-2" />
                </div>


                {/* Continue Button - turns blue when password meets requirements */}

                <button
                  type="submit"
                  disabled={!isPasswordValid || isVerifying}
                  className={`w-full py-2.5 px-4 font-medium text-sm rounded-full transition-colors disabled:cursor-not-allowed ${
                    isPasswordValid
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-sm"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isVerifying ? "Creating account..." : "Continue"}
                </button>
              </>
            )}
          </form>

          {/* Login link */}
          {step === 1 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/" className="text-indigo-600 font-medium hover:underline">
                  sign in
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
  );
}
