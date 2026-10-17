"use client";

import React, { useState } from "react";
import { ProfileIdentity } from "../types/profile.types";

interface ProfileIdentityChipsProps {
  initialIdentity: ProfileIdentity;
  readOnly?: boolean;
}

export function ProfileIdentityChips({ initialIdentity }: ProfileIdentityChipsProps) {
  const [identity, setIdentity] = useState<ProfileIdentity>(initialIdentity);

  React.useEffect(() => {
    setIdentity(initialIdentity);
  }, [initialIdentity]);

  if (!identity.openTo && !identity.availability && !identity.workPreference) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-col md:flex-row md:items-center w-full gap-2">
      <div className="flex items-center gap-[16px] flex-wrap md:flex-nowrap">
        {/* Open To Chip */}
        {identity.openTo && (
          <div className="profile-identity-chip flex items-center justify-center py-2 px-4 rounded-full border whitespace-nowrap text-[14px] font-normal leading-[20px] font-['DM_Sans'] dark:border-[#818CF8] dark:text-[#818CF8]">
            {identity.openTo}
          </div>
        )}

        {/* Availability Chip */}
        {identity.availability && (
          <div className="profile-identity-chip flex items-center justify-center py-2 px-4 rounded-full border whitespace-nowrap text-[14px] font-normal leading-[20px] font-['DM_Sans'] dark:border-[#818CF8] dark:text-[#818CF8]">
            {identity.availability}
          </div>
        )}

        {/* Preference Chip */}
        {identity.workPreference && (
          <div className="profile-identity-chip flex items-center justify-center py-2 px-4 rounded-full border whitespace-nowrap text-[14px] font-normal leading-[20px] font-['DM_Sans'] dark:border-[#818CF8] dark:text-[#818CF8]">
            {identity.workPreference}
          </div>
        )}
      </div>
    </div>
  );
}
