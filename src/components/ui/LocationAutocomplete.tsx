"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, X, ChevronDown } from "lucide-react";
import { searchLocations, LocationSuggestion } from "@/services/api/location";
import { useDebounce } from "@/hooks/use-debounce";
import styles from "./LocationAutocomplete.module.css";

interface LocationAutocompleteProps {
  onSelect: (location: any) => void;
  value: string | null;
}

export default function LocationAutocomplete({ onSelect, value }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
        const results = await searchLocations(debouncedQuery);
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

  const handleSelect = (loc: LocationSuggestion) => {
    onSelect(loc);
    setQuery(loc.name);
    setSuggestions([]);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (value) onSelect(""); // Clear selection when user starts re-typing
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
        className={styles.inputWrapper}
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
          {suggestions.map((loc) => (
            <li key={loc.id} className={styles.item} onMouseDown={() => handleSelect(loc)}>
              <MapPin className={styles.itemIcon} />
              <span>{loc.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
