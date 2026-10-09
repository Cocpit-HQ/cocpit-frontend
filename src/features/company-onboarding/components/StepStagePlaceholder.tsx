"use client";

import React from "react";
import { PillButton } from "./PillButton";
import { useCompanyOnboardingStore } from "../store/company-onboarding.store";

interface StepStagePlaceholderProps {
  stage: number;
  onNext: () => void;
  onBack: () => void;
}

export const StepStagePlaceholder: React.FC<StepStagePlaceholderProps> = ({
  stage,
  onNext,
  onBack,
}) => {
  const organizationType = useCompanyOnboardingStore((s) => s.organizationType);

  const stageTitles: Record<number, string> = {
    1: "Organization Details",
    2: "Location & Presence",
    3: "Verification Documents",
    4: "Page Ready",
  };

  return (
    <div className="w-full max-w-[488px] mx-auto p-4 rounded-3xl flex flex-col justify-start items-center gap-6 animate-in fade-in duration-300">
      <div className="w-full flex flex-col justify-start items-center gap-2">
        <span className="text-[12px] font-medium font-['DM_Sans'] text-[var(--ds-accent)] uppercase tracking-wider">
          Stage {stage} of 3 • {organizationType === "COMPANY" ? "Company" : "Institute"}
        </span>
        <h2 className="text-center text-[28px] sm:text-[32px] font-bold font-['DM_Sans'] leading-tight text-ds-text-primary">
          {stageTitles[stage] || `Stage ${stage}`}
        </h2>
        <p className="text-center text-ds-text-secondary text-sm font-['DM_Sans'] leading-relaxed max-w-[380px]">
          Next stage design will be implemented in the next step.
        </p>
      </div>

      <div className="w-full p-8 rounded-2xl bg-ds-surface-1 border border-ds-border flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full bg-ds-surface-2 border border-ds-border flex items-center justify-center text-ds-text-muted">
          {stage}
        </div>
        <p className="text-xs text-ds-text-muted font-['DM_Sans']">
          Ready for Stage {stage} implementation
        </p>
      </div>

      <div className="flex flex-row items-center justify-center gap-3 w-full">
        <PillButton type="button" onClick={onBack} label="Back" className="w-[120px]" />
        {stage < 3 && (
          <PillButton type="button" onClick={onNext} label="Next" className="w-[120px]" />
        )}
      </div>
    </div>
  );
};

export default StepStagePlaceholder;
