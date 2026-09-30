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
  allowCustom?: boolean;
  fallbackOption?: DropdownOption;
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
  allowCustom = true,
  fallbackOption,
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Scroll listbox to bring highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const activeItem = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

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
  }, [value, options]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery, isOpen]);

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
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        if (searchable) {
          setTimeout(() => inputRef.current?.focus(), 0);
        } else {
          setTimeout(() => containerRef.current?.focus(), 0);
        }
      }
      return next;
    });
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
    if (allowCustom && !exactMatch) {
      return [{ id: searchQuery.trim(), label: searchQuery.trim() }, ...matched];
    }

    if (!allowCustom && matched.length === 0 && fallbackOption) {
      return [fallbackOption];
    }

    return matched;
  }, [options, searchQuery, searchable, allowCustom, fallbackOption]);

  return (
    <div 
      className="relative w-64 select-none" 
      ref={containerRef} 
      id={id}
      onBlur={(e) => {
        if (isOpen && containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
    >
      {/* Figma Trigger: w-64 py-2 border-b border-ds-border inline-flex justify-between items-center */}
      <div
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (!isOpen && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp")) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
            }
            if (!disabled) {
              setIsOpen(true);
              if (searchable) {
                // Focus input if searchable
                setTimeout(() => inputRef.current?.focus(), 0);
              }
            }
            return;
          }

          if (isOpen) {
            switch (e.key) {
              case "ArrowDown":
                e.preventDefault();
                e.stopPropagation();
                setHighlightedIndex((prev) =>
                  prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
              case "ArrowUp":
                e.preventDefault();
                e.stopPropagation();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                break;
              case "Enter":
                e.preventDefault();
                e.stopPropagation();
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                  handleItemClick(filteredOptions[highlightedIndex]);
                } else if (filteredOptions.length > 0) {
                  handleItemClick(filteredOptions[0]); // fallback
                }
                break;
              case "Escape":
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                if (searchable) {
                  inputRef.current?.focus();
                } else {
                  (containerRef.current?.firstElementChild as HTMLElement)?.focus();
                }
                break;
            }
          }
        }}
        className={`w-64 py-2 border-b inline-flex justify-between items-center bg-transparent transition-colors focus:outline-none cursor-pointer ${
          errorMessage
            ? "border-ds-error"
            : isOpen
            ? "border-ds-accent"
            : "border-ds-border hover:border-ds-text-muted"
        }`}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        tabIndex={searchable ? -1 : 0}
      >
        {searchable ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className="w-[210px] bg-transparent border-none outline-none font-sans text-sm font-normal leading-normal text-ds-text-primary placeholder:text-ds-text-muted truncate cursor-pointer"
          />
        ) : (
          <span
            className={`font-sans text-sm font-normal leading-normal truncate max-w-[210px] ${
              currentText ? "text-ds-text-primary" : "text-ds-text-muted"
            }`}
          >
            {currentText || placeholder}
          </span>
        )}

        {/* Right Icon Actions */}
        <div className="size-4 p-0.5 inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden shrink-0">
          {isLoading ? (
            <LoadingIcon className="w-3.5 h-3.5 animate-spin-smooth text-ds-text-secondary" />
          ) : (
            <div
              className={`w-4 h-4 flex items-center justify-center transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <DownArrowIcon size={16} className="w-4 h-4 text-ds-text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Helper / Error Status text */}
      {errorMessage && (
        <div className="w-64 h-4 flex items-center justify-start mt-1">
          <span className="font-sans text-[10px] leading-[12px] text-ds-error">
            {errorMessage}
          </span>
        </div>
      )}

      {/* Figma Dropdown Open Menu with generous height & padding */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 w-64 py-2 bg-ds-bg rounded-xl px-2 flex flex-col justify-start gap-2.5 animate-in fade-in zoom-in-95 duration-150 ${
            placement === "top" ? "bottom-[46px]" : "top-[44px]"
          }`}
        >
          {/* Options List */}
          <div ref={listboxRef} id={`${id}-listbox`} className="w-full max-h-[240px] overflow-y-auto flex flex-col gap-2.5 scrollbar-hide pr-1" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.id === value || opt.label.toLowerCase() === searchQuery.toLowerCase();
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={`${opt.id}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Keep focus on input/trigger for mouse clicks
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.stopPropagation();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(false);
                        if (searchable) inputRef.current?.focus();
                        else (containerRef.current?.firstElementChild as HTMLElement)?.focus();
                      }
                      if (e.key === "Tab" && e.shiftKey && index === 0) {
                        e.preventDefault();
                        setIsOpen(false);
                        if (searchable) inputRef.current?.focus();
                        else (containerRef.current?.firstElementChild as HTMLElement)?.focus();
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleItemClick(opt);
                      if (searchable) inputRef.current?.focus();
                      else (containerRef.current?.firstElementChild as HTMLElement)?.focus();
                    }}
                    className={`self-stretch text-left font-sans text-sm font-normal leading-normal py-1.5 px-2 rounded-md min-h-[30px] flex items-center transition-colors cursor-pointer truncate focus:outline-none focus:text-ds-text-primary ${
                      isHighlighted
                        ? "text-ds-text-primary"
                        : isSelected
                        ? "text-ds-accent font-medium"
                        : "text-ds-text-secondary hover:text-ds-text-primary"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-xs text-ds-text-muted ml-1.5 truncate">
                        ({opt.sublabel})
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-3 text-center text-ds-text-muted text-xs font-sans">
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
