"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import HandshakeAnimation from "@/components/auth/HandshakeAnimation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = () => {
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      setOtpSent(true);
      setIsVerifying(false);
      toast({
        title: "OTP Sent!",
        description: "A verification code has been sent to your email.",
      });
    }, 1500);
  };

  const handleVerifyOtp = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      setTimeout(() => {
        setEmailVerified(true);
        toast({
          title: "Email Verified!",
          description: "You can now set a new password.",
        });
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified) {
      toast({
        title: "Email Not Verified",
        description: "Please verify your email first.",
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
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Password Reset!",
      description: "Your password has been successfully reset. (Frontend demo)",
    });
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
          <div className="w-full lg:w-1/2 p-8 md:p-12">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary shadow-purple">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">
                Cocpit
              </span>
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">
              Forgot Password
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your email to reset your password
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <InputOTP maxLength={6} value={otp} onChange={handleVerifyOtp}>
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
                    Enter any 6 digits to verify (demo)
                  </p>
                </div>
              )}

              {/* New Password fields */}
              {emailVerified && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={!emailVerified || !newPassword || !confirmPassword}
              >
                Reset Password
              </Button>
            </form>

            {/* Back to login link */}
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary mt-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign in
            </Link>
          </div>

          {/* Left side - Branding with animation */}
          <div className="w-full lg:w-1/2 gradient-primary p-8 md:p-12 flex flex-col justify-center items-center relative overflow-hidden">
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
            <div className="relative z-10 text-center space-y-6 max-w-sm">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight animate-fade-in-up">
                Reset Your Password
              </h2>
              <p className="text-muted-foreground text-base md:text-lg animate-fade-in-up animation-delay-200">
                Don't worry! It happens to the best of us. We'll help you get back into your account.
              </p>
              
              {/* Handshake animation */}
              <div className="py-6 animate-fade-in-up animation-delay-400">
                <HandshakeAnimation />
              </div>
              
              {/* Steps */}
              <div className="space-y-3 text-left animate-fade-in-up animation-delay-600">
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="w-6 h-6 rounded-full bg-foreground/20 flex items-center justify-center text-xs font-medium">1</div>
                  <span className="text-sm">Enter your email address</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="w-6 h-6 rounded-full bg-foreground/20 flex items-center justify-center text-xs font-medium">2</div>
                  <span className="text-sm">Verify with OTP</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="w-6 h-6 rounded-full bg-foreground/20 flex items-center justify-center text-xs font-medium">3</div>
                  <span className="text-sm">Set your new password</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
