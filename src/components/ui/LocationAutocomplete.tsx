"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X, ChevronDown, Loader2 } from "lucide-react";
import {
  StructuredLocation,
  LocationSuggestion,
  PlacesSuggestion,
  searchPlaces,
  getPlaceDetails,
} from "@/services/api/location";
import { POPULAR_LOCATIONS, StaticLocation } from "@/data/staticLocations";
import { useDebounce } from "@/hooks/use-debounce";
import { v4 as uuidv4 } from "uuid";
import styles from "./LocationAutocomplete.module.css";

interface LocationAutocompleteProps {
  onSelect: (location: LocationSuggestion | StructuredLocation | string | null) => void;
  value: string | null;
  mode?: "legacy" | "places";
  allowedCountryCodes?: string[];
}

type DisplaySuggestion =
  | { kind: "static"; data: StaticLocation }
  | { kind: "api"; data: PlacesSuggestion };

function staticToStructured(loc: StaticLocation): StructuredLocation {
  return {
    placeId: loc.id,
    country: loc.country,
    state: loc.state,
    city: loc.city,
    formattedAddress: loc.formattedAddress,
    latitude: loc.latitude,
    longitude: loc.longitude,
  };
}

export default function LocationAutocomplete({ onSelect, value, allowedCountryCodes }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value ?? "");
  // "idle" = showing popular static cities; "searching" = user typed, use API
  const [mode, setMode] = useState<"idle" | "searching">("idle");
  const [staticSuggestions] = useState<StaticLocation[]>(() => {
    if (!allowedCountryCodes) return POPULAR_LOCATIONS;
    const codeMap: Record<string, string> = { "India": "in", "United Arab Emirates": "ae", "Singapore": "sg", "Japan": "jp" };
    return POPULAR_LOCATIONS.filter(l => allowedCountryCodes.includes(codeMap[l.country]));
  });
  const [apiSuggestions, setApiSuggestions] = useState<PlacesSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 350);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionToken = useRef<string>(uuidv4());

  const resetSession = () => { sessionToken.current = uuidv4(); };

  // Sync external value
  useEffect(() => {
    if (value !== query) setQuery(value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // When debounced query changes AND user is actively searching → call API
  useEffect(() => {
    if (mode !== "searching") {
      setLoading(false);
      return;
    }
    // If query matches current selection, don't re-search
    if (value && debouncedQuery === value) {
      setLoading(false);
      return;
    }
    if (debouncedQuery.length < 2) {
      setApiSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const results = await searchPlaces(debouncedQuery, sessionToken.current, allowedCountryCodes);
        if (!cancelled) setApiSuggestions(results);
      } catch {
        if (!cancelled) {
          setApiSuggestions([]);
          // Fall back to static mode if the API fails entirely
          setMode("idle");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [debouncedQuery, mode, value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!value) setQuery("");
        else setQuery(value);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value]);

  // Build the display list
  const displaySuggestions: DisplaySuggestion[] =
    mode === "idle"
      ? staticSuggestions.map((d) => ({ kind: "static", data: d }))
      : apiSuggestions.map((d) => ({ kind: "api", data: d }));

  const isShowingPopular = mode === "idle";

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSelect(val);
    if (val.trim().length === 0) {
      // User cleared the input → go back to popular cities mode
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
    setQuery(loc.formattedAddress);
    setApiSuggestions([]);
    setOpen(false);
  };

  const handleSelectApi = useCallback(async (suggestion: PlacesSuggestion) => {
    setLoading(true);
    setOpen(false);
    try {
      const details = await getPlaceDetails(suggestion.placeId, sessionToken.current);
      resetSession();
      if (details) {
        onSelect(details);
        setQuery(details.formattedAddress);
      } else {
        onSelect(null);
      }
    } catch {
      onSelect(null);
    } finally {
      setLoading(false);
      setApiSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelect]);

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setApiSuggestions([]);
    setMode("idle");
    setOpen(false);
  };

  const handleFocus = () => setOpen(true);

  const handleWrapperClick = () => {
    inputRef.current?.focus();
    setOpen(true);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
    } else {
      setMode("idle"); // always show popular when toggling via chevron
      setOpen(true);
      inputRef.current?.focus();
    }
  };

  // Show "no results" only when actively searching via API and not loading
  const showNoResults =
    open && mode === "searching" && !loading && debouncedQuery.length >= 2 && apiSuggestions.length === 0;

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div
        className={`${styles.inputWrapper} ${open ? styles.isOpen : ""}`}
        onClick={handleWrapperClick}
        style={{ cursor: "pointer" }}
      >
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Enter your location"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          autoComplete="off"
        />
        <div className={styles.suffix}>
          {loading ? (
            <Loader2 className={styles.spinner} />
          ) : value ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className={styles.clearBtn}
              title="Clear location"
            >
              <X className={styles.clearIcon} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleChevronClick}
              className={styles.chevronBtn}
              title="Show location suggestions"
              aria-label="Open location dropdown"
            >
              <ChevronDown
                className={`${styles.chevronIcon} ${open ? styles.chevronOpen : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown suggestions */}
      {open && displaySuggestions.length > 0 && (
        <ul className={styles.dropdown}>
          {isShowingPopular && (
            <li className={styles.sectionHeader}>Popular cities</li>
          )}
          {displaySuggestions.map((item) => {
            if (item.kind === "static") {
              const loc = item.data;
              return (
                <li
                  key={loc.id}
                  className={styles.item}
                  onMouseDown={() => handleSelectStatic(loc)}
                >
                  <MapPin className={styles.itemIcon} />
                  <div className={styles.itemText}>
                    <span className={styles.itemCity}>{loc.city}</span>
                    <span className={styles.itemCountry}>
                      {loc.state ? `${loc.state}, ` : ""}{loc.country}
                    </span>
                  </div>
                </li>
              );
            } else {
              const sug = item.data;
              return (
                <li
                  key={sug.placeId}
                  className={styles.item}
                  onMouseDown={() => handleSelectApi(sug)}
                >
                  <MapPin className={styles.itemIcon} />
                  <div className={styles.itemText}>
                    <span className={styles.itemCity}>{sug.displayName}</span>
                    <span className={styles.itemCountry}>{sug.description}</span>
                  </div>
                </li>
              );
            }
          })}
        </ul>
      )}

      {/* Searching but no API results yet (skeleton feel) */}
      {open && mode === "searching" && loading && (
        <ul className={styles.dropdown}>
          {[1, 2, 3].map((i) => (
            <li key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonText}>
                <div className={styles.skeletonLine} style={{ width: `${50 + i * 15}%` }} />
                <div className={styles.skeletonLine} style={{ width: `${30 + i * 10}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {showNoResults && (
        <div className={styles.noResults}>
          <span>No locations found for &quot;{query}&quot;</span>
          <span className={styles.noResultsHint}>Try a different city or region</span>
        </div>
      )}
    </div>
  );
}
