import api from "@/lib/axios";

export interface LocationSuggestion {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
}

export const searchLocations = async (search: string): Promise<LocationSuggestion[]> => {
  if (!search || search.length < 2) return [];
  const response = await api.get("/locations", { params: { search } });
  return response.data;
};

// ─── Google Places Proxy Endpoints ──────────────────────────────────────────

export interface PlacesSuggestion {
  placeId: string;
  displayName: string;
  description: string;
  types?: string[];
}

export interface StructuredLocation {
  placeId: string;
  country: string;
  state: string | null;
  city: string;
  formattedAddress: string;
  latitude: number | null;
  longitude: number | null;
}

export const searchPlaces = async (q: string, sessionToken: string): Promise<PlacesSuggestion[]> => {
  if (!q || q.length < 2) return [];
  const response = await api.get("/places/autocomplete", { params: { q, sessionToken } });
  return response.data.data || [];
};

export const getPlaceDetails = async (placeId: string, sessionToken: string): Promise<StructuredLocation | null> => {
  try {
    const response = await api.get("/places/details", { params: { placeId, sessionToken } });
    return response.data.data || null;
  } catch (err) {
    return null; // Gracefully fallback if details call fails
  }
};
