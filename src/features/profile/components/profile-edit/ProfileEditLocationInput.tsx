"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDownIcon, LoadingIcon } from "@/components/icons";
import {
  PlacesSuggestion,
  searchPlaces,
  getPlaceDetails,
} from "@/services/api/location";
import { POPULAR_LOCATIONS, StaticLocation, searchStaticLocations } from "@/data/staticLocations";
import { useDebounce } from "@/hooks/use-debounce";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

interface ProfileEditLocationInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  allowedCountryCodes?: string[];
  disabled?: boolean;
}

type DisplaySuggestion =
  | { kind: "static"; data: StaticLocation; lineText: string }
  | { kind: "api"; data: PlacesSuggestion; lineText: string };

function formatStaticLine(loc: StaticLocation): string {
  if (loc.state && loc.state.toLowerCase() !== loc.city.toLowerCase()) {
    return `${loc.city}, ${loc.state}, ${loc.country}`;
  }
  return `${loc.city}, ${loc.country}`;
}

const DEFAULT_ALLOWED_COUNTRIES = ["in", "ae"];

export const ProfileEditLocationInput: React.FC<ProfileEditLocationInputProps> = ({
  value,
  onChange,
  className,
  allowedCountryCodes = DEFAULT_ALLOWED_COUNTRIES,
  disabled = false,
}) => {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<PlacesSuggestion[]>([]);
  const [staticMatches, setStaticMatches] = useState<StaticLocation[]>(POPULAR_LOCATIONS);

  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionToken = useRef<string>(uuidv4());
  const lastSelectedRef = useRef<string>(value ?? "");

  const resetSession = () => {
    sessionToken.current = uuidv4();
  };

  // Sync external value
  useEffect(() => {
    if (value !== query) {
      setQuery(value ?? "");
      lastSelectedRef.current = value ?? "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // When debounced query changes, filter static locations and search Google Places API
  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    // If query matches what was just selected from dropdown, don't re-search
    if (trimmed && trimmed === lastSelectedRef.current) {
      setLoading(false);
      return;
    }

    if (trimmed.length < 2) {
      setStaticMatches(POPULAR_LOCATIONS);
      setApiSuggestions([]);
      setLoading(false);
      return;
    }

    // 1. Instant local search from static list
    const filteredStatic = searchStaticLocations(trimmed, 8);
    setStaticMatches(filteredStatic);

    // 2. Google Places API search
    let cancelled = false;
    const fetchApiPlaces = async () => {
      setLoading(true);
      try {
        const results = await searchPlaces(
          trimmed,
          sessionToken.current,
          allowedCountryCodes,
          false
        );
        if (!cancelled) {
          setApiSuggestions(results || []);
        }
      } catch {
        if (!cancelled) {
          setApiSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchApiPlaces();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, allowedCountryCodes]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Build unified suggestions list
  const displaySuggestions: DisplaySuggestion[] = React.useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return POPULAR_LOCATIONS.map((d) => ({
        kind: "static",
        data: d,
        lineText: formatStaticLine(d),
      }));
    }

    // If we have API suggestions, prioritize them
    if (apiSuggestions.length > 0) {
      return apiSuggestions.map((d) => ({
        kind: "api",
        data: d,
        lineText: d.description || d.displayName,
      }));
    }

    // Fall back to filtered static list
    return staticMatches.map((d) => ({
      kind: "static",
      data: d,
      lineText: formatStaticLine(d),
    }));
  }, [query, apiSuggestions, staticMatches]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setOpen(true);
  };

  const handleSelectStatic = (loc: StaticLocation) => {
    const formatted = formatStaticLine(loc);
    lastSelectedRef.current = formatted;
    setQuery(formatted);
    onChange(formatted);
    setApiSuggestions([]);
    setOpen(false);
  };

  const handleSelectApi = useCallback(
    async (suggestion: PlacesSuggestion) => {
      setLoading(true);
      setOpen(false);
      try {
        const details = await getPlaceDetails(
          suggestion.placeId,
          sessionToken.current,
          false
        );
        resetSession();
        const formatted =
          details?.formattedAddress ||
          suggestion.description ||
          suggestion.displayName;
        lastSelectedRef.current = formatted;
        setQuery(formatted);
        onChange(formatted);
      } catch {
        const fallbackText =
          suggestion.description || suggestion.displayName;
        lastSelectedRef.current = fallbackText;
        setQuery(fallbackText);
        onChange(fallbackText);
      } finally {
        setLoading(false);
        setApiSuggestions([]);
      }
    },
    [onChange]
  );

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "w-full max-w-full h-[62px] py-[8px] px-0 border-b transition-colors flex flex-col justify-center items-start gap-[10px] relative box-border",
        open
          ? "border-[var(--ds-accent)]"
          : "border-[var(--ds-border)] hover:border-[var(--ds-text-muted)] focus-within:border-[var(--ds-accent)]",
        className
      )}
    >
      <label className="w-[49px] h-4 text-center font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-[var(--ds-text-secondary)] flex-none order-0 grow-0">
        Location
      </label>

      {/* Input row */}
      <div className="w-full flex items-center justify-between h-5 flex-none order-1 grow-0">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Select"
          disabled={disabled}
          autoComplete="off"
          className="w-full bg-transparent text-[var(--ds-text-primary)] font-['DM_Sans'] font-normal text-[14px] leading-[20px] placeholder:text-[var(--ds-text-muted)] focus:outline-none truncate cursor-text"
        />

        <div
          onClick={() => {
            setOpen((prev) => !prev);
            if (!open) {
              inputRef.current?.focus();
            }
          }}
          className="cursor-pointer shrink-0 ml-1 text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] transition-colors"
        >
          {loading ? (
            <LoadingIcon className="w-3.5 h-3.5 animate-spin-smooth text-[var(--ds-text-secondary)]" />
          ) : (
            <div
              className={cn(
                "w-4 h-4 flex items-center justify-center transition-transform duration-200",
                open && "rotate-180"
              )}
            >
              <ChevronDownIcon size={16} className="w-full h-full text-[var(--ds-text-primary)]" />
            </div>
          )}
        </div>
      </div>

      {/* Autocomplete Suggestions Popover */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-xl py-2 px-2 shadow-2xl z-40 max-h-[260px] overflow-y-auto scrollbar-hide animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full max-h-[240px] overflow-y-auto flex flex-col gap-2.5 scrollbar-hide pr-1" role="listbox">
            {query.trim().length < 2 && (
              <div className="px-2 py-1 text-[11px] font-medium text-[var(--ds-text-muted)] uppercase tracking-wider">
                Popular cities
              </div>
            )}
            {displaySuggestions.length > 0 ? (
              displaySuggestions.map((item, index) => {
                const isSelected = query === item.lineText;
                return (
                  <button
                    key={`${index}-${item.lineText}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (item.kind === "static") {
                        handleSelectStatic(item.data);
                      } else {
                        handleSelectApi(item.data);
                      }
                    }}
                    className={cn(
                      "self-stretch text-left font-['DM_Sans'] text-sm font-normal leading-normal py-1.5 px-2 rounded-md min-h-[30px] flex items-center transition-colors cursor-pointer truncate focus:outline-none bg-transparent",
                      isSelected
                        ? "text-[var(--ds-accent)] font-medium"
                        : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                    )}
                  >
                    <span className="truncate">{item.lineText}</span>
                  </button>
                );
              })
            ) : (
              <div className="py-3 text-center text-[var(--ds-text-muted)] text-xs font-['DM_Sans']">
                {loading ? "Searching locations..." : "No locations found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditLocationInput;
