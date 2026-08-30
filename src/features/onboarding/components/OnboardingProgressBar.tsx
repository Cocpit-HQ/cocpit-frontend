"use client";

import React from "react";

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep = 1,
  totalSteps = 5,
  className = "",
}) => {
  const percentage = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);

  return (
    <div
      className={`w-[360px] h-[30px] flex flex-col items-start p-0 gap-[8px] font-['DM_Sans',sans-serif] select-none ${className}`}
    >
      {/* Step Text: 12px 500 #FFECE6 single-line */}
      <span className="h-[16px] font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-left text-[#FFECE6] whitespace-nowrap">
        Step {currentStep} Of {totalSteps}
      </span>

      {/* Frame 32: 360px x 6px Track and Fill */}
      <div className="w-[360px] h-[6px] bg-[#222228] border border-[#2C2C33] rounded-[100px] overflow-hidden relative">
        <div
          className="h-full bg-[#EC6229] rounded-[100px] transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default OnboardingProgressBar;
