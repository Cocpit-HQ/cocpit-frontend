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
import HandshakeAnimation from "@/components/auth/HandshakeAnimation";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
          description: "Your email has been successfully verified.",
        });
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified) {
      toast({
        title: "Email Not Verified",
        description: "Please verify your email before creating an account.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Account Created!",
      description: "Welcome to Cocpit! (Frontend demo)",
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
                <Label htmlFor="role">I am a</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fresher">Fresher</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={!emailVerified || !fullName || !password || !role}
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
                Start Your Journey
              </h2>
              <p className="text-muted-foreground text-base md:text-lg animate-fade-in-up animation-delay-200">
                Join thousands of professionals building their careers on Cocpit.
              </p>
              
              {/* Handshake animation */}
              <div className="py-6 animate-fade-in-up animation-delay-400">
                <HandshakeAnimation />
              </div>
              
              {/* Feature highlights */}
              <div className="space-y-3 text-left animate-fade-in-up animation-delay-600">
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="w-2 h-2 rounded-full bg-foreground/60" />
                  <span className="text-sm">Connect with industry leaders</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/90">
                  <div className="w-2 h-2 rounded-full bg-foreground/60" />
                  <span className="text-sm">Discover career opportunities</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/90">
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
