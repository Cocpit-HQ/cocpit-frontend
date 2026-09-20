"use client";

import React, { useState, useRef, useEffect } from "react";
import { CalendarIcon } from "@/components/icons";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => currentYear + 5 - i);

export interface MonthYearDatePickerProps {
  id?: string;
  label?: string;
  value?: string | null; // e.g., "2025-10-01" or "Oct 2025" or "2025-10"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export const MonthYearDatePicker: React.FC<MonthYearDatePickerProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "Select",
  disabled = false,
  className,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsed = value ? dayjs(value) : null;
  const initialMonth = parsed?.isValid() ? parsed.month() : new Date().getMonth();
  const initialYear = parsed?.isValid() ? parsed.year() : currentYear;

  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);

  useEffect(() => {
    if (value) {
      const d = dayjs(value);
      if (d.isValid()) {
        setSelectedMonth(d.month());
        setSelectedYear(d.year());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // If year dropdown is open and we clicked outside of it, just close the year dropdown
      if (isYearDropdownOpen && yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setIsYearDropdownOpen(false);
        return;
      }
      
      // If clicking completely outside the whole date picker, close the date picker
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsYearDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isYearDropdownOpen]);

  // Format display text (e.g. "Dec 2025")
  const displayText = value
    ? dayjs(value).isValid()
      ? dayjs(value).format("MMM YYYY")
      : value
    : "";

  const handleSelectMonthYear = (monthIdx: number, year: number) => {
    setSelectedMonth(monthIdx);
    setSelectedYear(year);
    const monthStr = String(monthIdx + 1).padStart(2, "0");
    const dateStr = `${year}-${monthStr}-01`;
    onChange(dateStr);
    setIsOpen(false);
  };

  return (
    <div className="w-full flex flex-col gap-1">
      <div
        ref={containerRef}
        className={cn(
          "w-full py-2 border-b transition-colors flex flex-col justify-center items-start gap-2.5 relative box-sizing-border",
          disabled
            ? "opacity-50 pointer-events-none border-[var(--ds-border)]"
            : error
            ? "border-red-500 hover:border-red-600 focus-within:border-red-500"
            : isOpen
            ? "border-[var(--ds-accent)]"
            : "border-[var(--ds-border)] hover:border-[var(--ds-text-muted)] focus-within:border-[var(--ds-accent)]",
          className
        )}
      >
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "font-['DM_Sans'] font-medium text-[12px] leading-[16px]",
              error ? "text-red-500" : "text-[var(--ds-text-secondary)]"
            )}
          >
            {label}
          </label>
        )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none bg-transparent h-[20px] p-0"
      >
        <span
          className={cn(
            "font-['DM_Sans'] font-normal text-[14px] leading-[20px] truncate",
            displayText ? "text-[var(--ds-text-primary)]" : "text-[var(--ds-text-muted)]"
          )}
        >
          {displayText || placeholder}
        </span>
        <div className="w-[16px] h-[16px] text-[var(--ds-text-primary)] shrink-0 ml-1 flex items-center justify-center">
          <CalendarIcon size={16} className="w-full h-full text-[var(--ds-text-primary)]" />
        </div>
      </button>

      {/* Date Picker Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:w-[280px] mt-2 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-[16px] p-5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Row */}
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors focus:outline-none"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>

            <div className="relative flex items-center" ref={yearDropdownRef}>
              <button
                type="button"
                onClick={() => setIsYearDropdownOpen((prev) => !prev)}
                className="appearance-none bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] font-['DM_Sans'] text-[15px] font-medium rounded-lg pl-3 pr-8 py-1.5 focus:outline-none cursor-pointer border border-[var(--ds-border)] hover:border-[var(--ds-text-secondary)] transition-colors flex items-center"
              >
                {selectedYear}
                <ChevronDown size={14} strokeWidth={2.5} className="absolute right-3 text-[var(--ds-text-secondary)] pointer-events-none" />
              </button>

              {isYearDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[80px] max-h-[200px] overflow-y-auto bg-[var(--ds-surface-2)] border border-[var(--ds-border)] rounded-lg shadow-xl z-[60] flex flex-col py-1 scrollbar-thin scrollbar-thumb-[var(--ds-border)] scrollbar-track-transparent">
                  {YEARS.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setSelectedYear(y);
                        setIsYearDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-center px-2 py-1.5 text-[14px] font-['DM_Sans'] transition-colors focus:outline-none",
                        selectedYear === y
                          ? "bg-[var(--ds-surface-1)] text-[var(--ds-text-primary)] font-medium"
                          : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-1)]"
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors focus:outline-none"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-2">
            {MONTHS.map((m, idx) => {
              const isSelected = selectedMonth === idx;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMonthYear(idx, selectedYear)}
                  className={cn(
                    "py-2 text-center font-['DM_Sans'] text-[15px] rounded-lg transition-colors cursor-pointer focus:outline-none",
                    isSelected
                      ? "text-[#EC6229] font-medium"
                      : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)]"
                  )}
                >
                  {m}
                </button>
              );
            })}
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

export default MonthYearDatePicker;
