import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import AuthImagePanel from "@/components/auth/AuthImagePanel";
 
export default function Home() {
  return (
    <div className="min-h-screen flex w-full">
      {/* Left side - Branded overlay */}
      <AuthImagePanel />
 
      {/* Right side - Form container */}
      <div className="w-full lg:w-[50%] flex flex-col justify-center items-center bg-white p-8 md:p-12 relative">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-xl" />}>
            <LoginForm />
          </Suspense>
        </div>
 
        {/* Footer Text */}
        <div className="absolute bottom-8 text-center w-full left-0 px-4">
          <p className="text-xs text-black font-medium leading-relaxed">
            By continuing, you agree to our <span className="text-[#0ea5e9] hover:underline cursor-pointer">Terms &<br className="block md:hidden" /> Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
 
 
 