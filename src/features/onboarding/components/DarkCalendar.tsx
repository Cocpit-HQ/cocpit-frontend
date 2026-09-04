"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { LeftArrowIcon, ChevronDownIcon } from "@/components/icons";

export interface DarkCalendarProps {
  value?: string; // Stored as "YYYY-MM-DD"
  onChange?: (isoDate: string, formattedDisplay: string) => void;
  maxDate?: Date;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DarkCalendar: React.FC<DarkCalendarProps> = ({
  value,
  onChange,
  maxDate: customMaxDate,
  minYear = 1920,
  maxYear: customMaxYear,
  className = "",
}) => {
  // Default max date: 16 years ago
  const maxDate = useMemo(() => {
    if (customMaxDate) return customMaxDate;
    const today = new Date();
    return new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
  }, [customMaxDate]);

  const computedMaxYear = customMaxYear ?? maxDate.getFullYear();

  // Initial view year & month (defaults to selected value, or 16 years ago)
  const initialYear = useMemo(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) return parseInt(parts[0], 10);
    }
    return computedMaxYear;
  }, [value, computedMaxYear]);

  const initialMonth = useMemo(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) return parseInt(parts[1], 10) - 1;
    }
    return maxDate.getMonth();
  }, [value, maxDate]);

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  // Dropdown open states for month and year selectors
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);

  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setIsMonthSelectOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setIsYearSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update view if value changes externally
  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
      }
    }
  }, [value]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear > minYear) {
        setViewYear((y) => y - 1);
        setViewMonth(11);
      }
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewYear === computedMaxYear && viewMonth >= maxDate.getMonth()) {
      return;
    }
    if (viewMonth === 11) {
      if (viewYear < computedMaxYear) {
        setViewYear((y) => y + 1);
        setViewMonth(0);
      }
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isNextMonthDisabled = useMemo(() => {
    return viewYear > computedMaxYear || (viewYear === computedMaxYear && viewMonth >= maxDate.getMonth());
  }, [viewYear, viewMonth, computedMaxYear, maxDate]);

  const isPrevMonthDisabled = useMemo(() => {
    return viewYear <= minYear && viewMonth <= 0;
  }, [viewYear, viewMonth, minYear]);

  // Generate Year options
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = computedMaxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [computedMaxYear, minYear]);

  // Calendar Days Grid Calculation (Sunday first)
  const calendarWeeks = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Su, 1 = Mo...
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const weeks: Array<
      Array<{
        day: number;
        isCurrentMonth: boolean;
        isDisabled: boolean;
        isSelected: boolean;
        dateIso: string;
      }>
    > = [];

    let currentWeek: Array<{
      day: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      dateIso: string;
    }> = [];

    // Leading days from previous month (disabled)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      currentWeek.push({
        day: d,
        isCurrentMonth: false,
        isDisabled: true,
        isSelected: false,
        dateIso: "",
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const candidateDate = new Date(viewYear, viewMonth, d);
      const isAfterMax = candidateDate.getTime() > maxDate.getTime();
      const isoCandidate = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isSelected = value === isoCandidate;

      currentWeek.push({
        day: d,
        isCurrentMonth: true,
        isDisabled: isAfterMax,
        isSelected,
        dateIso: isoCandidate,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Trailing days from next month (disabled)
    if (currentWeek.length > 0) {
      let nextDay = 1;
      while (currentWeek.length < 7) {
        currentWeek.push({
          day: nextDay,
          isCurrentMonth: false,
          isDisabled: true,
          isSelected: false,
          dateIso: "",
        });
        nextDay++;
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [viewYear, viewMonth, maxDate, value]);

  // Day selection
  const handleSelectDay = (cell: { day: number; isCurrentMonth: boolean; isDisabled: boolean; dateIso: string }) => {
    if (cell.isDisabled || !cell.isCurrentMonth) return;
    const formatted = `${String(cell.day).padStart(2, "0")}/${String(viewMonth + 1).padStart(2, "0")}/${viewYear}`;
    onChange?.(cell.dateIso, formatted);
  };

  return (
    <div
      className={`w-64 p-4 bg-ds-bg rounded-2xl inline-flex flex-col justify-start items-center select-none shadow-2xl border border-ds-border ${className}`}
    >
      {/* Top Bar: Nav Arrows + Month & Year Pills */}
      <div className="self-stretch inline-flex justify-between items-center relative">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isPrevMonthDisabled}
          aria-label="Previous Month"
          className="w-5 self-stretch p-0.5 flex justify-center items-center gap-2.5 overflow-hidden text-ds-text-primary hover:opacity-80 disabled:opacity-30 cursor-pointer bg-transparent border-0"
        >
          <LeftArrowIcon size={12} className="text-ds-text-primary" />
        </button>

        {/* Center Month & Year Selector Frame (w-40 flex gap-2) */}
        <div className="w-40 flex justify-start items-start gap-2">
          {/* Month Pill */}
          <div ref={monthDropdownRef} className="relative">
            <div
              onClick={() => {
                setIsMonthSelectOpen((prev) => !prev);
                setIsYearSelectOpen(false);
              }}
              className="w-20 p-1.5 bg-ds-surface-1 rounded-lg outline outline-1 outline-offset-[-0.50px] outline-ds-border flex justify-between items-center cursor-pointer hover:text-ds-text-primary transition-colors"
            >
              <div className="justify-start text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                {SHORT_MONTHS[viewMonth]}
              </div>
              <div className="size-4 p-0.5 inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
                <ChevronDownIcon size={12} className="text-ds-text-primary" />
              </div>
            </div>

            {/* Month Dropdown Menu */}
            {isMonthSelectOpen && (
              <div className="absolute top-10 left-0 z-50 w-28 max-h-48 overflow-y-auto bg-ds-surface-1 border border-ds-border rounded-lg shadow-xl p-1 flex flex-col gap-0.5 scrollbar-hide">
                {SHORT_MONTHS.map((mName, idx) => {
                  const isMonthDisabled = viewYear === computedMaxYear && idx > maxDate.getMonth();
                  const isSelected = viewMonth === idx;
                  return (
                    <button
                      key={mName}
                      type="button"
                      disabled={isMonthDisabled}
                      onClick={() => {
                        setViewMonth(idx);
                        setIsMonthSelectOpen(false);
                      }}
                      className={`text-left px-2.5 py-1 text-sm rounded-md font-['DM_Sans'] transition-colors ${
                        isSelected
                          ? "text-ds-text-primary font-semibold"
                          : isMonthDisabled
                          ? "text-ds-text-muted opacity-40 cursor-not-allowed"
                          : "text-ds-text-primary"
                      }`}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Year Pill */}
          <div ref={yearDropdownRef} className="relative">
            <div
              onClick={() => {
                setIsYearSelectOpen((prev) => !prev);
                setIsMonthSelectOpen(false);
              }}
              className="w-20 p-1.5 bg-ds-surface-1 rounded-lg outline outline-1 outline-offset-[-0.50px] outline-ds-border flex justify-between items-center cursor-pointer hover:text-ds-text-primary transition-colors"
            >
              <div className="justify-start text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                {viewYear}
              </div>
              <div className="size-4 p-0.5 inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden">
                <ChevronDownIcon size={12} className="text-ds-text-primary" />
              </div>
            </div>

            {/* Year Dropdown Menu */}
            {isYearSelectOpen && (
              <div className="absolute top-10 right-0 z-50 w-24 max-h-48 overflow-y-auto bg-ds-surface-1 border border-ds-border rounded-lg shadow-xl p-1 flex flex-col gap-0.5 scrollbar-hide">
                {yearOptions.map((y) => {
                  const isSelected = viewYear === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewYear(y);
                        if (y === computedMaxYear && viewMonth > maxDate.getMonth()) {
                          setViewMonth(maxDate.getMonth());
                        }
                        setIsYearSelectOpen(false);
                      }}
                      className={`text-left px-2.5 py-1 text-sm rounded-md font-['DM_Sans'] transition-colors ${
                        isSelected
                          ? "text-ds-text-primary font-semibold"
                          : "text-ds-text-primary"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNextMonth}
          disabled={isNextMonthDisabled}
          aria-label="Next Month"
          className="w-5 self-stretch p-0.5 flex justify-center items-center gap-2.5 overflow-hidden text-ds-text-primary hover:opacity-80 disabled:opacity-30 cursor-pointer bg-transparent border-0"
        >
          <div className="rotate-180 flex items-center justify-center">
            <LeftArrowIcon size={12} className="text-ds-text-primary" />
          </div>
        </button>
      </div>

      {/* Weekday Names + Calendar Grid */}
      <div className="self-stretch pt-4 flex flex-col justify-start items-center">
        {/* Weekday Row (Su, Mo, Tu, We, Th, Fr, Sa) */}
        <div className="self-stretch inline-flex justify-center items-center">
          {WEEK_DAYS.map((wd) => (
            <div key={wd} className="flex-1 flex justify-center items-center">
              <div className="text-center justify-center text-ds-text-muted text-xs font-normal font-['DM_Sans'] leading-4">
                {wd}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Grid rows with gap-px */}
        <div className="self-stretch flex flex-col justify-start items-center gap-px mt-2">
          {calendarWeeks.map((week, wIdx) => (
            <div key={wIdx} className="self-stretch inline-flex justify-start items-center gap-px">
              {week.map((cell, cIdx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={cIdx}
                      data-state="Disabled"
                      className="flex-1 h-8 p-1 rounded-lg flex justify-center items-center"
                    >
                      <div className="text-center justify-center text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 opacity-40">
                        {cell.day}
                      </div>
                    </div>
                  );
                }

                if (cell.isDisabled) {
                  return (
                    <div
                      key={cIdx}
                      data-state="Disabled"
                      className="flex-1 h-8 p-1 rounded-lg flex justify-center items-center cursor-not-allowed"
                    >
                      <div className="text-center justify-center text-ds-text-muted text-sm font-normal font-['DM_Sans'] leading-5 opacity-40">
                        {cell.day}
                      </div>
                    </div>
                  );
                }

                if (cell.isSelected) {
                  return (
                    <div
                      key={cIdx}
                      data-state="Active"
                      onClick={() => handleSelectDay(cell)}
                      className="flex-1 h-8 p-1 bg-ds-surface-2 rounded-lg flex justify-center items-center cursor-pointer border border-ds-accent"
                    >
                      <div className="text-center justify-center text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                        {cell.day}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cIdx}
                    data-state="Default"
                    onClick={() => handleSelectDay(cell)}
                    className="flex-1 h-8 p-1 rounded-lg flex justify-center items-center hover:bg-ds-surface-2 transition-colors cursor-pointer"
                  >
                    <div className="text-center justify-center text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5">
                      {cell.day}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DarkCalendar;
