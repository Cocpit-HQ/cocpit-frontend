"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, X, ChevronDown, Building2 } from "lucide-react";
import { searchOrganizations, OrganizationSuggestion } from "@/services/api/organization";
import { useDebounce } from "@/hooks/use-debounce";
import styles from "./LocationAutocomplete.module.css";

interface CompanyAutocompleteProps {
  onSelect: (orgId: string | null, orgName: string, logoUrl?: string | null) => void;
  selectedId: string | null;
  selectedName: string;
  placeholder?: string;
}

export default function CompanyAutocomplete({
  onSelect,
  selectedId,
  selectedName,
  placeholder = "e.g. Google"
}: CompanyAutocompleteProps) {
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
  }, [selectedName]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    // If user has a valid selection and hasn't changed the query, don't search
    if (selectedName && query === selectedName && selectedId) {
      return;
    }

    if (debouncedQuery.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const fetchCompanies = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      try {
        const results = await searchOrganizations(debouncedQuery, "COMPANY", abortControllerRef.current.signal);
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

    fetchCompanies();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, selectedId, selectedName, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // On blur, if we have custom text, update parent
        if (query.trim() && query !== selectedName) {
          onSelect(null, query.trim());
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, selectedName, onSelect]);

  const handleSelect = (org: OrganizationSuggestion) => {
    onSelect(org.org_id, org.name, org.logo_url);
    setQuery(org.name);
    setSuggestions([]);
    setOpen(false);
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

    // Reset selected ID when user starts typing
    onSelect(null, newQuery);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (query.trim().length >= 1) {
      setOpen(true);
    }
  };

  const handleWrapperClick = () => {
    inputRef.current?.focus();
    if (query.trim().length >= 1) setOpen(true);
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div
        className={`${styles.inputWrapper} ${open ? styles.isOpen : ''} min-h-[48px]`}
        onClick={handleWrapperClick}
        style={{ cursor: "text" }}
      >
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={placeholder}
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
          {suggestions.map((org) => (
            <li key={org.org_id} className={styles.item} onMouseDown={() => handleSelect(org)}>
              <div className="w-8 h-8 rounded border border-border flex-shrink-0 flex items-center justify-center bg-muted">
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{org.name}</span>
                {org.location && <span className="text-xs text-muted-foreground truncate">{org.location}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
