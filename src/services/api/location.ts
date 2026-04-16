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
