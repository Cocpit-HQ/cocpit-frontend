"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProfileEditFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  formatValue?: (value: string) => string;
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
  labelClassName?: string;
  inputBoxClassName?: string;
  statusBadge?: React.ReactNode;
  error?: string;
  maxLengthMessage?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export const ProfileEditField: React.FC<ProfileEditFieldProps> = ({
  id,
  label,
  value,
  onChange,
  formatValue,
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
  labelClassName,
  inputBoxClassName,
  statusBadge,
  error,
  maxLengthMessage,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<{ start: number; end: number } | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Restore cursor position when value updates to prevent jumping to end
  useIsomorphicLayoutEffect(() => {
    if (cursorRef.current && inputRef.current) {
      const { start, end } = cursorRef.current;
      inputRef.current.setSelectionRange(start, end);
      cursorRef.current = null;
    }
  }, [value]);

  // Auto-resize textarea height to fit content without artificial empty gaps
  useEffect(() => {
    if (isTextarea && textareaRef.current) {
      textareaRef.current.style.height = "20px";
      const scrollH = textareaRef.current.scrollHeight;
      if (value && scrollH > 24) {
        setIsExpanded(true);
        textareaRef.current.style.height = `${scrollH}px`;
      } else {
        setIsExpanded(false);
        textareaRef.current.style.height = "20px";
      }
    }
  }, [value, isTextarea]);

  return (
    <div className={cn("flex flex-col gap-[8px] w-full", className)}>
      <div
        className={cn(
          "w-full py-[8px] px-0 border-b transition-colors flex flex-col justify-center items-start gap-[10px] relative box-border self-stretch",
          isTextarea && isExpanded ? "min-h-[62px] h-auto" : "h-[62px]",
          error
            ? "border-red-500 hover:border-red-600 focus-within:border-red-500"
            : "border-[var(--ds-border)] hover:border-[var(--ds-text-muted)] focus-within:border-[var(--ds-accent)]",
          inputBoxClassName
        )}
      >
        {/* Label & Status Badge Row */}
        <div className="w-full flex justify-between items-center h-4 flex-none grow-0">
          <label
            htmlFor={id}
            className={cn(
              "font-['DM_Sans'] font-medium text-[12px] leading-[16px] flex-none grow-0",
              "text-[var(--ds-text-secondary)]",
              labelClassName
            )}
          >
            {label}
          </label>
          {statusBadge}
        </div>

        {/* Input Row */}
        <div className={cn("w-full flex items-center", isTextarea && isExpanded ? "min-h-[20px] h-auto" : "h-5")}>
          {prefix && (
            <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-muted)] mr-0.5 select-none">
              {prefix}
            </span>
          )}

          {isTextarea ? (
            <textarea
              ref={textareaRef}
              id={id}
              rows={rows}
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
              className="block w-full bg-transparent text-[var(--ds-text-primary)] font-['DM_Sans'] font-normal text-[14px] leading-[20px] placeholder:text-[var(--ds-text-muted)] focus:outline-none resize-none p-0 m-0 h-[20px] overflow-hidden"
            />
          ) : (
            <input
              ref={inputRef}
              id={id}
              type={type}
              inputMode={inputMode}
              pattern={pattern}
              value={value}
              onChange={(e) => {
                const rawVal = e.target.value;
                const rawCursor = e.target.selectionStart;

                let targetVal = rawVal;
                let targetCursor = rawCursor;

                if (formatValue) {
                  if (rawCursor !== null) {
                    const rawBeforeCursor = rawVal.slice(0, rawCursor);
                    const formattedBefore = formatValue(rawBeforeCursor);
                    targetCursor = formattedBefore.length;
                  }
                  targetVal = formatValue(rawVal);
                }

                if (maxLength && targetVal.length > maxLength) {
                  toast.error(maxLengthMessage || `Maximum ${maxLength} characters allowed`);
                  targetVal = targetVal.slice(0, maxLength);
                  if (targetCursor !== null) {
                    targetCursor = Math.min(targetCursor, maxLength);
                  }
                }

                if (targetCursor !== null) {
                  cursorRef.current = { start: targetCursor, end: targetCursor };
                }

                if (inputRef.current) {
                  inputRef.current.value = targetVal;
                  if (targetCursor !== null) {
                    inputRef.current.setSelectionRange(targetCursor, targetCursor);
                  }
                }

                onChange(targetVal);
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
            {(value || "").length}/{maxLength}
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
