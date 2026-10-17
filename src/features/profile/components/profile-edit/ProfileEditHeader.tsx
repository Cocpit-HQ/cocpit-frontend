"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CloseIcon, UserIcon } from "@/components/icons";

interface ProfileEditHeaderProps {
  userName?: string;
  avatarUrl?: string | null;
  subTitle?: string;
  onClose: () => void;
  headerAction?: React.ReactNode;
}

export const ProfileEditHeader: React.FC<ProfileEditHeaderProps> = ({
  userName = "User Name",
  avatarUrl,
  subTitle,
  onClose,
  headerAction,
}) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const displayAvatar = avatarUrl && avatarUrl !== failedUrl ? avatarUrl : null;

  return (
    <>
      {/* Top-Right Close Button - Desktop only (hidden on mobile, shown inline instead) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close edit profile"
        className="hidden md:flex fixed top-[40px] right-[40px] z-[60] w-[20px] h-[20px] items-center justify-center text-[var(--ds-text-primary)] hover:opacity-75 active:scale-95 transition-all cursor-pointer focus:outline-none"
      >
        <CloseIcon size={20} className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
      </button>

      {/* User Info Row */}
      <div className="w-full min-h-[32px] flex flex-row items-center justify-between gap-[8px] transition-opacity">
        {/* Left Side: Avatar + Name + Subtitle */}
        <div className="flex flex-row items-center gap-[8px] overflow-hidden">
          {/* Frame 2609611: Avatar 32x32 rounded-full */}
          <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-[var(--ds-surface-2)] border border-[var(--ds-border)]/40 shrink-0 flex items-center justify-center select-none">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={userName || "Profile avatar"}
                className="w-full h-full object-cover"
                onError={() => setFailedUrl(displayAvatar)}
              />
            ) : (
              <UserIcon className="w-4 h-4 text-[var(--ds-text-primary)] flex-none" size={16} />
            )}
          </div>
          {/* Kat Denis / Name Text + Subtitle (Frame 2609632: 24px height, 8px gap) */}
          <div className="flex flex-row items-center gap-[8px] h-[24px] overflow-hidden">
            <span className="font-['DM_Sans'] font-normal text-[16px] leading-[24px] text-[var(--ds-text-primary)] whitespace-nowrap" title={userName}>
              {userName.length > 25 ? `${userName.substring(0, 25)}...` : userName}
            </span>
            {subTitle && (
              <>
                {/* Dot (4x4px, #726B67) */}
                <span className="w-[4px] h-[4px] rounded-full bg-[var(--ds-text-muted)] shrink-0" />
                <span className="font-['DM_Sans'] font-normal text-[16px] leading-[24px] text-[var(--ds-text-muted)] whitespace-nowrap">
                  {subTitle}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Header Action (e.g. + Add new role) */}
        <div className="flex items-center gap-3 shrink-0">
          {headerAction && (
            <div className="flex items-center shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileEditHeader;
