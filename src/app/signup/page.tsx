"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { register, requestOTP, verifyOTP } from "@/services/api/auth";
import { registrationSchema } from "@/lib/validators";

import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();
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
      console.log("Automatically verifying OTP:", value);
      try {
        await verifyOTP(email.toLowerCase(), value);
        console.log("OTP verification successful.");
        setEmailVerified(true);
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified.",
        });

        // Auto-submit if other fields are filled
        if (fullName && password && accountType) {
          console.log("Auto-submitting registration form...");
          handleRegister({
            fullName,
            email: email.toLowerCase(),
            password,
            accountType,
            otp: value
          });
        }
      } catch (error: any) {
        if (error.response?.status !== 400 && error.response?.status !== 401) {
          console.error("Unexpected OTP verification error:", error);
        }
        setOtp("");
        setEmailVerified(false);
        const errorMessage = error.response?.data?.message || error.message || "Invalid OTP code. Please try again.";
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive",
        });
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
      const response = await register(data);
      console.log("Registration successful", response);
      toast({
        title: "Account Created!",
        description: "Welcome to Cocpit! Redirecting to login...",
      });
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error: any) {
      if (error.response?.status !== 400 && error.response?.status !== 401) {
        console.error("Registration error:", error);
      }
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
    <div className="min-h-screen flex items-center justify-center bg-muted p-4 md:p-8">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Centered container */}
      <div className="relative z-10 w-full max-w-5xl bg-card rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="flex flex-col lg:flex-row-reverse">

          {/* Right side - Form */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 md:p-8 lg:p-12">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary shadow-purple">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">
                Cocpit
              </span>
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-6">
              Create your account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* Email with Verify button */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailVerified(false);
                        setOtpSent(false);
                        setOtp("");
                      }}
                      disabled={emailVerified}
                      className={emailVerified ? "border-green-500 border-2 pr-10" : ""}
                      required
                    />
                    {emailVerified && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {!emailVerified && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOtp}
                      disabled={isVerifying || !email}
                      className="shrink-0"
                    >
                      {isVerifying ? "Sending..." : otpSent ? "Resend" : "Verify"}
                    </Button>
                  )}
                </div>
              </div>

              {/* OTP Input */}
              {otpSent && !emailVerified && (
                <div className="space-y-2 animate-fade-in">
                  <Label>Enter OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={handleVerifyOtp}
                      disabled={isCheckingOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {isCheckingOtp ? "Verifying..." : "Enter the 6-digit code sent to your email"}
                  </p>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="accountType">I am a</Label>
                <Select value={accountType} onValueChange={setAccountType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fresher">Fresher</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Employer">Employer</SelectItem>
                    <SelectItem value="Freelancer">Freelancer</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={!emailVerified || !fullName || !password || !accountType || isCheckingOtp}
              >
                Create Account
              </Button>
            </form>

            {/* Login link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link href="/" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Left side - Branding with animation */}
          <div className="hidden lg:flex w-full lg:w-1/2 gradient-primary p-8 md:p-12 flex-col justify-center items-center relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                backgroundSize: '32px 32px'
              }} />
            </div>

            {/* Floating orbs */}
            <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-accent/30 blur-sm animate-float" />
            <div className="absolute bottom-16 left-8 w-16 h-16 rounded-full bg-primary/20 blur-sm animate-float-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/3 left-16 w-8 h-8 rounded-full bg-accent/40 animate-pulse-glow" />

            {/* Content */}
            <div className="relative z-10 text-center space-y-6 w-full flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight animate-fade-in-up">
                Start Your Journey
              </h2>
              <p className="text-white text-base md:text-lg animate-fade-in-up animation-delay-200">
                Where professionals meet opportunities. Build meaningful connections that accelerate your career.
              </p>

              {/* Handshake image */}
              <div className="py-8 animate-fade-in-up animation-delay-400 flex-1 flex items-center justify-center">
                <Image
                  src="/assets/pngegg.png"
                  alt="Handshake"
                  width={400}
                  height={300}
                  className="w-full h-auto max-w-none"
                />
              </div>

              {/* Feature highlights */}
              <div className="space-y-3 text-left animate-fade-in-up animation-delay-600">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 rounded-full bg-foreground/60" />
                  <span className="text-sm">Connect with industry leaders</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 rounded-full bg-foreground/60" />
                  <span className="text-sm">Discover career opportunities</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-2 h-2 rounded-full bg-foreground/60" />
                  <span className="text-sm">Showcase your skills</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
