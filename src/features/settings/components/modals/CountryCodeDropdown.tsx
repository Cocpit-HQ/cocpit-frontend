"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface CountryOption {
  code: string;
  name: string;
  label: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "+91", name: "India", label: "India (+91)" },
  { code: "+971", name: "United Arab Emirates", label: "United Arab Emirates (+971)" },
];

interface CountryCodeDropdownProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function CountryCodeDropdown({
  value,
  onChange,
  disabled = false,
}: CountryCodeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select country code"
        className="flex items-center gap-1 bg-transparent border-none outline-none text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 p-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronDown
          className={`w-4 h-4 text-ds-text-primary transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
        <span>{value}</span>
      </button>

      {/* Dropdown Popup: Exactly matching Figma spec (204px x 80px, bg: #030303 via --ds-bg, border: #2C2C33 via --ds-border, p: 12px, gap: 16px) */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute top-full left-0 mt-2 z-50 w-[204px] h-[80px] bg-ds-bg border border-ds-border rounded-[8px] p-3 flex flex-col justify-between gap-4 shadow-2xl animate-in fade-in duration-100 box-border select-none"
        >
          {COUNTRY_OPTIONS.map((country) => {
            const isSelected = country.code === value;
            return (
              <div
                key={country.code}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => {
                  onChange(country.code);
                  setIsOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(country.code);
                    setIsOpen(false);
                  }
                }}
                className={`cursor-pointer text-[14px] font-normal font-['DM_Sans'] leading-[20px] whitespace-nowrap outline-none transition-colors ${
                  isSelected
                    ? "text-ds-accent"
                    : "text-ds-text-primary hover:text-ds-accent focus:text-ds-accent"
                }`}
              >
                {country.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CountryCodeDropdown;
