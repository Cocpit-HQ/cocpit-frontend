"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import PillButton from "./PillButton";

export const StepSuccess: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="w-full flex flex-col items-center gap-6 text-center py-4">
      {/* Success Badge Icon */}
      <div className="w-16 h-16 rounded-full bg-ds-surface-1 border border-ds-border flex items-center justify-center text-ds-success">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-[40px] font-bold font-['DM_Sans'] leading-[48px] tracking-tight">
          <span className="text-ds-text-primary">Password </span>
          <span className="text-ds-accent">reset</span>
        </h1>
        <p className="text-base font-semibold font-['DM_Sans'] leading-6 text-ds-text-primary max-w-[360px]">
          Your password has been successfully reset. Redirecting to login...
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-2">
        <PillButton
          type="button"
          onClick={() => router.push("/")}
          label="Log in"
        />
      </div>
    </div>
  );
};

export default StepSuccess;
