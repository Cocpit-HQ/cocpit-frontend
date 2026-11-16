'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Loader2, X } from 'lucide-react';
import { SearchPillChevron } from '../SearchPillChevron';

export interface PeopleFilterOption {
  label: string;
  value: string;
}

interface PeopleFilterPopoverProps {
  title: string;
  options: (string | PeopleFilterOption)[];
  selectedValue?: string | string[];
  selectedValues?: string[];
  onSelect?: (value: string | undefined) => void;
  onToggle?: (value: string) => void;
  hasSearch?: boolean;
  hasSearchIcon?: boolean;
  widthClass?: string;
  buttonWidthClass?: string;
  loadOptions?: (term: string) => Promise<(string | PeopleFilterOption)[]>;
  customSearchFilter?: (term: string) => (string | PeopleFilterOption)[];
}

export const PeopleFilterPopover: React.FC<PeopleFilterPopoverProps> = ({
  title,
  options,
  selectedValue,
  selectedValues,
  onSelect,
  onToggle,
  hasSearch = true,
  hasSearchIcon = false,
  widthClass = 'w-auto min-w-[180px] max-w-[300px]',
  buttonWidthClass = 'w-auto',
  loadOptions,
  customSearchFilter,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [asyncOptions, setAsyncOptions] = useState<PeopleFilterOption[] | null>(null);
  const [isLoadingAsync, setIsLoadingAsync] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const openSelectionsSnapshotRef = useRef<string[]>([]);

  // Option A (Minimalist): Active when 1 or more items selected, but always display the pure title
  const currentSelections: string[] = useMemo(() => {
    if (Array.isArray(selectedValues)) return selectedValues;
    if (Array.isArray(selectedValue)) return selectedValue;
    if (typeof selectedValue === 'string' && selectedValue.trim()) return [selectedValue.trim()];
    return [];
  }, [selectedValue, selectedValues]);

  // Keep snapshot synced whenever popover opens
  useEffect(() => {
    if (open) {
      openSelectionsSnapshotRef.current = [...currentSelections];
    }
  }, [open]);

  const baseOptions: PeopleFilterOption[] = useMemo(() => {
    return options.map((opt) =>
      typeof opt === 'string' ? { label: opt, value: opt } : opt
    );
  }, [options]);

  // Pool of known options combining provided base options and any active/custom selections
  const allKnownOptions = useMemo<PeopleFilterOption[]>(() => {
    const knownMap = new Map<string, PeopleFilterOption>();
    baseOptions.forEach((opt) => knownMap.set(opt.value.toLowerCase(), opt));
    currentSelections.forEach((val) => {
      const lower = val.toLowerCase();
      const lowerNoUnderscore = lower.replace(/_/g, ' ');
      const existing = baseOptions.find(
        (o) =>
          o.value.toLowerCase() === lower ||
          o.label.toLowerCase() === lower ||
          o.value.toLowerCase().replace(/_/g, ' ') === lowerNoUnderscore ||
          o.label.toLowerCase().replace(/_/g, ' ') === lowerNoUnderscore
      );
      if (!existing && !knownMap.has(lower)) {
        knownMap.set(lower, { label: val, value: val });
      }
    });
    return Array.from(knownMap.values());
  }, [baseOptions, currentSelections]);

  useEffect(() => {
    if (!loadOptions || !open) {
      setAsyncOptions(null);
      return;
    }

    if (!searchTerm.trim()) {
      setAsyncOptions(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoadingAsync(true);
      try {
        const res = await loadOptions(searchTerm.trim());
        const mapped = res.map((opt) =>
          typeof opt === 'string' ? { label: opt, value: opt } : opt
        );
        setAsyncOptions(mapped);
      } catch (err) {
        console.error('Error loading options:', err);
      } finally {
        setIsLoadingAsync(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, loadOptions, open]);

  const displayOptions: PeopleFilterOption[] = useMemo(() => {
    if (asyncOptions !== null) {
      const term = searchTerm.toLowerCase().trim();
      const hasExactMatch = asyncOptions.some((opt) => opt.value.toLowerCase() === term);
      if (term && !hasExactMatch) {
        return [...asyncOptions, { label: searchTerm.trim(), value: searchTerm.trim() }];
      }
      return asyncOptions;
    }

    if (customSearchFilter) {
      const results = customSearchFilter(searchTerm);
      return results.map((opt) =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
      );
    }

    if (!searchTerm.trim()) {
      // Float selected values to the top when just opened
      const snapshot =
        openSelectionsSnapshotRef.current.length > 0
          ? openSelectionsSnapshotRef.current
          : currentSelections;

      const topSelectedList: PeopleFilterOption[] = [];
      const seen = new Set<string>();

      // 1. Add snapshot selections to the top in order
      snapshot.forEach((val) => {
        const lower = val.toLowerCase();
        const lowerNoUnderscore = lower.replace(/_/g, ' ');
        const found = allKnownOptions.find(
          (o) =>
            o.value.toLowerCase() === lower ||
            o.label.toLowerCase() === lower ||
            o.value.toLowerCase().replace(/_/g, ' ') === lowerNoUnderscore ||
            o.label.toLowerCase().replace(/_/g, ' ') === lowerNoUnderscore
        );
        const resolvedOpt = found || { label: val, value: val };
        const key = resolvedOpt.value.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          topSelectedList.push(resolvedOpt);
        }
      });

      // 2. Also ensure any other newly selected values are included
      currentSelections.forEach((val) => {
        const lower = val.toLowerCase();
        const lowerNoUnderscore = lower.replace(/_/g, ' ');
        const found = allKnownOptions.find(
          (o) =>
            o.value.toLowerCase() === lower ||
            o.label.toLowerCase() === lower ||
            o.value.toLowerCase().replace(/_/g, ' ') === lowerNoUnderscore ||
            o.label.toLowerCase().replace(/_/g, ' ') === lowerNoUnderscore
        );
        const resolvedOpt = found || { label: val, value: val };
        const key = resolvedOpt.value.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          topSelectedList.push(resolvedOpt);
        }
      });

      // 3. Append remaining unselected base options
      const remainingList: PeopleFilterOption[] = [];
      allKnownOptions.forEach((opt) => {
        const key = opt.value.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          remainingList.push(opt);
        }
      });

      return [...topSelectedList, ...remainingList];
    }

    const term = searchTerm.toLowerCase().trim();
    const matched = allKnownOptions.filter((opt) =>
      opt.label.toLowerCase().includes(term)
    );

    if (term && !matched.some((opt) => opt.value.toLowerCase() === term)) {
      return [...matched, { label: searchTerm.trim(), value: searchTerm.trim() }];
    }

    return matched;
  }, [asyncOptions, customSearchFilter, searchTerm, allKnownOptions, currentSelections]);

  const isActive = currentSelections.length > 0;

  const handleSelect = (val: string) => {
    if (onToggle) {
      onToggle(val);
      return;
    }
    if (onSelect) {
      if (currentSelections.includes(val)) {
        onSelect(undefined);
      } else {
        onSelect(val);
        setOpen(false);
      }
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          openSelectionsSnapshotRef.current = [...currentSelections];
        } else {
          setSearchTerm('');
          setAsyncOptions(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 px-[12px] py-[6px] h-[36px] ${buttonWidthClass} box-border shrink-0 rounded-full transition-all font-dm-sans cursor-pointer select-none ${
            isActive
              ? 'bg-ds-bg border border-ds-accent text-ds-text-primary'
              : 'bg-transparent border border-ds-border text-ds-text-primary hover:border-ds-text-muted'
          }`}
        >
          <SearchPillChevron open={open} className="text-ds-text-primary" />
          <span className="text-[16px] font-medium leading-[24px] text-ds-text-primary whitespace-nowrap">
            {title}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className={`${widthClass} p-4 bg-ds-bg border border-ds-border rounded-[10px] shadow-2xl flex flex-col gap-3 z-[130] focus:outline-none focus:ring-0`}
      >
        {/* Top Underline Search Input (rendered only when hasSearch is true) */}
        {hasSearch && (
          <div className="w-full flex items-center gap-2 border-b border-ds-border pb-1.5 px-0">
            <Search className="size-3.5 text-ds-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-dm-sans text-ds-text-primary placeholder:text-ds-text-muted"
              autoFocus
            />
            {isLoadingAsync ? (
              <Loader2 className="size-3.5 text-ds-accent animate-spin shrink-0" />
            ) : searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-ds-text-secondary hover:text-ds-text-primary text-xs p-0.5 cursor-pointer bg-transparent border-none"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        )}

        {/* Options List with scrollbar hidden */}
        <div className="flex flex-col items-start gap-3.5 max-h-60 overflow-y-auto no-scrollbar py-1 w-full">
          {displayOptions.length === 0 ? (
            <div className="py-2 text-center text-xs text-ds-text-muted font-dm-sans w-full">
              No matching results
            </div>
          ) : (
            displayOptions.map((opt) => {
              const isSelected = currentSelections.some((sel) => {
                const sLower = sel.toLowerCase();
                const vLower = opt.value.toLowerCase();
                const lLower = opt.label.toLowerCase();
                return (
                  sLower === vLower ||
                  sLower === lLower ||
                  sLower.replace(/_/g, ' ') === vLower ||
                  sLower.replace(/_/g, ' ') === lLower
                );
              });
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left font-dm-sans text-sm leading-normal font-normal transition-colors cursor-pointer select-none whitespace-nowrap outline-none bg-transparent hover:bg-transparent border-none p-0 ${
                    isSelected
                      ? 'text-ds-accent font-normal'
                      : 'text-ds-text-secondary hover:text-ds-text-primary'
                  }`}
                >
                  <span className="truncate block py-0.5">{opt.label}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
