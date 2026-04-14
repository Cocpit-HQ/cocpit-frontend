"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { Eye, EyeClosed } from "iconoir-react";
import { useToast } from "@/hooks/use-toast";
import styles from "./LoginForm.module.css";
import { signIn, getSession } from "next-auth/react";
import { GoogleLogin } from "@react-oauth/google";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const [sessionEnded, setSessionEnded] = useState(false);

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

  useEffect(() => {
    if (reason === "session_ended") {
      setSessionEnded(true);
    }
  }, [reason]);

  // Shared redirect logic — used by both credential and Google login
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

  // ─── Credential Login ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login failed",
          description: result.error,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        await handlePostLoginRedirect();
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // ─── Google Login ────────────────────────────────────────────────────────────
  const handleGoogleLogin = async (idToken: string) => {
    setIsGoogleLoading(true);
    try {
      // Pass the Google idToken through NextAuth's authorize function
      // which will call POST /auth/google on the backend
      const result = await signIn("credentials", {
        idToken,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Google login failed",
          description: result.error,
          variant: "destructive",
        });
        setIsGoogleLoading(false);
      } else {
        await handlePostLoginRedirect();
      }
    } catch (error: any) {
      toast({
        title: "Google login error",
        description: error?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col text-center items-center mb-6 md:mb-4">
        <h2 className="text-[36px] md:text-[32px] font-bold text-black tracking-tight leading-[1.1] mb-2 md:mb-1">
          <span className="block md:inline">Welcome to</span>
          <span className="hidden md:inline"> </span>
          <span className="bg-clip-text text-transparent block md:inline" style={{ backgroundImage: 'linear-gradient(90deg, #009DDF 58.17%, #22C55E 100%)' }}>Cocpit</span>
        </h2>
        <p className="text-[13px] md:text-[14px] text-gray-400 mt-1">
          Find jobs, connect, grow
        </p>
      </div>

      {sessionEnded && (
        <div className="p-3 mb-2 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">
            You were signed out because your session ended. This happens if you log out from another device or if your session expires.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-black ml-1">
            Email or Phone
          </label>
          <div className="relative">
            <input
              id="email"
              type="text"
              autoComplete="username"
              placeholder="xyz@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[48px] px-4 border border-gray-200 rounded-2xl bg-white text-black text-[13px] placeholder:text-gray-400 focus:outline-none focus:border-[#03b87b] focus:ring-1 focus:ring-[#03b87b] transition-colors"
              style={{ WebkitBoxShadow: '0 0 0 30px white inset', WebkitTextFillColor: 'black' }}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
        </div>

        {/* Password field */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-black ml-1">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="123456789"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[48px] px-4 pr-12 border border-gray-200 rounded-2xl bg-white text-black text-[13px] placeholder:text-gray-400 focus:outline-none focus:border-[#03b87b] focus:ring-1 focus:ring-[#03b87b] transition-colors"
              style={{ WebkitBoxShadow: '0 0 0 30px white inset', WebkitTextFillColor: 'black' }}
              disabled={isLoading || isGoogleLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading || isGoogleLoading}
            >
              {showPassword ? <EyeClosed className="w-[18px] h-[18px]" strokeWidth={2} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={2} />}
            </button>
          </div>
          
          <div className="flex justify-end mt-1">
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-gray-500 hover:text-[#03b87b] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Sign in button */}
        <button
          type="submit"
          className={`w-full h-[48px] bg-white border border-gray-200 rounded-2xl text-gray-600 text-[14px] font-semibold hover:bg-gray-50 transition-colors mt-2 ${
            (isLoading || isGoogleLoading) ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </span>
          ) : "Continue"}
        </button>
      </form>

      {/* Google Sign In Wrapper */}
      <div className="relative w-full h-[48px] mt-1" ref={containerRef}>
        {/* Custom Visual Button simulating designer mock exactly */}
        <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-white border border-gray-200 rounded-2xl pointer-events-none hover:bg-gray-50/50 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 8.414l8.073-4.921c1.618-1.214 3.927-.059 3.927 1.964Z" fill="#EA4335" />
            <path d="M16.364 11.73v9.273h6A1.636 1.636 0 0 0 24 19.366V5.457l-7.636 6.273Z" fill="#34A853" />
            <path d="M7.636 11.73l6.545 4.91L24 5.457v-.539a1.636 1.636 0 0 0-2.584-1.34L12 9.049 2.584 3.578A1.636 1.636 0 0 0 0 4.918v.539l7.636 6.273Z" fill="#FBBC04" />
            <path d="M0 5.457v13.909c0 .904.732 1.636 1.636 1.636h6V11.73L0 5.457Z" fill="#4285F4" />
          </svg>
          <span className="text-[14px] font-semibold text-gray-600">Continue with Gmail</span>
        </div>

        {/* Real Google Button layered invisibly on top */}
        <div className="absolute inset-0 opacity-[0.01] overflow-hidden rounded-2xl">
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

      {/* Sign up link */}
      <p className="text-center text-[12px] font-medium text-black mt-2">
        Don't have an account?{" "}
        <Link href="/signup" className="text-sky-500 hover:underline">
          sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
