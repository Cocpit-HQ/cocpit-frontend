"use client";

import React, { useState } from "react";
import { SkillsBulbIcon, SkillDeleteIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface SkillChipProps {
  name: string;
  showBulbIcon?: boolean;
  deletable?: boolean;
  onDelete?: (name: string) => void;
  canDelete?: () => boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export const SkillChip: React.FC<SkillChipProps> = ({
  name,
  showBulbIcon = true,
  deletable = false,
  onDelete,
  canDelete,
  onClick,
  disabled = false,
  className,
  title,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isDeleting) return;
    if (canDelete && !canDelete()) return;
    setIsDeleting(true);
    setTimeout(() => {
      onDelete?.(name);
    }, 300);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDeleting) return;
    if (deletable && onDelete && !onClick) {
      handleDelete(e);
      return;
    }
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      title={title}
      className={cn(
        "group h-7 px-2 py-1.5 bg-[var(--ds-surface-1)] rounded-[100px] inline-flex justify-center items-center gap-2 select-none transition-all duration-300 ease-out border border-transparent box-border",
        deletable && !disabled && "cursor-pointer hover:border-[#E5484D] hover:bg-[var(--ds-surface-1)]",
        isDeleting && "border-[#E5484D] opacity-0 scale-75 -translate-y-1 pointer-events-none",
        !deletable && onClick && "cursor-pointer hover:bg-[var(--ds-surface-2)]",
        disabled && "opacity-60 cursor-default",
        className
      )}
    >
      {/* 1. Bulb Icon (16x16) - hidden when deleting or on hover if deletable */}
      {showBulbIcon && (
        <div
          className={cn(
            "w-4 h-4 flex items-center justify-center shrink-0 transition-opacity",
            isDeleting ? "hidden" : deletable && !disabled ? "group-hover:hidden" : ""
          )}
        >
          <SkillsBulbIcon className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0" />
        </div>
      )}

      {/* 2. Skill Text (12px Regular, 16px LH, DM Sans, #726B67 on hover) */}
      <span
        className={cn(
          "h-4 font-['DM_Sans'] text-xs font-normal leading-4 whitespace-nowrap flex-none order-0 flex-grow-0 transition-colors",
          "text-[var(--ds-text-primary)]",
          (isDeleting || (deletable && !disabled)) && "group-hover:text-[#726B67]",
          isDeleting && "text-[#726B67]"
        )}
      >
        {name}
      </span>

      {/* 3. Delete Trash Icon (16x16, fill #E5484D, gap 8px from text, order-1) */}
      {deletable && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={disabled || isDeleting}
          aria-label={`Delete ${name}`}
          className={cn(
            "w-4 h-4 flex items-center justify-center shrink-0 flex-none order-1 text-[#E5484D] transition-all cursor-pointer focus:outline-none p-0",
            isDeleting ? "flex" : "hidden group-hover:flex"
          )}
        >
          <SkillDeleteIcon className="w-4 h-4 text-[#E5484D] shrink-0" />
        </button>
      )}
    </div>
  );
};

export default SkillChip;
