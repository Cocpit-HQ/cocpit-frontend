"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDownIcon, LoadingIcon } from "@/components/icons";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface SearchableDropdownOption {
  id: string;
  label: string;
}

interface ProfileEditSearchableDropdownProps {
  id?: string;
  label: string;
  value: string;
  options?: (string | SearchableDropdownOption)[];
  loadOptions?: (query: string) => Promise<(string | SearchableDropdownOption)[]>;
  onSelect: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  allowCustom?: boolean;
  className?: string;
  labelClassName?: string;
  containerClassName?: string;
  maxLength?: number;
  maxLengthMessage?: string;
  emptyText?: string;
  error?: string;
  warning?: string;
}

export const ProfileEditSearchableDropdown: React.FC<ProfileEditSearchableDropdownProps> = ({
  id,
  label,
  value,
  options = [],
  loadOptions,
  onSelect,
  placeholder = "Select",
  searchable = true,
  allowCustom = true,
  emptyText = "No options found",
  maxLength,
  maxLengthMessage,
  className,
  labelClassName,
  containerClassName,
  error,
  warning,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [asyncOptions, setAsyncOptions] = useState<SearchableDropdownOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 250);
  const lastSelectedRef = useRef<string>(value || "");

  // Sync external value
  useEffect(() => {
    if (value !== query) {
      setQuery(value || "");
      lastSelectedRef.current = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (value) {
          setQuery(value);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Fetch options if loadOptions is provided
  useEffect(() => {
    if (!loadOptions) return;

    const trimmed = debouncedQuery.trim();
    if (trimmed && trimmed === lastSelectedRef.current && asyncOptions.length > 0) {
      return;
    }

    let isCancelled = false;
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const res = await loadOptions(trimmed);
        if (!isCancelled && Array.isArray(res)) {
          const seen = new Set<string>();
          const normalized: SearchableDropdownOption[] = [];
          for (const item of res) {
            const opt = typeof item === "string" ? { id: item, label: item } : item;
            const normKey = opt.label?.trim().toLowerCase();
            if (normKey && !seen.has(normKey)) {
              seen.add(normKey);
              normalized.push({ id: opt.id || opt.label, label: opt.label.trim() });
            }
          }
          setAsyncOptions(normalized);
        }
      } catch (err) {
        if (!isCancelled) setAsyncOptions([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchOptions();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, loadOptions]);

  const displayedOptions: SearchableDropdownOption[] = useMemo(() => {
    const baseList: SearchableDropdownOption[] = loadOptions
      ? asyncOptions
      : options.map((opt) => (typeof opt === "string" ? { id: opt, label: opt } : opt));

    const seen = new Set<string>();
    const uniqueList: SearchableDropdownOption[] = [];
    for (const item of baseList) {
      const key = item.label?.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueList.push(item);
      }
    }

    if (loadOptions) {
      return uniqueList;
    }

    const q = query.trim().toLowerCase();
    if (!q) return uniqueList;

    return uniqueList.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) || opt.id.toLowerCase().includes(q)
    );
  }, [loadOptions, asyncOptions, options, query]);

  // Scroll active item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const activeItem = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (maxLength && val.length > maxLength) {
      if (maxLengthMessage) {
        toast.error(maxLengthMessage);
      }
      return;
    }
    setQuery(val);
    onSelect(val);
    setIsOpen(true);
  };

  const handleSelectOption = (opt: SearchableDropdownOption) => {
    lastSelectedRef.current = opt.label;
    setQuery(opt.label);
    onSelect(opt.label);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        if (loadOptions && asyncOptions.length === 0) {
          loadOptions("").then((res) => {
            if (Array.isArray(res)) {
              const seen = new Set<string>();
              const normalized: SearchableDropdownOption[] = [];
              for (const item of res) {
                const opt = typeof item === "string" ? { id: item, label: item } : item;
                const normKey = opt.label?.trim().toLowerCase();
                if (normKey && !seen.has(normKey)) {
                  seen.add(normKey);
                  normalized.push({ id: opt.id || opt.label, label: opt.label.trim() });
                }
              }
              setAsyncOptions(normalized);
            }
          });
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < displayedOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < displayedOptions.length) {
          handleSelectOption(displayedOptions[highlightedIndex]);
        } else if (query.trim() && allowCustom) {
          lastSelectedRef.current = query.trim();
          onSelect(query.trim());
          setIsOpen(false);
        } else if (displayedOptions.length > 0) {
          handleSelectOption(displayedOptions[0]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={cn("w-full flex flex-col gap-1", containerClassName)}>
      <div
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full h-[62px] py-[8px] px-0 border-b transition-colors flex flex-col justify-center items-start gap-[10px] relative box-border",
          error
            ? "border-red-500 hover:border-red-600 focus-within:border-red-500"
            : warning
            ? "border-[var(--ds-accent)] hover:border-[var(--ds-accent)] focus-within:border-[var(--ds-accent)]"
            : isOpen
            ? "border-[var(--ds-accent)]"
            : "border-[var(--ds-border)] hover:border-[var(--ds-text-muted)] focus-within:border-[var(--ds-accent)]",
          className
        )}
      >
        <label
          htmlFor={id}
          className={cn(
            "font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-center",
            error ? "text-red-500" : warning ? "text-[var(--ds-accent)]" : "text-[var(--ds-text-secondary)]",
            labelClassName
          )}
        >
          {label}
        </label>

      {/* Input / Trigger Row */}
      <div className="w-full flex items-center justify-between h-[20px]">
        {searchable ? (
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={query}
            onFocus={() => {
              setIsOpen(true);
              if (loadOptions && asyncOptions.length === 0) {
                loadOptions("").then((res) => {
                  if (Array.isArray(res)) {
                    const seen = new Set<string>();
                    const normalized: SearchableDropdownOption[] = [];
                    for (const item of res) {
                      const opt = typeof item === "string" ? { id: item, label: item } : item;
                      const normKey = opt.label?.trim().toLowerCase();
                      if (normKey && !seen.has(normKey)) {
                        seen.add(normKey);
                        normalized.push({ id: opt.id || opt.label, label: opt.label.trim() });
                      }
                    }
                    setAsyncOptions(normalized);
                  }
                });
              }
            }}
            onChange={handleInputChange}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full bg-transparent text-[var(--ds-text-primary)] font-['DM_Sans'] font-normal text-[14px] leading-[20px] placeholder:text-[var(--ds-text-muted)] focus:outline-none p-0 m-0 truncate cursor-text"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="w-full text-left bg-transparent cursor-pointer focus:outline-none truncate font-['DM_Sans'] font-normal text-[14px] leading-[20px]"
          >
            <span className={value ? "text-[var(--ds-text-primary)]" : "text-[var(--ds-text-muted)]"}>
              {value || placeholder}
            </span>
          </button>
        )}

        <div
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) {
              inputRef.current?.focus();
            }
          }}
          className="w-4 h-4 flex items-center justify-center text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] transition-colors cursor-pointer shrink-0 ml-1"
        >
          {isLoading ? (
            <LoadingIcon className="w-3.5 h-3.5 animate-spin text-[var(--ds-text-secondary)]" />
          ) : (
            <div className={cn("w-4 h-4 flex items-center justify-center transition-transform duration-200", isOpen && "rotate-180")}>
              <ChevronDownIcon size={16} className="w-full h-full text-[var(--ds-text-primary)]" />
            </div>
          )}
        </div>
      </div>

      {/* Popover / Menu styled like OnboardingDropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-xl py-2 px-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div ref={listboxRef} className="w-full max-h-[240px] overflow-y-auto flex flex-col gap-2.5 scrollbar-hide pr-1" role="listbox">
            {displayedOptions.length > 0 ? (
              displayedOptions.map((opt, idx) => {
                const isSelected = opt.label.toLowerCase() === value.toLowerCase();
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={`search-opt-${idx}-${opt.id || opt.label}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectOption(opt)}
                    className={cn(
                      "self-stretch text-left font-['DM_Sans'] text-sm font-normal leading-normal py-1.5 px-2 rounded-md min-h-[30px] flex items-center transition-colors cursor-pointer truncate focus:outline-none bg-transparent",
                      isHighlighted
                        ? "text-[var(--ds-text-primary)]"
                        : isSelected
                        ? "text-[var(--ds-accent)] font-medium"
                        : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            ) : query.trim() && allowCustom ? (
              <div className="p-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    lastSelectedRef.current = query.trim();
                    onSelect(query.trim());
                    setIsOpen(false);
                  }}
                  className="self-stretch w-full text-left font-['DM_Sans'] text-sm font-normal leading-normal py-1.5 px-2 rounded-md min-h-[30px] flex items-center transition-colors cursor-pointer truncate text-[var(--ds-accent)] hover:opacity-80 bg-transparent focus:outline-none"
                >
                  Use &quot;{query.trim()}&quot;
                </button>
              </div>
            ) : (
              <div className="py-3 text-center text-[var(--ds-text-muted)] text-xs font-['DM_Sans']">
                {isLoading ? "Searching..." : emptyText}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      {error ? (
        <span className="font-['DM_Sans'] text-[12px] text-red-500 leading-tight">
          {error}
        </span>
      ) : warning ? (
        <span className="font-['DM_Sans'] text-[12px] text-[#EC6229] leading-tight">
          {warning}
        </span>
      ) : null}
    </div>
  );
};

export default ProfileEditSearchableDropdown;
