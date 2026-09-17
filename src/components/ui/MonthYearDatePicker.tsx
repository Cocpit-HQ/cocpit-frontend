"use client";

import React, { useState, useRef, useEffect } from "react";
import { CalendarIcon } from "@/components/icons";
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
}

export const MonthYearDatePicker: React.FC<MonthYearDatePickerProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "Select",
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div
      ref={containerRef}
      className={cn(
        "w-full py-2 border-b transition-colors flex flex-col justify-center items-start gap-2.5 relative box-sizing-border",
        disabled
          ? "opacity-50 pointer-events-none border-[var(--ds-border)]"
          : isOpen
          ? "border-[var(--ds-accent)]"
          : "border-[var(--ds-border)] hover:border-[var(--ds-text-muted)] focus-within:border-[var(--ds-accent)]",
        className
      )}
    >
      {label && (
        <label
          htmlFor={id}
          className="font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-[var(--ds-text-secondary)]"
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
        <div className="absolute top-full left-0 right-0 sm:w-[320px] mt-2 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Year Selector */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--ds-border)]">
            <span className="font-['DM_Sans'] text-xs text-[var(--ds-text-secondary)] font-medium">
              Select Year
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] font-['DM_Sans'] text-xs rounded-lg px-2.5 py-1 border border-[var(--ds-border)] focus:outline-none cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-[var(--ds-surface-1)] text-[var(--ds-text-primary)]">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((m, idx) => {
              const isSelected =
                parsed?.isValid() &&
                selectedMonth === idx &&
                selectedYear === parsed.year();
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMonthYear(idx, selectedYear)}
                  className={cn(
                    "py-2 px-1 text-center font-['DM_Sans'] text-xs font-medium rounded-lg transition-colors cursor-pointer focus:outline-none",
                    isSelected
                      ? "bg-[var(--ds-accent)] text-[#030303] font-semibold"
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
  );
};

export default MonthYearDatePicker;
