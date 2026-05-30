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

  return (
    <div className="mt-1 flex flex-col md:flex-row md:items-center w-full gap-2">
      <div className="flex items-center gap-[16px] flex-wrap md:flex-nowrap">
        {/* Open To Chip */}
        <div className="profile-identity-chip flex items-center justify-center py-2 px-4 rounded-full border whitespace-nowrap text-[14px] font-normal leading-[20px] font-[family-name:var(--font-poppins)]">
          {identity.openTo}
        </div>

        {/* Availability Chip */}
        <div className="profile-identity-chip flex items-center justify-center py-2 px-4 rounded-full border whitespace-nowrap text-[14px] font-normal leading-[20px] font-[family-name:var(--font-poppins)]">
          {identity.availability}
        </div>

        {/* Preference Chip */}
        <div className="profile-identity-chip flex items-center justify-center py-2 px-4 rounded-full border whitespace-nowrap text-[14px] font-normal leading-[20px] font-[family-name:var(--font-poppins)]">
          {identity.workPreference}
        </div>
      </div>
    </div>
  );
}
