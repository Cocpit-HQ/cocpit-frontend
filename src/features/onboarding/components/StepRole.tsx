"use client";

import React, { useState } from "react";
import { LeftArrowIcon, LoadingIcon } from "@/components/icons";
import { useOnboardingStore } from "@/store/onboarding.store";
import { saveOnboardingRole } from "@/services/api/onboarding";
import PillButton from "./PillButton";

interface StepRoleProps {
  onNext: (role: string) => void;
  onBack: () => void;
  currentStep?: number;
  totalSteps?: number;
}

const ROLES = [
  { id: "student", label: "Student" },
  { id: "fresher", label: "Fresher" },
  { id: "intern", label: "Intern" },
  { id: "self_employed", label: "Self employed" },
  { id: "employed", label: "Employed" },
  { id: "unemployed", label: "Unemployed" },
];

export const StepRole: React.FC<StepRoleProps> = ({
  onNext,
  onBack,
  currentStep = 3,
  totalSteps = 5,
}) => {
  const { userRole, setUserRole } = useOnboardingStore();
  const [selectedId, setSelectedId] = useState<string | null>(userRole);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setUserRole(id);
  };

  const handleContinue = async () => {
    if (!selectedId || isSaving) return;

    setIsSaving(true);
    try {
      await saveOnboardingRole(selectedId);
      onNext(selectedId);
    } catch (error) {
      console.error("Failed to save role:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-[391px] min-h-[480px] p-4 flex flex-col items-center gap-5 font-['DM_Sans',sans-serif] text-[#FFECE6] select-none">
      {/* Title Section */}
      <div className="w-[359px] flex flex-col items-center justify-center p-0 gap-2 text-center">
        <span className="text-[12px] font-medium tracking-wide text-[#EC6229] uppercase">
          Step {currentStep} of {totalSteps}
        </span>
        <h1 className="text-[32px] font-bold font-['DM_Sans'] leading-[40px] tracking-tight">
          <span className="text-[#FFECE6]">What best </span>
          <span className="text-[#EC6229]">describes you?</span>
        </h1>
        <p className="text-[14px] font-normal font-['DM_Sans'] leading-[20px] text-[#B8ADA8] max-w-[320px]">
          Select your current professional or student status
        </p>
      </div>

      {/* Role Selection Grid */}
      <div className="w-[280px] grid grid-cols-2 gap-2.5 mt-2">
        {ROLES.map((role) => {
          const isSelected = selectedId === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => handleSelect(role.id)}
              className={`h-11 px-3 rounded-xl border flex items-center justify-center font-['DM_Sans'] text-sm font-medium transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#2C2C33] border-[#EC6229] text-[#FFECE6] shadow-[0_0_0_1px_#EC6229]"
                  : "bg-[#1A1A20] border-[#2C2C33] text-[#B8ADA8] hover:bg-[#2C2C33] hover:text-[#FFECE6]"
              }`}
            >
              {role.label}
            </button>
          );
        })}
      </div>

      {/* Action Row */}
      <div className="w-[260px] flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isSaving}
          className="w-9 h-9 rounded-full bg-[#1A1A20] hover:bg-[#2C2C33] flex items-center justify-center text-[#FFECE6] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          aria-label="Back"
        >
          <LeftArrowIcon size={16} className="w-4 h-4" />
        </button>

        <PillButton
          type="button"
          disabled={!selectedId || isSaving}
          isLoading={isSaving}
          onClick={handleContinue}
          label="Continue"
          className="!w-[212px]"
        />
      </div>
    </div>
  );
};

export default StepRole;
