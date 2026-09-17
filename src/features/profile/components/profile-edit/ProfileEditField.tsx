"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ProfileEditFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showCounter?: boolean;
  prefix?: string;
  isTextarea?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  rows?: number;
  className?: string;
  statusBadge?: React.ReactNode;
  isError?: boolean;
}

export const ProfileEditField: React.FC<ProfileEditFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  showCounter = false,
  prefix,
  isTextarea = false,
  type = "text",
  inputMode,
  pattern,
  rows = 1,
  className,
  statusBadge,
  isError = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height to fit content without artificial empty gaps
  useEffect(() => {
    if (isTextarea && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(20, textareaRef.current.scrollHeight)}px`;
    }
  }, [value, isTextarea]);

  return (
    <div className={cn("flex flex-col gap-[8px] w-full", className)}>
      {/* Input container with bottom border and exact 10px gap from label */}
      <div
        className={cn(
          "w-full border-b pb-[8px] pt-0 transition-colors flex flex-col justify-center items-start gap-[10px]",
          isError
            ? "border-[var(--ds-error)]"
            : "border-[var(--ds-border)] focus-within:border-[var(--ds-text-secondary)]"
        )}
      >
        {/* Label & Status Badge Row */}
        <div className="w-full flex items-center justify-between">
          <label
            htmlFor={id}
            className="font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-[var(--ds-text-secondary)]"
          >
            {label}
          </label>
          {statusBadge}
        </div>

        {/* Input Row */}
        <div className="w-full flex items-center">
          {prefix && (
            <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-muted)] mr-0.5 select-none">
              {prefix}
            </span>
          )}

          {isTextarea ? (
            <textarea
              ref={textareaRef}
              id={id}
              rows={1}
              maxLength={maxLength}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-[var(--ds-text-primary)] font-['DM_Sans'] font-normal text-[14px] leading-[20px] placeholder:text-[var(--ds-text-muted)] focus:outline-none resize-none p-0 m-0 min-h-[20px] overflow-hidden"
            />
          ) : (
            <input
              id={id}
              type={type}
              inputMode={inputMode}
              pattern={pattern}
              maxLength={maxLength}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-[var(--ds-text-primary)] font-['DM_Sans'] font-normal text-[14px] leading-[20px] placeholder:text-[var(--ds-text-muted)] focus:outline-none p-0 m-0 h-[20px]"
            />
          )}
        </div>
      </div>

      {/* Right-aligned Counter below */}
      {showCounter && maxLength && (
        <div className="w-full flex justify-end">
          <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-muted)]">
            {value.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProfileEditField;
