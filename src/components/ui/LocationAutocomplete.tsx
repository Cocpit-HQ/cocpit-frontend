"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { searchLocations, LocationSuggestion } from "@/services/api/location";
import { useDebounce } from "@/hooks/use-debounce";
import styles from "./LocationAutocomplete.module.css";

interface LocationAutocompleteProps {
  onSelect: (location: LocationSuggestion | null) => void;
  selected: LocationSuggestion | null;
}

export default function LocationAutocomplete({ onSelect, selected }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(selected?.name ?? "");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (selected) return; // Don't re-search after valid selection
    if (debouncedQuery.length < 2) {
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
  }, [debouncedQuery, selected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed without selecting, revert to the last valid selection
        if (!selected) setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

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
    if (selected) onSelect(null); // Clear selection when user starts re-typing
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.inputWrapper}>
        <MapPin className={styles.prefixIcon} />
        <input
          type="text"
          className={styles.input}
          placeholder="Search city, e.g. Pune"
          value={query}
          onChange={handleInputChange}
          autoComplete="off"
        />
        <div className={styles.suffix}>
          {loading ? (
            <Loader2 className={styles.spinner} />
          ) : selected ? (
            <button type="button" onClick={handleClear} className={styles.clearBtn} title="Clear location">
              <X className={styles.clearIcon} />
            </button>
          ) : null}
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
