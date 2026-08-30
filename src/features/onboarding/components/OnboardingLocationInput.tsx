"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { DownArrowIcon, LoadingIcon, CloseCrossIcon } from "@/components/icons";
import {
  StructuredLocation,
  PlacesSuggestion,
  searchPlaces,
  getPlaceDetails,
} from "@/services/api/location";
import { POPULAR_LOCATIONS, StaticLocation } from "@/data/staticLocations";
import { useDebounce } from "@/hooks/use-debounce";
import { v4 as uuidv4 } from "uuid";

interface OnboardingLocationInputProps {
  id?: string;
  value: string | null;
  onSelect: (location: StructuredLocation | null) => void;
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

function staticToStructured(loc: StaticLocation): StructuredLocation {
  return {
    placeId: loc.id,
    country: loc.country,
    state: loc.state,
    city: loc.city,
    formattedAddress: formatStaticLine(loc),
    latitude: loc.latitude,
    longitude: loc.longitude,
  };
}

const DEFAULT_ALLOWED_COUNTRIES = ["in", "ae"];

export const OnboardingLocationInput: React.FC<OnboardingLocationInputProps> = ({
  id = "onboarding-location",
  value,
  onSelect,
  allowedCountryCodes = DEFAULT_ALLOWED_COUNTRIES,
  disabled = false,
}) => {
  const [query, setQuery] = useState(value ?? "");
  const [mode, setMode] = useState<"idle" | "searching">("idle");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<PlacesSuggestion[]>([]);

  const [staticSuggestions] = useState<StaticLocation[]>(() => {
    if (!allowedCountryCodes) return POPULAR_LOCATIONS;
    const codeMap: Record<string, string> = {
      India: "in",
      "United Arab Emirates": "ae",
      Singapore: "sg",
      Japan: "jp",
    };
    return POPULAR_LOCATIONS.filter((l) =>
      allowedCountryCodes.includes(codeMap[l.country] || "")
    );
  });

  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionToken = useRef<string>(uuidv4());

  const resetSession = () => {
    sessionToken.current = uuidv4();
  };

  // Sync external value
  useEffect(() => {
    if (value !== query) setQuery(value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Query Google Places Autocomplete API when debouncedQuery changes
  useEffect(() => {
    if (mode !== "searching") {
      setLoading(false);
      return;
    }
    if (value && debouncedQuery === value) {
      setLoading(false);
      return;
    }
    if (debouncedQuery.trim().length < 2) {
      setApiSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const results = await searchPlaces(
          debouncedQuery.trim(),
          sessionToken.current,
          allowedCountryCodes,
          false
        );
        if (!cancelled) setApiSuggestions(results);
      } catch (err) {
        if (!cancelled) {
          setApiSuggestions([]);
          setMode("idle");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLocations();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, mode, value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!value) setQuery("");
        else setQuery(value);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, value]);

  const displaySuggestions: DisplaySuggestion[] =
    mode === "idle"
      ? staticSuggestions.map((d) => ({
          kind: "static",
          data: d,
          lineText: formatStaticLine(d),
        }))
      : apiSuggestions.map((d) => ({
          kind: "api",
          data: d,
          lineText: d.description || d.displayName,
        }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length === 0) {
      setMode("idle");
      setApiSuggestions([]);
    } else {
      setMode("searching");
    }
    setOpen(true);
  };

  const handleSelectStatic = (loc: StaticLocation) => {
    const structured = staticToStructured(loc);
    onSelect(structured);
    setQuery(structured.formattedAddress);
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
        if (details) {
          onSelect(details);
          setQuery(details.formattedAddress);
        } else {
          const fallbackText = suggestion.description || suggestion.displayName;
          onSelect({
            placeId: suggestion.placeId,
            formattedAddress: fallbackText,
            country: "",
            state: null,
            city: suggestion.displayName,
            latitude: null,
            longitude: null,
          });
          setQuery(fallbackText);
        }
      } catch {
        onSelect(null);
      } finally {
        setLoading(false);
        setApiSuggestions([]);
      }
    },
    [onSelect]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setQuery("");
    setApiSuggestions([]);
    setMode("idle");
    setOpen(false);
  };

  const handleWrapperClick = () => {
    if (disabled) return;
    inputRef.current?.focus();
    setOpen(true);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (open) {
      setOpen(false);
    } else {
      setMode("idle");
      setOpen(true);
      inputRef.current?.focus();
    }
  };

  const showNoResults =
    open &&
    mode === "searching" &&
    !loading &&
    debouncedQuery.trim().length >= 2 &&
    apiSuggestions.length === 0;

  return (
    <div className="relative w-64 select-none" ref={wrapperRef} id={id}>
      {/* Figma Trigger: w-64 py-2 border-b border-zinc-800 inline-flex justify-between items-center */}
      <div
        onClick={handleWrapperClick}
        className={`w-64 py-2 border-b border-zinc-800 inline-flex justify-between items-center bg-transparent cursor-pointer transition-colors ${
          open ? "border-[#EC6229]" : "border-[#2C2C33] hover:border-[#726B67]"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Location"
          disabled={disabled}
          autoComplete="off"
          className="w-[210px] bg-transparent border-none outline-none font-sans text-sm font-normal leading-normal text-[#FFECE6] placeholder-stone-500 truncate"
        />

        {/* Right Icon Actions */}
        <div className="size-4 p-0.5 inline-flex flex-col justify-center items-center gap-2.5 overflow-hidden shrink-0">
          {loading ? (
            <LoadingIcon className="w-3.5 h-3.5 animate-spin-smooth text-[#B8ADA8]" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="w-3.5 h-3.5 flex items-center justify-center text-stone-500 hover:text-[#FFECE6] transition-colors"
              aria-label="Clear location"
            >
              <CloseCrossIcon size={12} className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleChevronClick}
              className={`w-4 h-4 flex items-center justify-center text-[#FFECE6] transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
              aria-label="Toggle location options"
            >
              <DownArrowIcon size={16} className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Figma Dropdown Open Menu with generous height & padding */}
      {open && (
        <div className="absolute left-0 top-[44px] z-50 w-64 py-2 bg-black flex flex-col justify-start gap-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-full max-h-[250px] overflow-y-auto flex flex-col gap-2.5 custom-scrollbar pr-1">
            {displaySuggestions.length > 0 ? (
              displaySuggestions.map((item) => {
                const isSelected = value === item.lineText;
                return (
                  <button
                    key={item.kind === "static" ? item.data.id : item.data.placeId}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (item.kind === "static") {
                        handleSelectStatic(item.data);
                      } else {
                        handleSelectApi(item.data);
                      }
                    }}
                    className={`self-stretch text-left font-sans text-sm font-normal leading-normal py-1.5 min-h-[30px] flex items-center transition-colors cursor-pointer truncate ${
                      isSelected
                        ? "text-[#EC6229] font-medium"
                        : "text-[#B8ADA8] hover:text-[#FFECE6]"
                    }`}
                  >
                    <span className="truncate">{item.lineText}</span>
                  </button>
                );
              })
            ) : showNoResults ? (
              <div className="py-3 text-center text-stone-500 text-xs font-sans">
                No locations found for &quot;{query}&quot;
              </div>
            ) : loading ? (
              <div className="py-3 text-center text-stone-500 text-xs font-sans flex items-center justify-center gap-2">
                <LoadingIcon className="w-3.5 h-3.5 animate-spin-smooth" />
                <span>Searching locations...</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingLocationInput;
