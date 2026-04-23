"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, X, ChevronDown, Building2, Plus } from "lucide-react";
import { searchOrganizations, OrganizationSuggestion } from "@/services/api/organization";
import { useDebounce } from "@/hooks/use-debounce";
import styles from "./LocationAutocomplete.module.css";

interface SchoolAutocompleteProps {
  onSelect: (schoolId: string | null, schoolName: string) => void;
  selectedId: string | null;
  selectedName: string;
}

export default function SchoolAutocomplete({ onSelect, selectedId, selectedName }: SchoolAutocompleteProps) {
  const [query, setQuery] = useState(selectedName || "");
  const [suggestions, setSuggestions] = useState<OrganizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external selectedName if it changes
  useEffect(() => {
    if (selectedName !== query) {
      setQuery(selectedName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedName]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    // If user has a valid selection and hasn't changed the query, don't search
    if (selectedName && query === selectedName) {
      return;
    }

    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const fetchSchools = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      try {
        const results = await searchOrganizations(debouncedQuery, "INSTITUTION", abortControllerRef.current.signal);
        setSuggestions(results);
        setOpen(true);
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, selectedName, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed a custom string but didn't click "Add custom", we treat the text input as a custom school automatically on blur
        if (query.trim() && query !== selectedName) {
           onSelect(null, query.trim());
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, selectedName, onSelect]);

  const handleSelect = (org: OrganizationSuggestion) => {
    onSelect(org.org_id, org.name);
    setQuery(org.name);
    setSuggestions([]);
    setOpen(false);
  };

  const handleCustomAdd = () => {
    const customName = query.trim();
    if (customName) {
      onSelect(null, customName);
      setQuery(customName);
      setSuggestions([]);
      setOpen(false);
    }
  };

  const handleClear = () => {
    onSelect(null, "");
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // If the user starts typing and edits an already selected recognized school, reset the selected ID
    if (selectedId) {
      onSelect(null, newQuery);
    } else {
      // just update the parent name state without an ID
      onSelect(null, newQuery);
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (query.trim().length >= 2) {
      setOpen(true);
    }
  };

  const handleWrapperClick = () => {
    inputRef.current?.focus();
    setOpen(true);
  };

  const showCustomAdd = query.trim().length >= 2 && !suggestions.find(s => s.name.toLowerCase() === query.trim().toLowerCase());

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
          placeholder="Enter your school or university"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          autoComplete="off"
        />
        <div className={styles.suffix}>
          {loading ? (
            <Loader2 className={styles.spinner} />
          ) : query ? (
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); handleClear(); }} 
              className={styles.clearBtn} 
              title="Clear"
            >
              <X className={styles.clearIcon} />
            </button>
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {open && (suggestions.length > 0 || showCustomAdd) && (
        <ul className={styles.dropdown}>
          {suggestions.map((org) => (
            <li key={org.org_id} className={styles.item} onMouseDown={() => handleSelect(org)}>
              <Building2 className={styles.itemIcon} />
              <span>{org.name}</span>
            </li>
          ))}
          {showCustomAdd && (
            <li className={styles.item} onMouseDown={handleCustomAdd} style={{ color: '#2563eb', fontWeight: 500, borderTop: suggestions.length > 0 ? '1px solid #f3f4f6' : 'none' }}>
              <Plus className={styles.itemIcon} style={{ color: '#2563eb' }} />
              <span>Add "{query.trim()}"</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
