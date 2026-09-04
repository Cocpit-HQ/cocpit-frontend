"use client";

import React, { useEffect } from "react";


interface StepSuccessProps {
  redirectUrl?: string;
  delayMs?: number;
}

export const StepSuccess: React.FC<StepSuccessProps> = ({
  redirectUrl = "/profile",
  delayMs = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = redirectUrl;
    }, delayMs);

    return () => clearTimeout(timer);
  }, [redirectUrl, delayMs]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center font-sans text-ds-text-primary select-none relative bg-ds-bg">
      {/* Centered Content Stack */}
      <div className="flex flex-col items-center gap-5 z-10 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Text Container: Header & Subheading */}
        <div className="flex flex-col items-center gap-2 p-0">
          <h1 className="w-full font-sans font-bold text-[32px] sm:text-[40px] leading-[40px] sm:leading-[48px] text-center text-ds-text-primary tracking-normal m-0 p-0">
            Your profile is <span className="text-ds-accent">ready</span>
          </h1>
          <p className="w-full font-sans font-semibold text-[14px] sm:text-[16px] leading-[20px] sm:leading-[24px] text-center text-ds-text-primary m-0 p-0">
            You&apos;re all set. Start building your network
          </p>
        </div>

      </div>

    </div>
  );
};

export default StepSuccess;
