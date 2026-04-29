"use client";

import React, { useState } from "react";
import { ProfileIdentity } from "@/types/profile";

interface ProfileIdentityChipsProps {
  initialIdentity: ProfileIdentity;
  readOnly?: boolean;
}

export function ProfileIdentityChips({ initialIdentity }: ProfileIdentityChipsProps) {
  const [identity, setIdentity] = useState<ProfileIdentity>(initialIdentity);

  React.useEffect(() => {
    setIdentity(initialIdentity);
  }, [initialIdentity]);
  return (
    <div className="mt-1 flex flex-col md:flex-row md:items-center w-full gap-2">
      <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
        {/* Open To Chip */}
        <div className="w-[101px] h-[36px] pt-[8px] pr-[16px] pb-[8px] pl-[16px] flex items-center justify-center gap-[10px] rounded-[24px] border border-[#818CF8] bg-[#FFFFFF] whitespace-nowrap text-[14px] font-normal text-[#818CF8] leading-[20px] font-[family-name:var(--font-poppins)]">
          {identity.openTo}
        </div>
        
        {/* Availability Chip */}
        <div className="w-[101px] h-[36px] pt-[8px] pr-[16px] pb-[8px] pl-[16px] flex items-center justify-center gap-[10px] rounded-[24px] border border-[#818CF8] bg-[#FFFFFF] whitespace-nowrap text-[14px] font-normal text-[#818CF8] leading-[20px] font-[family-name:var(--font-poppins)]">
          {identity.availability}
        </div>
        
        {/* Preference Chip */}
        <div className="w-[101px] h-[36px] pt-[8px] pr-[16px] pb-[8px] pl-[16px] flex items-center justify-center gap-[10px] rounded-[24px] border border-[#818CF8] bg-[#FFFFFF] whitespace-nowrap text-[14px] font-normal text-[#818CF8] leading-[20px] font-[family-name:var(--font-poppins)]">
          {identity.workPreference}
        </div>
      </div>
    </div>
  );
}
