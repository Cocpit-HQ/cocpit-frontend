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
  const debouncedQuery = useDebounce(query, 300);
  const sessionToken = useRef(uuidv4());

  const draftLabel = useMemo(() => getLocationLabel(draftLocation), [draftLocation]);

  useEffect(() => {
    setDraftLocation(selectedLocation);
    setQuery("");
    setSuggestions([]);
  }, [selectedLocation]);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let isActive = true;
    setLoading(true);

    searchPlaces(debouncedQuery.trim(), sessionToken.current)
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

  const visibleLocations = query.trim().length === 0 ? DEFAULT_LOCATIONS : suggestions;

  const handleSelect = async (location: PlacesSuggestion) => {
    setSelectingPlaceId(location.placeId);
    
    // Check if it's a static location first
    const staticLoc = STATIC_LOCATIONS.find(loc => loc.id === location.placeId);
    if (staticLoc) {
      setDraftLocation({
        placeId: staticLoc.id,
        country: staticLoc.country,
        state: staticLoc.state,
        city: staticLoc.city,
        formattedAddress: staticLoc.formattedAddress,
        latitude: staticLoc.latitude,
        longitude: staticLoc.longitude
      });
      setQuery(getSuggestionLabel(location));
      setSelectingPlaceId(null);
      return;
    }

    const details = await getPlaceDetails(location.placeId, sessionToken.current);
    sessionToken.current = uuidv4();
    if (details) {
      setDraftLocation(details);
      setQuery(getSuggestionLabel(location));
    }
    setSelectingPlaceId(null);
  };

  const handleSave = () => {
    onLocationChange(draftLocation);
    onConfirm();
  };

  return (
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
                <span className="text-[15px] font-semibold text-foreground font-[family-name:var(--font-poppins)] truncate">
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
                  <span className="text-[15px] font-semibold text-foreground font-[family-name:var(--font-poppins)] truncate">
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
  );
}
