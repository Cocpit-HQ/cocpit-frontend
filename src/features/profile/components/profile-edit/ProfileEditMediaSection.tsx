"use client";

import React, { useState } from "react";
import { ProfileEditIcon, UserIcon } from "@/components/icons";

interface ProfileEditMediaSectionProps {
  coverImage?: string | null;
  avatarImage?: string | null;
  userName?: string;
  onEditCover: () => void;
  onEditAvatar: () => void;
}

export const ProfileEditMediaSection: React.FC<ProfileEditMediaSectionProps> = ({
  coverImage,
  avatarImage,
  userName = "User",
  onEditCover,
  onEditAvatar,
}) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const displayAvatar = avatarImage && avatarImage !== failedUrl ? avatarImage : null;

  return (
    /* Frame 2609766: Banner and Profile Parent Box (800px width desktop, full width mobile) */
    <div className="w-full md:w-[800px] md:max-w-full h-auto md:h-[256px] flex flex-col items-center select-none relative">
      {/* Frame 2609600: Banner Box (800px width, 200px height, 16px radius) */}
      <div className="w-full h-[200px] rounded-[16px] overflow-hidden relative bg-[var(--ds-surface-1)] border border-[var(--ds-border)]/40">
        {coverImage ? (
          <img
            src={coverImage}
            alt="Cover"
            onDoubleClick={onEditCover}
            title="Double-click to change banner"
            className="w-full h-full object-cover cursor-pointer"
          />
        ) : (
          <div
            onClick={onEditCover}
            className="w-full h-full flex flex-col justify-center items-center gap-2 p-2.5 select-none cursor-pointer"
          >
            <div className="w-[87px] h-6 text-center text-[var(--ds-text-secondary)] text-base font-normal font-['DM_Sans'] leading-6 flex-none order-0 select-none hover:text-[var(--ds-text-primary)] transition-colors">
              Add banner
            </div>
            <div className="w-[303px] max-w-full h-4 text-center text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4 flex-none order-1 select-none">
              Recommended: 16:9 · At least 1200 × 675 px · JPG, PNG
            </div>
          </div>
        )}

        {/* Edit Cover Photo Icon Button (32x32 var(--ds-surface-1) with var(--ds-accent) icon) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditCover();
          }}
          aria-label="Edit cover photo"
          className="absolute right-[14px] bottom-[14px] w-[32px] h-[32px] rounded-full bg-[var(--ds-surface-1)] p-[6px] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
        >
          <ProfileEditIcon size={20} className="w-5 h-5 text-[var(--ds-accent)]" />
        </button>
      </div>

      {/* Frame 2609490: Profile Avatar Box (116px width, 116px height, rounded-full, -mt-60px) */}
      <div className="relative -mt-[60px] w-[116px] h-[116px] rounded-full bg-[var(--ds-surface-2)] shrink-0 flex items-center justify-center shadow-lg">
        <div className="w-full h-full rounded-full overflow-hidden flex flex-col justify-center items-center select-none bg-[var(--ds-surface-2)]">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={userName || "Profile avatar"}
              onDoubleClick={onEditAvatar}
              title="Double-click to change profile photo"
              className="w-full h-full object-cover cursor-pointer"
              onError={() => setFailedUrl(displayAvatar)}
            />
          ) : (
            <button
              type="button"
              onClick={onEditAvatar}
              aria-label="Add profile photo"
              className="w-full h-full flex flex-col justify-center items-center cursor-pointer bg-transparent border-none p-0 select-none"
            >
              <UserIcon className="w-10 h-10 text-[var(--ds-text-primary)] flex-none" size={40} />
            </button>
          )}
        </div>

        {/* Edit Avatar Icon Button (32x32 var(--ds-surface-1) with var(--ds-accent) icon, right 0, bottom 0) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditAvatar();
          }}
          aria-label="Edit profile photo"
          className="absolute right-0 bottom-0 w-[32px] h-[32px] rounded-full bg-[var(--ds-surface-1)] p-[6px] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md"
        >
          <ProfileEditIcon size={20} className="w-5 h-5 text-[var(--ds-accent)]" />
        </button>
      </div>
    </div>
  );
};

export default ProfileEditMediaSection;
