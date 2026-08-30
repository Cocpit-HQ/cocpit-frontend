"use client";

import React, { useEffect } from "react";
import { LoadingIcon, CocpitLogoIcon } from "@/components/icons";

interface StepSuccessProps {
  redirectUrl?: string;
  delayMs?: number;
}

export const StepSuccess: React.FC<StepSuccessProps> = ({
  redirectUrl = "/profile",
  delayMs = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = redirectUrl;
    }, delayMs);

    return () => clearTimeout(timer);
  }, [redirectUrl, delayMs]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center font-sans text-[#FFECE6] select-none relative bg-black">
      {/* Centered Content Stack */}
      <div className="flex flex-col items-center gap-5 z-10 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Text Container: Header & Subheading */}
        <div className="flex flex-col items-center gap-2 p-0">
          <h1 className="font-sans font-bold text-[40px] leading-[48px] text-center text-[#FFECE6] tracking-normal m-0 p-0">
            Your profile is <span className="text-[#EC6229]">ready</span>
          </h1>
          <p className="font-sans font-semibold text-[16px] leading-[24px] text-center text-[#FFECE6] m-0 p-0">
            You&apos;re all set. Start building your network
          </p>
        </div>

        {/* Button with centered loader */}
        <div className="w-64 h-[36px] bg-[#1A1A20] rounded-full flex items-center justify-center cursor-default mt-1">
          <LoadingIcon className="w-4 h-4 text-[#FFECE6] animate-spin-smooth" />
        </div>
      </div>

      {/* Watermark Logo bottom right */}
      <div className="fixed bottom-6 right-6 opacity-80 pointer-events-none">
        <CocpitLogoIcon size={28} className="w-7 h-7 text-[#FFECE6]" />
      </div>
    </div>
  );
};

export default StepSuccess;
