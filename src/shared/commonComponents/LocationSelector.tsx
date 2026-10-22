"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { Icon } from "@iconify/react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getPlaceDetails,
  LocationSuggestion,
  PlacesSuggestion,
  searchPlaces,
  StructuredLocation,
} from "@/services/api/location";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { POPULAR_LOCATIONS, STATIC_LOCATIONS } from "@/data/staticLocations";

interface LocationSelectorProps {
  selectedLocation: LocationSuggestion | StructuredLocation | null;
  onLocationChange: (location: LocationSuggestion | StructuredLocation | null) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const getLocationLabel = (location: LocationSuggestion | StructuredLocation | null) => {
  if (!location) return "";
  return "formattedAddress" in location ? location.formattedAddress : location.name;
};

const getSuggestionLabel = (location: PlacesSuggestion) => (
  location.description || location.displayName
);

const DEFAULT_LOCATIONS: PlacesSuggestion[] = POPULAR_LOCATIONS.map((loc) => ({
  placeId: loc.id,
  displayName: loc.city,
  description: loc.formattedAddress
}));

export function LocationSelector({
  selectedLocation,
  onLocationChange,
  onCancel,
  onConfirm,
}: LocationSelectorProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlacesSuggestion[]>([]);
  const [draftLocation, setDraftLocation] = useState<LocationSuggestion | StructuredLocation | null>(selectedLocation);
  const [loading, setLoading] = useState(false);
  const [selectingPlaceId, setSelectingPlaceId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const sessionToken = useRef(uuidv4());
  const listRef = useRef<HTMLDivElement>(null);

  const draftLabel = useMemo(() => getLocationLabel(draftLocation), [draftLocation]);

  useEffect(() => {
    setDraftLocation(selectedLocation);
    setQuery("");
    setSuggestions([]);
    setHighlightedIndex(-1);
  }, [selectedLocation]);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let isActive = true;
    setLoading(true);

    searchPlaces(debouncedQuery.trim(), sessionToken.current, undefined, true)
      .then((results) => {
        if (isActive) setSuggestions(results);
      })
      .catch(() => {
        if (isActive) setSuggestions([]);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query, suggestions, draftLocation]);

  // FIX: Manual keyboard scrolling calculation
  // Replaced scrollIntoView() because it forces background ancestors to jump to the center.
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const listEl = listRef.current;
      const highlightedEl = listEl.children[highlightedIndex] as HTMLElement;
      if (highlightedEl) {
        const itemTop = highlightedEl.offsetTop;
        const itemBottom = itemTop + highlightedEl.offsetHeight;
        const listScrollTop = listEl.scrollTop;
        const listHeight = listEl.clientHeight;

        if (itemTop < listScrollTop) {
          listEl.scrollTop = itemTop;
        } else if (itemBottom > listScrollTop + listHeight) {
          listEl.scrollTop = itemBottom - listHeight;
        }
      }
    }
  }, [highlightedIndex]);

  // Lock background scroll when the popup is open
  useEffect(() => {
    const getScrollParent = (node: HTMLElement | null): HTMLElement => {
      if (!node) return document.documentElement;
      if (node === document.body || node === document.documentElement) {
        return document.documentElement;
      }
      const style = window.getComputedStyle(node);
      const overflowY = style.overflowY;
      const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
      if (isScrollable && node.scrollHeight > node.clientHeight) {
        return node;
      }
      return getScrollParent(node.parentElement);
    };

    let scrollContainer: HTMLElement | null = null;
    let originalOverflow = '';
    let originalPaddingRight = '';

    const lockTimer = setTimeout(() => {
      if (listRef.current) {
        // FIX: Start searching from parentElement to avoid locking the list itself
        scrollContainer = getScrollParent(listRef.current.parentElement);
        const targetToLock = scrollContainer === document.documentElement ? document.body : scrollContainer;
        
        originalOverflow = targetToLock.style.overflow;
        originalPaddingRight = targetToLock.style.paddingRight;
        
        // FIX: Calculate scrollbar width and add padding to prevent layout shifts when overflow becomes hidden
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        
        targetToLock.style.overflow = 'hidden';
        if (scrollbarWidth > 0 && (targetToLock === document.body || targetToLock === document.documentElement)) {
          targetToLock.style.paddingRight = `${scrollbarWidth}px`;
        }
      }
    }, 0);

    // FIX: Intercept wheel and touch events on the overlay so they don't scroll the background feed
    const preventTouch = (e: TouchEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventTouch, { passive: false });
    
    const preventWheel = (e: WheelEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('wheel', preventWheel, { passive: false });

    return () => {
      clearTimeout(lockTimer);
      if (scrollContainer) {
        const targetToLock = scrollContainer === document.documentElement ? document.body : scrollContainer;
        targetToLock.style.overflow = originalOverflow;
        targetToLock.style.paddingRight = originalPaddingRight;
      }
      document.removeEventListener('touchmove', preventTouch);
      document.removeEventListener('wheel', preventWheel);
    };
  }, []);

  //Convert selectedLocation into a PlacesSuggestion object for list sorting
  const selectedSuggestion = useMemo<PlacesSuggestion | null>(() => {
    if (!draftLocation) return null;
    const label = getLocationLabel(draftLocation);
    if (!label) return null;
    const placeId =
      "placeId" in draftLocation && draftLocation.placeId
        ? draftLocation.placeId
        : "id" in draftLocation && draftLocation.id
        ? String(draftLocation.id)
        : label;

    return {
      placeId,
      displayName: label,
      description: label,
    };
  }, [draftLocation]);

  // Bug Fix (SCRUM-385): Ensure previously selected location (whether from static defaults or search) is displayed first in the location list
  const visibleLocations = useMemo(() => {
    const rawList = query.trim().length === 0 ? DEFAULT_LOCATIONS : suggestions;

    if (!selectedSuggestion) return rawList;

    const selectedLabel = getSuggestionLabel(selectedSuggestion).toLowerCase();

    // Check if the selected location is already present in rawList
    const existingIndex = rawList.findIndex(
      (loc) =>
        (selectedSuggestion.placeId && loc.placeId === selectedSuggestion.placeId) ||
        getSuggestionLabel(loc).toLowerCase() === selectedLabel
    );

    if (existingIndex !== -1) {
      // Move existing selected location to top of the list
      const item = rawList[existingIndex];
      const remaining = rawList.filter((_, idx) => idx !== existingIndex);
      return [item, ...remaining];
    } else if (query.trim().length === 0) {
      // If no search query and selected location was added via search (not in DEFAULT_LOCATIONS), display it first
      return [selectedSuggestion, ...rawList];
    } else if (selectedLabel.includes(query.trim().toLowerCase())) {
      // If searching and selected location matches search query, display it first
      return [selectedSuggestion, ...rawList];
    }

    return rawList;
  }, [query, suggestions, selectedSuggestion]);

  const handleSelect = async (location: PlacesSuggestion) => {
    const label = getSuggestionLabel(location);
    const isSelected = draftLabel === label || (
      draftLocation && "placeId" in draftLocation && draftLocation.placeId === location.placeId
    );

    if (isSelected) {
      setDraftLocation(null);
      onLocationChange(null);
      onConfirm();
      return;
    }

    setSelectingPlaceId(location.placeId);

    // Check if it's a static location first
    const staticLoc = STATIC_LOCATIONS.find(loc => loc.id === location.placeId);
    if (staticLoc) {
      const locDetails = {
        placeId: staticLoc.id,
        country: staticLoc.country,
        state: staticLoc.state,
        city: staticLoc.city,
        formattedAddress: staticLoc.formattedAddress,
        latitude: staticLoc.latitude,
        longitude: staticLoc.longitude
      };
      setDraftLocation(locDetails);
      setSelectingPlaceId(null);
      onLocationChange(locDetails);
      onConfirm();
      return;
    }

    const details = await getPlaceDetails(location.placeId, sessionToken.current, true);
    sessionToken.current = uuidv4();
    if (details) {
      setDraftLocation(details);
      onLocationChange(details);
      onConfirm();
    }
    setSelectingPlaceId(null);
  };

  const hasDraftItem = Boolean(draftLabel && query.trim().length > 0 && !visibleLocations.some((location) => getSuggestionLabel(location) === draftLabel));
  const totalItems = (hasDraftItem ? 1 : 0) + visibleLocations.length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // FIX: Stop Tab and Arrow keys from bubbling up to prevent the parent Dialog's focus trap from hijacking it
      e.stopPropagation();
      setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      if (e.shiftKey) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      } else {
        setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (highlightedIndex >= 0 && highlightedIndex < totalItems) {
        if (hasDraftItem && highlightedIndex === 0) {
          setDraftLocation(null);
          onLocationChange(null);
          onConfirm();
        } else {
          const listIndex = hasDraftItem ? highlightedIndex - 1 : highlightedIndex;
          handleSelect(visibleLocations[listIndex]);
        }
      }
    }
  };

  return (
    <>
      {/* ===== OLD UI (commented out per request) ===== 
      <div className="relative w-[400px] max-w-[calc(100vw-32px)] h-[568px] max-h-[calc(100vh-32px)] bg-card text-foreground rounded-[24px] p-4 flex flex-col items-center shadow-xl font-poppins overflow-hidden border border-border">
        <DialogHeader className="sr-only">
          <DialogTitle>Add Location</DialogTitle>
          <DialogDescription>Search and select a location for your post.</DialogDescription>
        </DialogHeader>

        <div className="w-full h-6 flex justify-end items-center shrink-0 mb-2.5">
          <button
            onClick={onCancel}
            className="w-6 h-6 flex items-center justify-center text-[#FF6B6B] rounded-full hover:bg-[#FF6B6B]/10 transition-colors"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="w-full h-[512px] flex flex-col items-center gap-4 py-2 rounded-[24px] drop-shadow-[0_0_4px_rgba(99,102,241,0.05)] min-h-0">
          <div className="relative w-full h-10 shrink-0">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              autoFocus
              className="w-full h-10 rounded-[24px] border border-border bg-card px-4 pr-12 text-[16px] font-medium leading-6 text-foreground placeholder:text-muted-foreground outline-none focus:border-[#6366F1]"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.8} />
              ) : (
                <Search className="w-6 h-6" strokeWidth={1.6} />
              )}
            </div>
          </div>

          <div className="w-full h-96 overflow-y-auto space-y-2 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {draftLabel && query.trim().length > 0 && !visibleLocations.some((location) => getSuggestionLabel(location) === draftLabel) && (
              <button
                type="button"
                onClick={() => setDraftLocation(null)}
                className="w-full h-12 flex items-center justify-between gap-4 text-left p-3 rounded-xl hover:bg-secondary transition-colors group"
              >
                <span className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon icon="hugeicons:location-05" className="w-5 h-5 text-[#6366F1] flex-shrink-0" />
                  <span className="text-[16px] font-normal text-foreground leading-[24px] font-[family-name:var(--font-poppins)] truncate">
                    {draftLabel}
                  </span>
                </span>
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-md bg-[#6366F1] flex items-center justify-center transition-colors">
                    <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </button>
            )}

            {visibleLocations.map((location) => {
              const label = getSuggestionLabel(location);
              const isSelected = draftLabel === label || (
                draftLocation && "placeId" in draftLocation && draftLocation.placeId === location.placeId
              );
              const isSelecting = selectingPlaceId === location.placeId;

              return (
                <button
                  key={`${location.placeId}-${label}`}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left hover:bg-secondary transition-colors group"
                >
                  <span className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon icon="hugeicons:location-05" className="w-5 h-5 text-[#6366F1] flex-shrink-0" />
                    <span className="text-[16px] font-normal text-foreground leading-[24px] font-[family-name:var(--font-poppins)] truncate">
                      {label}
                    </span>
                  </span>
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {isSelecting ? (
                      <Loader2 className="w-[18px] h-[18px] animate-spin text-[#6366F1]" />
                    ) : isSelected ? (
                      <div className="w-6 h-6 rounded-md bg-[#6366F1] flex items-center justify-center transition-colors">
                        <Icon icon="ph:check-bold" className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="w-[300px] h-10 flex gap-4 justify-center items-start shrink-0">
            <button
              onClick={onCancel}
              className="w-[142px] h-10 rounded-[24px] border border-[#818CF8] bg-transparent text-[#818CF8] text-sm font-normal leading-5 hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="w-[142px] h-10 rounded-[24px] bg-[#6366F1] border border-white text-white text-sm font-normal leading-5 hover:bg-[#6366F1]/90 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      ===== END OLD UI ===== */}

      {/* New UI aligned with Figma & AGENTS.md */}
      <div className="relative w-[400px] max-w-[calc(100vw-32px)] bg-[var(--ds-bg)] text-ds-text-primary rounded-[16px] p-3 flex flex-col items-center gap-3 font-sans overflow-hidden border border-ds-border shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Add Location</DialogTitle>
          <DialogDescription>Search and select a location for your post.</DialogDescription>
        </DialogHeader>

        {/* Header - Close Button */}
        <div className="flex justify-end items-center w-full h-5 shrink-0 gap-2.5">
          <button
            onClick={onCancel}
            className="w-5 h-5 flex items-center justify-center text-ds-text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded"
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Location Title */}
        <div className="flex items-center justify-center w-full h-6 shrink-0">
          <h2 className="ds-text-body-1 text-ds-text-primary">Location</h2>
        </div>

        {/* Search Input Container */}
        <div className="w-full h-9 flex items-center justify-between py-2 gap-2 border-b border-ds-border shrink-0">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search"
            autoFocus
            className="w-full bg-transparent ds-text-secondary text-ds-text-primary placeholder:text-ds-text-muted outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-ms-clear]:hidden"
          />
          <div className="shrink-0 flex items-center justify-center w-4 h-4 text-ds-text-muted">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Search className="w-4 h-4" strokeWidth={1.5} />
            )}
          </div>
        </div>

        {/* List */}
        <div 
          ref={listRef}
          className="w-full h-[252px] flex flex-col items-start gap-2 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {hasDraftItem && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                setDraftLocation(null);
                onLocationChange(null);
                onConfirm();
              }}
              className="w-full h-9 flex items-center justify-between group text-left outline-none shrink-0"
            >
              <span className={`ds-text-secondary truncate pr-4 ${(highlightedIndex === -1 || highlightedIndex === 0) ? 'text-[var(--ds-accent)]' : 'text-ds-text-primary'}`}>
                {draftLabel}
              </span>
            </button>
          )}

          {visibleLocations.map((location, index) => {
            const label = getSuggestionLabel(location);
            const isSelected = draftLabel === label || (
              draftLocation && "placeId" in draftLocation && draftLocation.placeId === location.placeId
            );
            const isSelecting = selectingPlaceId === location.placeId;
            const itemIndex = hasDraftItem ? index + 1 : index;
            const isHighlighted = highlightedIndex === itemIndex;
            const showOrange = highlightedIndex === -1 ? isSelected : isHighlighted;

            return (
              <button
                key={`${location.placeId}-${label}`}
                type="button"
                tabIndex={-1}
                onClick={() => handleSelect(location)}
                className="w-full h-9 flex items-center justify-between group text-left outline-none shrink-0"
              >
                <span className={`ds-text-secondary truncate pr-4 ${showOrange ? 'text-[var(--ds-accent)]' : 'text-ds-text-primary'}`}>
                  {label}
                </span>
                {isSelecting && (
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <Loader2 className="w-[18px] h-[18px] animate-spin text-[var(--ds-accent)]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </>
  );
}
