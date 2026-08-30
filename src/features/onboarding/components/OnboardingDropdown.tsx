"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { DownArrowIcon, LoadingIcon, CloseCrossIcon } from "@/components/icons";

export interface DropdownOption {
  id: string;
  label: string;
  sublabel?: string;
  data?: any;
}

interface OnboardingDropdownProps {
  id?: string;
  placeholder?: string;
  value?: string | null;
  displayValue?: string | null;
  options: DropdownOption[];
  onSelect: (option: DropdownOption | null) => void;
  isLoading?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  onSearchChange?: (query: string) => void;
  clearable?: boolean;
  errorMessage?: string;
  placement?: "bottom" | "top";
}

export const OnboardingDropdown: React.FC<OnboardingDropdownProps> = ({
  id,
  placeholder = "Select option",
  value,
  displayValue,
  options = [],
  onSelect,
  isLoading = false,
  disabled = false,
  searchable = false,
  onSearchChange,
  clearable = true,
  errorMessage,
  placement = "bottom",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (displayValue) return displayValue;
    if (value) {
      const match = options.find((opt) => opt.id === value);
      return match ? match.label : value;
    }
    return "";
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive label to display on the trigger when not typing
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.id === value);
  }, [options, value]);

  const currentText = displayValue || selectedOption?.label || "";

  // Synchronize search text ONLY when the external selected value changes
  useEffect(() => {
    if (value) {
      const match = options.find((opt) => opt.id === value);
      setSearchQuery(match ? match.label : value);
    } else {
      // If cleared from parent
      setSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset query text to current selected value when clicking away
        if (value) {
          const match = options.find((opt) => opt.id === value);
          setSearchQuery(match ? match.label : value);
        } else {
          setSearchQuery("");
        }
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, value, options]);

  const handleToggle = () => {
    if (disabled) return;
    if (searchable) {
      setIsOpen(true);
      inputRef.current?.focus();
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  const handleItemClick = (option: DropdownOption) => {
    onSelect(option);
    setSearchQuery(option.label);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchQuery("");
    if (onSearchChange) onSearchChange("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setIsOpen(true);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Instant client-side search filtering (only when searchable is true)
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    const matched = options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(q))
    );

    const exactMatch = options.some((o) => o.label.toLowerCase() === q);
    if (!exactMatch) {
      return [{ id: searchQuery.trim(), label: searchQuery.trim() }, ...matched];
    }

    return matched;
  }, [options, searchQuery, searchable]);

  return (
    <div className="relative w-64 select-none" ref={containerRef} id={id}>
      {/* Figma Trigger: w-64 py-2 border-b border-zinc-800 inline-flex justify-between items-center */}
      <div
        onClick={handleToggle}
        className={`w-64 py-2 border-b border-zinc-800 inline-flex justify-between items-center bg-transparent cursor-pointer transition-colors ${
          errorMessage
            ? "border-[#E5484D]"
            : isOpen
            ? "border-[#EC6229]"
            : "border-[#2C2C33] hover:border-[#726B67]"
        }`}
        role="button"
        tabIndex={0}
      >
        {searchable ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className="w-[210px] bg-transparent border-none outline-none font-sans text-sm font-normal leading-normal text-[#FFECE6] placeholder-stone-500 truncate"
          />
        ) : (
          <span
            className={`font-sans text-sm font-normal leading-normal truncate max-w-[210px] ${
              currentText ? "text-[#FFECE6]" : "text-stone-500"
            }`}
          >
            {currentText || placeholder}
          </span>
        )}

        {/* Right Icon Actions */}
        <div className="size-4 p-0.5 inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden shrink-0">
          {isLoading ? (
            <LoadingIcon className="w-3.5 h-3.5 animate-spin-smooth text-[#B8ADA8]" />
          ) : (
            <div
              className={`w-4 h-4 flex items-center justify-center transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <DownArrowIcon size={16} className="w-4 h-4 text-[#FFECE6]" />
            </div>
          )}
        </div>
      </div>

      {/* Helper / Error Status text */}
      {errorMessage && (
        <div className="w-64 h-4 flex items-center justify-start mt-1">
          <span className="font-sans text-[10px] leading-[12px] text-[#E5484D]">
            {errorMessage}
          </span>
        </div>
      )}

      {/* Figma Dropdown Open Menu with generous height & padding */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 w-64 py-2 bg-black flex flex-col justify-start gap-2.5 animate-in fade-in zoom-in-95 duration-150 ${
            placement === "top" ? "bottom-[46px]" : "top-[44px]"
          }`}
        >
          {/* Options List */}
          <div className="w-full max-h-[240px] overflow-y-auto flex flex-col gap-2.5 scrollbar-hide pr-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.id === value || opt.label.toLowerCase() === searchQuery.toLowerCase();
                return (
                  <button
                    key={`${opt.id}-${index}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleItemClick(opt);
                    }}
                    className={`self-stretch text-left font-sans text-sm font-normal leading-normal py-1.5 min-h-[30px] flex items-center transition-colors cursor-pointer truncate ${
                      isSelected
                        ? "text-[#EC6229] font-medium"
                        : "text-[#B8ADA8] hover:text-[#FFECE6]"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-xs text-stone-500 ml-1.5 truncate">
                        ({opt.sublabel})
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-3 text-center text-stone-500 text-xs font-sans">
                {isLoading ? "Loading options..." : "No options found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingDropdown;
