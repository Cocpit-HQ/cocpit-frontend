"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface StepErrorProps {
  onRetry?: () => void;
  errorMessage?: string;
}

export const StepError: React.FC<StepErrorProps> = ({
  onRetry,
  errorMessage,
}) => {
  return (
    <div className="w-full max-w-[1024px] mx-auto p-4 rounded-3xl inline-flex flex-col justify-start items-center gap-10 overflow-hidden select-none animate-in fade-in duration-300">
      <div className="w-full max-w-[1024px] px-4 sm:px-10 py-6 flex flex-col justify-start items-center gap-10">
        {/* Error Icon Badge */}
        <div className="p-3 bg-ds-surface-1 rounded-full border border-ds-border inline-flex justify-center items-center shadow-lg">
          <div className="size-8 relative flex items-center justify-center">
            <div className="size-6 rounded-full flex items-center justify-center">
              <AlertCircle className="size-6 text-ds-error stroke-[2]" />
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="self-stretch flex flex-col justify-start items-center gap-4">
          <div className="flex flex-col justify-center items-center gap-4">
            <div className="self-stretch flex flex-col justify-start items-center">
              <h1 className="text-center text-ds-text-primary text-[32px] sm:text-[40px] font-bold font-['DM_Sans'] leading-[48px] m-0">
                Something went wrong
              </h1>
            </div>
            <div className="w-full max-w-[624px] text-center">
              <p className="text-ds-text-secondary text-base sm:text-lg font-normal font-['DM_Sans'] leading-7 m-0">
                {errorMessage ||
                  "We completed all the required steps, but something went wrong while creating your Organization page. Please try again"}
              </p>
            </div>
          </div>
        </div>

        {/* Try Again CTA Button */}
        <div className="self-stretch inline-flex justify-center items-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="h-9 px-4 sm:px-6 py-1.5 bg-ds-accent hover:opacity-90 active:scale-95 transition-all rounded-[100px] flex justify-center items-center gap-2.5 cursor-pointer ds-focus-ring"
          >
            <span className="text-white text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
              Try again
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export { StepError as StageError };
export default StepError;
