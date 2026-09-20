"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  error?: string;
  maxLengthMessage?: string;
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
  error,
  maxLengthMessage,
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
      <div
        className={cn(
          "w-full py-2 border-b transition-colors flex flex-col justify-center items-start gap-2.5 relative box-sizing-border",
          error
            ? "border-red-500 hover:border-red-600 focus-within:border-red-500"
            : "border-[var(--ds-border)] hover:border-[var(--ds-text-muted)] focus-within:border-[var(--ds-accent)]",
          className
        )}
      >
        {/* Label & Status Badge Row */}
        <div className="w-full flex justify-between items-center">
          <label
            htmlFor={id}
            className={cn(
              "font-['DM_Sans'] font-medium text-[12px] leading-[16px]",
              error ? "text-red-500" : "text-[var(--ds-text-secondary)]"
            )}
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
              value={value}
              onChange={(e) => {
                const val = e.target.value;
                if (maxLength && val.length > maxLength) {
                  toast.error(maxLengthMessage || `Maximum ${maxLength} characters allowed`);
                  onChange(val.slice(0, maxLength));
                } else {
                  onChange(val);
                }
              }}
              placeholder={placeholder}
              className="w-full bg-transparent text-[var(--ds-text-primary)] font-['DM_Sans'] font-normal text-[14px] leading-[20px] placeholder:text-[var(--ds-text-muted)] focus:outline-none resize-none p-0 m-0 min-h-[20px] overflow-hidden"
            />
          ) : (
            <input
              id={id}
              type={type}
              inputMode={inputMode}
              pattern={pattern}
              value={value}
              onChange={(e) => {
                const val = e.target.value;
                if (maxLength && val.length > maxLength) {
                  toast.error(maxLengthMessage || `Maximum ${maxLength} characters allowed`);
                  onChange(val.slice(0, maxLength));
                } else {
                  onChange(val);
                }
              }}
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
      {error && (
        <span className="font-['DM_Sans'] text-[12px] text-red-500 leading-tight">
          {error}
        </span>
      )}
    </div>
  );
};

export default ProfileEditField;
