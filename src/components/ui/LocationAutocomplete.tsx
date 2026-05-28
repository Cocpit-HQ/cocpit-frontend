"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, X, ChevronDown } from "lucide-react";
import { searchLocations, LocationSuggestion, searchPlaces, PlacesSuggestion, getPlaceDetails, StructuredLocation } from "@/services/api/location";
import { useDebounce } from "@/hooks/use-debounce";
import { v4 as uuidv4 } from "uuid";
import styles from "./LocationAutocomplete.module.css";

interface LocationAutocompleteProps {
  onSelect: (location: LocationSuggestion | StructuredLocation | null) => void;
  value: string | null;
  mode?: "legacy" | "places";
}

export default function LocationAutocomplete({ onSelect, value, mode = "places" }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<(LocationSuggestion | PlacesSuggestion)[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionToken = useRef<string>(uuidv4());

  const resetSession = () => {
    sessionToken.current = uuidv4();
  };

  // Sync external value if it changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value ?? "");
    }
  }, [value]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (value && query === value) return; // Don't re-search if query matches value
    if (debouncedQuery.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        let results;
        if (mode === "legacy") {
          results = await searchLocations(debouncedQuery);
        } else {
          results = await searchPlaces(debouncedQuery, sessionToken.current);
        }
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [debouncedQuery, value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed without selecting, revert to the last valid selection
        if (!value) setQuery("");
        else setQuery(value);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleSelect = async (loc: LocationSuggestion | PlacesSuggestion) => {
    if (mode === "legacy") {
      onSelect(loc as LocationSuggestion);
      setQuery((loc as LocationSuggestion).name);
      setSuggestions([]);
      setOpen(false);
    } else {
      setLoading(true);
      const details = await getPlaceDetails((loc as PlacesSuggestion).placeId, sessionToken.current);
      resetSession();
      if (details) {
        onSelect(details);
        setQuery(details.formattedAddress);
      } else {
        onSelect(null);
      }
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
    }
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (value) onSelect(null); // Clear selection when user starts re-typing
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setOpen(true);
    }
  };

  const handleWrapperClick = () => {
    inputRef.current?.focus();
    setOpen(true);
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div
        className={`${styles.inputWrapper} ${open ? styles.isOpen : ''}`}
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
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <ul className={styles.dropdown}>
          {suggestions.map((loc: any) => (
            <li key={loc.id || loc.placeId} className={styles.item} onMouseDown={() => handleSelect(loc)}>
              <MapPin className={styles.itemIcon} />
              <span>{loc.name || loc.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
