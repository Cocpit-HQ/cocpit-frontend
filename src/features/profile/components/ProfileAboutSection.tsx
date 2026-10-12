"use client";

import React from "react";
import { ExpandableText } from "@/hooks";

interface ProfileAboutSectionProps {
  bio?: string | null;
  isOwnProfile?: boolean;
  onEditBio?: () => void;
}

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({
  bio,
  isOwnProfile = true,
  onEditBio,
}) => {
  const trimmedBio = bio?.trim();
  if (!trimmedBio) return null;

  return (
    <div className="w-full max-w-[800px] px-4 md:px-0 md:pl-5 flex flex-col items-start gap-3">
      <div className="w-[48px] h-[24px] text-[var(--ds-accent)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
        About
      </div>
      <div className="w-full max-w-[780px] self-stretch flex-none order-1">
        <ExpandableText
          text={trimmedBio}
          maxLines={2}
          lineHeight={20}
          textClassName="text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] leading-5"
        />
      </div>
    </div>
  );
};

export default ProfileAboutSection;
