"use client";

import React, { useState, useCallback, useEffect } from "react";
import { OrgBuildingIcon, EduGraduationIcon } from "@/components/icons";
import { useCompanyOnboardingStore } from "../store/company-onboarding.store";
import { OrganizationType } from "../types/company-onboarding.types";
import { PillButton } from "./PillButton";

interface StepChooseOrganizationProps {
  onNext: () => void;
}

export const StepChooseOrganization: React.FC<StepChooseOrganizationProps> = ({ onNext }) => {
  const organizationType = useCompanyOnboardingStore((s) => s.organizationType);
  const setOrganizationType = useCompanyOnboardingStore((s) => s.setOrganizationType);

  const [selected, setSelected] = useState<OrganizationType | null>(organizationType || null);

  useEffect(() => {
    setSelected(organizationType || null);
  }, [organizationType]);

  const handleSelect = useCallback((type: OrganizationType) => {
    setOrganizationType(type);
  }, [setOrganizationType]);

  const handleContinue = useCallback(() => {
    if (!organizationType) return;
    onNext();
  }, [organizationType, onNext]);

  return (
    <div className="w-full max-w-[560px] mx-auto p-4 rounded-[24px] flex flex-col justify-start items-center gap-5 select-none animate-in fade-in duration-300">
      {/* Title & Subtitle Header */}
      <div className="w-full flex flex-col justify-start items-center gap-2">
        <h1 className="text-center text-[32px] leading-[40px] sm:text-[40px] sm:leading-[48px] font-bold ds-text-title m-0 sm:whitespace-nowrap">
          <span className="text-ds-text-primary">Create a </span>
          <span className="text-ds-accent">business</span>
          <span className="text-ds-text-primary"> page</span>
        </h1>
        <p className="w-full max-w-[480px] text-center text-ds-text-primary text-[15px] sm:text-base font-semibold font-['DM_Sans'] leading-6">
          Build a page for your organization to connect, share, and <br className="hidden sm:block" /> grow on Cocpit. Choose a page type to continue
        </p>
      </div>

      {/* Frame 2609478: Options Stack */}
      <div className="w-[208px] flex flex-col items-center p-0 gap-[12px]">
        {/* Frame 2609473: Company Card */}
        <button
          type="button"
          onClick={() => handleSelect("COMPANY")}
          className={`w-[208px] h-[110px] py-2 px-3 rounded-[16px] flex flex-col justify-center items-center gap-3 cursor-pointer transition-all outline-none border focus-visible:ring-1 focus-visible:ring-ds-accent ${
            organizationType === "COMPANY"
              ? "bg-ds-surface-2 border-ds-accent"
              : "bg-transparent border-transparent hover:bg-ds-surface-1/50"
          }`}
        >
          {/* Company Icon */}
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <OrgBuildingIcon
              size={20}
              className="w-5 h-5 text-ds-text-primary"
            />
          </div>
          {/* Company Text */}
          <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-ds-text-primary text-center">
            Company
          </span>
        </button>

        {/* Frame 2608505: Or Divider */}
        <div className="w-[208px] h-4 flex flex-row justify-center items-center p-0 gap-2">
          <div className="flex-1 h-0 border-t border-ds-border" />
          <span className="text-center font-['DM_Sans'] text-xs font-normal leading-4 text-ds-text-muted">
            Or
          </span>
          <div className="flex-1 h-0 border-t border-ds-border" />
        </div>

        {/* Frame 2609474: Institute Card */}
        <button
          type="button"
          onClick={() => handleSelect("INSTITUTION")}
          className={`w-[208px] h-[110px] py-2 px-3 rounded-[16px] flex flex-col justify-center items-center gap-3 cursor-pointer transition-all outline-none border focus-visible:ring-1 focus-visible:ring-ds-accent ${
            organizationType === "INSTITUTION"
              ? "bg-ds-surface-2 border-ds-accent"
              : "bg-transparent border-transparent hover:bg-ds-surface-1/50"
          }`}
        >
          {/* Institute Icon */}
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <EduGraduationIcon
              size={20}
              className="w-5 h-5 text-ds-text-primary"
            />
          </div>
          {/* Institute Text */}
          <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-ds-text-primary text-center">
            Institute
          </span>
        </button>
      </div>

      {/* Continue Button */}
      <PillButton
        type="button"
        disabled={!organizationType}
        onClick={handleContinue}
        label="Continue"
        className="w-full sm:w-[260px]"
      />
    </div>
  );
};

export default StepChooseOrganization;
