"use client";

import React, { useEffect } from "react";
import { Check } from "lucide-react";

interface StepCongratulationsProps {
  onClose?: () => void;
}

export const StepCongratulations: React.FC<StepCongratulationsProps> = ({ onClose }) => {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="w-full max-w-[1024px] mx-auto p-4 rounded-3xl inline-flex flex-col justify-start items-center gap-10 overflow-hidden select-none animate-in fade-in duration-300">
      <div className="w-full max-w-[1024px] px-4 sm:px-10 py-6 flex flex-col justify-start items-center gap-10">
        {/* Success Icon Badge */}
        <div className="size-14 bg-ds-surface-1 rounded-full border border-ds-border inline-flex justify-center items-center shadow-lg">
          <div className="size-8 relative flex items-center justify-center">
            <div className="size-6 rounded-full border-2 border-ds-accent flex items-center justify-center">
              <Check className="size-3.5 text-ds-accent stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="self-stretch flex flex-col justify-start items-center gap-4">
          <div className="flex flex-col justify-start items-center gap-4">
            <div className="self-stretch flex flex-col justify-start items-center">
              <h1 className="text-center text-ds-text-primary text-[32px] sm:text-[40px] font-bold font-['DM_Sans'] leading-[48px] m-0">
                Congratulations
              </h1>
            </div>
            <div className="text-center">
              <p className="text-ds-text-secondary text-sm sm:text-base font-normal font-['DM_Sans'] leading-6 m-0">
                Your company page is now live. You have been
                <br />
                assigned as the{" "}
                <span className="text-ds-accent text-sm sm:text-base font-semibold font-['DM_Sans'] leading-6">
                  Owner
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { StepCongratulations as StageCongratulations };
export default StepCongratulations;
