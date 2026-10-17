"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  id: string;
  label: string;
}

interface ProfileEditDropdownProps {
  label: string;
  value: string;
  displayValue?: string;
  options: (string | DropdownOption)[];
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  emptyText?: string;
  error?: string;
}

export const ProfileEditDropdown: React.FC<ProfileEditDropdownProps> = ({
  label,
  value,
  displayValue,
  options,
  onSelect,
  placeholder = "Select",
  className,
  labelClassName,
  emptyText = "No options available",
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === "string" ? { id: opt, label: opt } : opt
  );

  const currentLabel =
    displayValue ||
    normalizedOptions.find((o) => o.id === value)?.label ||
    (value ? value : placeholder);

  return (
    <div className={cn("w-full flex flex-col gap-1", className)}>
      <div
        ref={containerRef}
        className={cn(
          "w-full h-[62px] py-2 px-0 border-b transition-colors flex flex-col justify-center items-start gap-[10px] relative box-border flex-none order-0 grow-0",
          error
            ? "border-red-500 hover:border-red-600 focus-within:border-red-500"
            : isOpen
            ? "border-[var(--ds-accent)]"
            : "border-[var(--ds-border)] hover:border-[var(--ds-text-muted)] focus-within:border-[var(--ds-accent)]"
        )}
      >
        <label
          className={cn(
            "font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-center flex-none order-0 grow-0",
            "text-[var(--ds-text-secondary)]",
            labelClassName
          )}
        >
          {label}
        </label>

        {/* Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none bg-transparent h-5 flex-none order-1 grow-0"
        >
        <span
          className={cn(
            "font-['DM_Sans'] font-normal text-[14px] leading-[20px] truncate max-w-[260px]",
            value ? "text-[var(--ds-text-primary)]" : "text-[var(--ds-text-muted)]"
          )}
        >
          {currentLabel}
        </span>
        <div
          className={cn(
            "w-[16px] h-[16px] text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] shrink-0 ml-1 flex items-center justify-center transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        >
          <ChevronDownIcon size={16} className="w-full h-full text-[var(--ds-text-primary)]" />
        </div>
      </button>

      {/* Dropdown Popover styled like OnboardingDropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-xl py-2 px-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full max-h-[240px] overflow-y-auto flex flex-col gap-2.5 scrollbar-hide pr-1" role="listbox">
            {normalizedOptions.length > 0 ? (
              normalizedOptions.map((opt, idx) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={`drop-opt-${idx}-${opt.id}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(isSelected ? "" : opt.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "self-stretch text-left font-['DM_Sans'] text-sm font-normal leading-normal py-1.5 px-2 rounded-md min-h-[30px] flex items-center transition-colors cursor-pointer truncate focus:outline-none bg-transparent",
                      isSelected
                        ? "text-[var(--ds-accent)] font-medium"
                        : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="py-3 text-center text-xs text-[var(--ds-text-muted)] font-['DM_Sans']">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      {error && (
        <span className="font-['DM_Sans'] text-[12px] text-red-500 leading-tight">
          {error}
        </span>
      )}
    </div>
  );
};

export default ProfileEditDropdown;
