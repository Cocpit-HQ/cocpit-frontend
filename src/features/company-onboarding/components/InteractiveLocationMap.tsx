"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Plus, Minus, Navigation, Loader2 } from "lucide-react";
import { reverseGeocode, StructuredLocation } from "@/services/api/location";
import { env } from "@/config/env";

declare global {
  interface Window {
    google?: any;
  }
}

interface InteractiveLocationMapProps {
  locationAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange?: (location: StructuredLocation) => void;
  className?: string;
  readOnly?: boolean;
}

// Google Maps script loader singleton
let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("google-maps-js-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => {
      googleMapsPromise = null;
      reject(err);
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

// Subtle dark-mode styling for Google Maps matching Cocpit design system tokens
const DARK_MAP_STYLES: any[] = [
  { elementType: "geometry", stylers: [{ color: "#17171d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#17171d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a89f9a" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d9d0cb" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a837e" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1e2220" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b8070" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#282830" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f1f26" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9c948e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#363642" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#22222b" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#24242d" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d1117" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4f5866" }],
  },
];

export const InteractiveLocationMap: React.FC<InteractiveLocationMapProps> = ({
  locationAddress,
  latitude,
  longitude,
  onLocationChange,
  className = "",
  readOnly = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(locationAddress || "");
  const [mapError, setMapError] = useState<string | null>(null);

  // Sync external address changes
  useEffect(() => {
    if (locationAddress && locationAddress !== currentAddress) {
      setCurrentAddress(locationAddress);
    }
  }, [locationAddress]);

  // Center coordinates fallback (Kolhapur default if none supplied, matching current view)
  const effectiveLat = latitude ?? 16.705;
  const effectiveLng = longitude ?? 74.2433;

  // Initialize Map
  useEffect(() => {
    let isCancelled = false;
    const apiKey = env.GOOGLE_MAPS_API_KEY || "AIzaSyB1ZeC3mQJDW3jSgGJHw12B4fnj9CHVDHQ";

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (isCancelled || !mapContainerRef.current) return;

        const initialCenter = {
          lat: effectiveLat,
          lng: effectiveLng,
        };

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 15,
          disableDefaultUI: true, // Completely removes external Google Maps popups & links
          scrollwheel: false, // Disables mouse wheel scroll zoom on map
          gestureHandling: readOnly ? "none" : "greedy", // Instant 1-finger / mouse drag without "use two fingers" prompt
          draggable: !readOnly,
          styles: DARK_MAP_STYLES,
          clickableIcons: false, // Prevents clicking POIs from opening Google info cards
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;
        lastCoordsRef.current = initialCenter;
        setIsMapLoaded(true);

        if (!readOnly) {
          // Map drag and movement event listeners for Zomato / Swiggy experience
          map.addListener("dragstart", () => {
            isDraggingRef.current = true;
            setIsDragging(true);
          });
        }

        const handlePositionSettle = () => {
          if (!mapInstanceRef.current) return;
          const center = mapInstanceRef.current.getCenter();
          if (!center) return;

          const lat = center.lat();
          const lng = center.lng();

          // Check if coordinates moved significantly (> 10 meters)
          const prev = lastCoordsRef.current;
          if (
            prev &&
            Math.abs(prev.lat - lat) < 0.0001 &&
            Math.abs(prev.lng - lng) < 0.0001
          ) {
            return;
          }

          lastCoordsRef.current = { lat, lng };

          // Debounce reverse geocoding request
          if (geocodeTimeoutRef.current) {
            clearTimeout(geocodeTimeoutRef.current);
          }

          geocodeTimeoutRef.current = setTimeout(async () => {
            setIsResolvingAddress(true);
            try {
              let result: StructuredLocation | null = null;
              try {
                result = await reverseGeocode(lat, lng, true);
              } catch (geoErr: any) {
                // If backend does not support the country or endpoint fails, fallback to client-side Google Geocoder
                if (geoErr?.message !== "UNSUPPORTED_COUNTRY") {
                  console.warn("Reverse geocode service warning:", geoErr);
                }
              }

              if (!result && window.google?.maps?.Geocoder) {
                const geocoder = new window.google.maps.Geocoder();
                const geoRes = await new Promise<any>((resolve) => {
                  geocoder.geocode({ location: { lat, lng } }, (res: any, status: any) => {
                    if (status === "OK" && res?.[0]) resolve(res[0]);
                    else resolve(null);
                  });
                });
                if (geoRes) {
                  let city = "";
                  let state = "";
                  let country = "";
                  geoRes.address_components?.forEach((c: any) => {
                    if (c.types.includes("locality")) city = c.long_name;
                    if (!city && (c.types.includes("administrative_area_level_2") || c.types.includes("sublocality"))) city = c.long_name;
                    if (c.types.includes("administrative_area_level_1")) state = c.long_name;
                    if (c.types.includes("country")) country = c.long_name;
                  });
                  result = {
                    placeId: geoRes.place_id,
                    country,
                    state,
                    city: city || state || country,
                    formattedAddress: [city, state, country].filter(Boolean).join(", ") || geoRes.formatted_address,
                    latitude: lat,
                    longitude: lng,
                  };
                }
              }

              if (result) {
                const addr =
                  [result.city, result.state, result.country].filter(Boolean).join(", ") ||
                  result.formattedAddress ||
                  [result.street, result.sublocality || result.village, result.city, result.state, result.country]
                    .filter(Boolean)
                    .join(", ");
                setCurrentAddress(addr);
                if (onLocationChange) {
                  onLocationChange({
                    ...result,
                    formattedAddress: addr,
                    latitude: lat,
                    longitude: lng,
                  });
                }
              }
            } catch (err) {
              console.warn("Location resolution warning:", err);
            } finally {
              setIsResolvingAddress(false);
            }
          }, 400);
        };

        if (!readOnly) {
          map.addListener("dragend", () => {
            isDraggingRef.current = false;
            setIsDragging(false);
            handlePositionSettle();
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load Google Maps script:", err);
        if (!isCancelled) {
          setMapError("Unable to load map. You can still search for location above.");
        }
      });

    return () => {
      isCancelled = true;
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, []);

  // Intercept mouse wheel events on the map frame:
  // Completely prevent Google Maps from capturing wheel scroll or moving the map,
  // and smoothly scroll the page instead.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      const scrollParent = container.closest("main") || document.documentElement;
      scrollParent.scrollBy({
        top: e.deltaY,
        left: e.deltaX,
        behavior: "auto",
      });
    };

    container.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, []);

  // Pan to coordinates when props change externally (e.g. from Autocomplete search selection)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;
    if (latitude != null && longitude != null) {
      const prev = lastCoordsRef.current;
      if (
        !prev ||
        Math.abs(prev.lat - latitude) > 0.0002 ||
        Math.abs(prev.lng - longitude) > 0.0002
      ) {
        lastCoordsRef.current = { lat: latitude, lng: longitude };
        mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
        mapInstanceRef.current.setZoom(16);
      }
    } else if (locationAddress && window.google?.maps?.Geocoder) {
      // If address is provided without lat/lng, geocode on client to center map
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: locationAddress }, (results: any, status: any) => {
        if (status === "OK" && results?.[0]?.geometry?.location && mapInstanceRef.current) {
          const loc = results[0].geometry.location;
          mapInstanceRef.current.panTo(loc);
          mapInstanceRef.current.setZoom(16);
        }
      });
    }
  }, [latitude, longitude, locationAddress, isMapLoaded]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) {
      const z = mapInstanceRef.current.getZoom() || 15;
      mapInstanceRef.current.setZoom(z + 1);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) {
      const z = mapInstanceRef.current.getZoom() || 15;
      mapInstanceRef.current.setZoom(z - 1);
    }
  }, []);

  // Locate current position
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setIsResolvingAddress(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(17);
        }
      },
      (err) => {
        console.warn("Geolocation denied/failed:", err);
        setIsResolvingAddress(false);
      },
      { timeout: 8000 }
    );
  }, []);

  return (
    <div
      className={`relative w-full h-56 md:h-64 rounded-3xl border border-ds-border overflow-hidden bg-ds-surface-1 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] select-none ${className}`}
    >
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full outline-none ${
          readOnly ? "cursor-default pointer-events-none" : "cursor-grab active:cursor-grabbing"
        }`}
        tabIndex={-1}
      />

      {/* Loading Skeleton if Map is still initializing */}
      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 bg-ds-surface-1 flex flex-col items-center justify-center gap-3 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
          <span className="font-['DM_Sans'] text-xs text-ds-text-muted">
            Loading interactive map...
          </span>
        </div>
      )}

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 bg-ds-surface-1 flex flex-col items-center justify-center p-4 text-center z-10">
          <MapPin className="w-6 h-6 text-ds-accent mb-2" />
          <span className="font-['DM_Sans'] text-xs text-ds-text-secondary max-w-xs">
            {mapError}
          </span>
        </div>
      )}

      {/* ─── Fixed Center Pin Pointer (Zomato / Swiggy Style) ─────────────── */}
      {isMapLoaded && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="relative flex flex-col items-center justify-center">
            {/* The Pointer Pin */}
            <div
              className={`transform transition-all duration-200 ease-out origin-bottom ${
                isDragging
                  ? "-translate-y-4 scale-110"
                  : "translate-y-0 scale-100"
              }`}
            >
              <div className="relative flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                {/* Custom Crisp SVG Marker Pin */}
                <svg
                  width="36"
                  height="44"
                  viewBox="0 0 36 44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 0C8.05887 0 0 8.05887 0 18C0 31.5 18 44 18 44C18 44 36 31.5 36 18C36 8.05887 27.9411 0 18 0Z"
                    fill="var(--ds-accent)"
                  />
                  <circle cx="18" cy="18" r="7" fill="var(--ds-bg)" />
                  <circle cx="18" cy="18" r="4" fill="var(--ds-text-primary)" />
                </svg>
              </div>
            </div>

            {/* Ground Shadow & Pulse Dot beneath Pin tip */}
            <div
              className={`w-3.5 h-1.5 bg-black/60 rounded-full blur-[1px] transition-all duration-200 mt-0.5 ${
                isDragging
                  ? "scale-50 opacity-30"
                  : "scale-100 opacity-90"
              }`}
            />
          </div>
        </div>
      )}

      {/* Top Floating Helper Badge (only in edit/interactive mode) */}
      {!readOnly && isMapLoaded && (
        <div className="absolute top-3 left-3 px-3 py-1 bg-ds-surface-1/90 backdrop-blur-md rounded-full border border-ds-border flex items-center gap-1.5 shadow-md pointer-events-none z-10 animate-in fade-in duration-200">
          <span className="font-['DM_Sans'] text-[11px] font-medium text-ds-text-primary tracking-wide">
            {isDragging
              ? "Moving location..."
              : isResolvingAddress
              ? "Updating address..."
              : "Drag map to adjust exact spot"}
          </span>
          {isResolvingAddress && (
            <Loader2 className="w-3 h-3 animate-spin text-ds-accent" />
          )}
        </div>
      )}

      {/* Floating Bottom Location Address Badge (only in edit/interactive mode) */}
      {!readOnly && isMapLoaded && currentAddress && (
        <div className="absolute bottom-3 left-3 right-16 px-3 py-1.5 bg-ds-surface-1/90 backdrop-blur-md rounded-2xl border border-ds-border flex items-center gap-2 shadow-lg pointer-events-none z-10 max-w-[calc(100%-80px)]">
          <MapPin className="w-3.5 h-3.5 text-ds-accent shrink-0" />
          <span className="font-['DM_Sans'] text-xs text-ds-text-primary truncate">
            {currentAddress}
          </span>
        </div>
      )}

      {/* Controls Overlay (Zoom In, Zoom Out, Locate Me) - only in edit/interactive mode */}
      {!readOnly && isMapLoaded && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={handleLocateMe}
            aria-label="Locate my position"
            title="Locate my position"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-ds-surface-1/90 hover:bg-ds-surface-2 active:scale-95 backdrop-blur-md border border-ds-border text-ds-text-primary flex items-center justify-center transition-all cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            <Navigation className="w-4 h-4 text-ds-accent" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-ds-surface-1/90 hover:bg-ds-surface-2 active:scale-95 backdrop-blur-md border border-ds-border text-ds-text-primary flex items-center justify-center transition-all cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-ds-surface-1/90 hover:bg-ds-surface-2 active:scale-95 backdrop-blur-md border border-ds-border text-ds-text-primary flex items-center justify-center transition-all cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default InteractiveLocationMap;
