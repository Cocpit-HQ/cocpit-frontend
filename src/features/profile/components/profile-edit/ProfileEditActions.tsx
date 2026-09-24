"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProfileEditActionsProps {
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  disabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

export const ProfileEditActions: React.FC<ProfileEditActionsProps> = ({
  onSave,
  onCancel,
  isSaving = false,
  disabled = false,
  saveLabel = "Save",
  cancelLabel = "Cancel",
}) => {
  return (
    /* Frame 2609476: Action Buttons Container (162px width, 36px height, 8px gap) */
    <div className="flex flex-row items-center justify-center gap-[8px] w-[162px] h-[36px] pt-[20px] pb-[60px]">
      {/* Primary Save Button (77px width, 36px height, 100px radius) */}
      <button
        type="button"
        onClick={onSave}
        disabled={disabled || isSaving}
        className={cn(
          "w-[77px] h-[36px] px-[12px] py-[6px] rounded-full font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex items-center justify-center transition-all",
          !disabled && !isSaving
            ? "bg-[var(--ds-accent)] text-white hover:opacity-90 active:scale-95 cursor-pointer shadow-md"
            : "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] cursor-default opacity-90"
        )}
      >
        {isSaving ? "..." : saveLabel}
      </button>

      {/* Secondary Cancel Button (77px width, 36px height, 100px radius, 1px solid var(--ds-border)) */}
      <button
        type="button"
        onClick={onCancel}
        className="w-[77px] h-[36px] px-[12px] py-[6px] rounded-full border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-1)] text-[var(--ds-text-primary)] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex items-center justify-center transition-colors cursor-pointer"
      >
        {cancelLabel}
      </button>
    </div>
  );
};

export default ProfileEditActions;
