// Static curated list of major world cities and regions.
// Used to avoid Google Places API credits during onboarding location selection.

export interface StaticLocation {
  id: string;
  city: string;
  state: string | null;
  country: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export const STATIC_LOCATIONS: StaticLocation[] = [
  // India
  { id: "mumbai-in", city: "Mumbai", state: "Maharashtra", country: "India", formattedAddress: "Mumbai, Maharashtra, India", latitude: 19.076, longitude: 72.8777 },
  { id: "delhi-in", city: "Delhi", state: "Delhi", country: "India", formattedAddress: "New Delhi, Delhi, India", latitude: 28.6139, longitude: 77.209 },
  { id: "bangalore-in", city: "Bangalore", state: "Karnataka", country: "India", formattedAddress: "Bangalore, Karnataka, India", latitude: 12.9716, longitude: 77.5946 },
  { id: "hyderabad-in", city: "Hyderabad", state: "Telangana", country: "India", formattedAddress: "Hyderabad, Telangana, India", latitude: 17.385, longitude: 78.4867 },
  { id: "chennai-in", city: "Chennai", state: "Tamil Nadu", country: "India", formattedAddress: "Chennai, Tamil Nadu, India", latitude: 13.0827, longitude: 80.2707 },
  { id: "kolkata-in", city: "Kolkata", state: "West Bengal", country: "India", formattedAddress: "Kolkata, West Bengal, India", latitude: 22.5726, longitude: 88.3639 },
  { id: "pune-in", city: "Pune", state: "Maharashtra", country: "India", formattedAddress: "Pune, Maharashtra, India", latitude: 18.5204, longitude: 73.8567 },
  { id: "ahmedabad-in", city: "Ahmedabad", state: "Gujarat", country: "India", formattedAddress: "Ahmedabad, Gujarat, India", latitude: 23.0225, longitude: 72.5714 },
  { id: "jaipur-in", city: "Jaipur", state: "Rajasthan", country: "India", formattedAddress: "Jaipur, Rajasthan, India", latitude: 26.9124, longitude: 75.7873 },
  { id: "surat-in", city: "Surat", state: "Gujarat", country: "India", formattedAddress: "Surat, Gujarat, India", latitude: 21.1702, longitude: 72.8311 },
  { id: "lucknow-in", city: "Lucknow", state: "Uttar Pradesh", country: "India", formattedAddress: "Lucknow, Uttar Pradesh, India", latitude: 26.8467, longitude: 80.9462 },
  { id: "kanpur-in", city: "Kanpur", state: "Uttar Pradesh", country: "India", formattedAddress: "Kanpur, Uttar Pradesh, India", latitude: 26.4499, longitude: 80.3319 },
  { id: "nagpur-in", city: "Nagpur", state: "Maharashtra", country: "India", formattedAddress: "Nagpur, Maharashtra, India", latitude: 21.1458, longitude: 79.0882 },
  { id: "indore-in", city: "Indore", state: "Madhya Pradesh", country: "India", formattedAddress: "Indore, Madhya Pradesh, India", latitude: 22.7196, longitude: 75.8577 },
  { id: "thane-in", city: "Thane", state: "Maharashtra", country: "India", formattedAddress: "Thane, Maharashtra, India", latitude: 19.2183, longitude: 72.9781 },
  { id: "bhopal-in", city: "Bhopal", state: "Madhya Pradesh", country: "India", formattedAddress: "Bhopal, Madhya Pradesh, India", latitude: 23.2599, longitude: 77.4126 },
  { id: "visakhapatnam-in", city: "Visakhapatnam", state: "Andhra Pradesh", country: "India", formattedAddress: "Visakhapatnam, Andhra Pradesh, India", latitude: 17.6868, longitude: 83.2185 },
  { id: "pimpri-in", city: "Pimpri-Chinchwad", state: "Maharashtra", country: "India", formattedAddress: "Pimpri-Chinchwad, Maharashtra, India", latitude: 18.6279, longitude: 73.8009 },
  { id: "patna-in", city: "Patna", state: "Bihar", country: "India", formattedAddress: "Patna, Bihar, India", latitude: 25.5941, longitude: 85.1376 },
  { id: "vadodara-in", city: "Vadodara", state: "Gujarat", country: "India", formattedAddress: "Vadodara, Gujarat, India", latitude: 22.3072, longitude: 73.1812 },
  { id: "ghaziabad-in", city: "Ghaziabad", state: "Uttar Pradesh", country: "India", formattedAddress: "Ghaziabad, Uttar Pradesh, India", latitude: 28.6692, longitude: 77.4538 },
  { id: "ludhiana-in", city: "Ludhiana", state: "Punjab", country: "India", formattedAddress: "Ludhiana, Punjab, India", latitude: 30.9, longitude: 75.8573 },
  { id: "agra-in", city: "Agra", state: "Uttar Pradesh", country: "India", formattedAddress: "Agra, Uttar Pradesh, India", latitude: 27.1767, longitude: 78.0081 },
  { id: "kochi-in", city: "Kochi", state: "Kerala", country: "India", formattedAddress: "Kochi, Kerala, India", latitude: 9.9312, longitude: 76.2673 },
  { id: "coimbatore-in", city: "Coimbatore", state: "Tamil Nadu", country: "India", formattedAddress: "Coimbatore, Tamil Nadu, India", latitude: 11.0168, longitude: 76.9558 },
  { id: "chandigarh-in", city: "Chandigarh", state: "Chandigarh", country: "India", formattedAddress: "Chandigarh, India", latitude: 30.7333, longitude: 76.7794 },
  { id: "gurgaon-in", city: "Gurugram", state: "Haryana", country: "India", formattedAddress: "Gurugram, Haryana, India", latitude: 28.4595, longitude: 77.0266 },
  { id: "noida-in", city: "Noida", state: "Uttar Pradesh", country: "India", formattedAddress: "Noida, Uttar Pradesh, India", latitude: 28.5355, longitude: 77.391 },
  { id: "mysore-in", city: "Mysuru", state: "Karnataka", country: "India", formattedAddress: "Mysuru, Karnataka, India", latitude: 12.2958, longitude: 76.6394 },
  { id: "bhubaneswar-in", city: "Bhubaneswar", state: "Odisha", country: "India", formattedAddress: "Bhubaneswar, Odisha, India", latitude: 20.2961, longitude: 85.8245 },

  // UAE
  { id: "dubai-ae", city: "Dubai", state: "Dubai", country: "United Arab Emirates", formattedAddress: "Dubai, UAE", latitude: 25.2048, longitude: 55.2708 },
  { id: "abu-dhabi-ae", city: "Abu Dhabi", state: "Abu Dhabi", country: "United Arab Emirates", formattedAddress: "Abu Dhabi, UAE", latitude: 24.4539, longitude: 54.3773 },

  // Singapore
  { id: "singapore-sg", city: "Singapore", state: null, country: "Singapore", formattedAddress: "Singapore", latitude: 1.3521, longitude: 103.8198 },
];

// Top popular cities to show by default when dropdown opens with no query
export const POPULAR_LOCATIONS: StaticLocation[] = [
  STATIC_LOCATIONS.find(l => l.id === "mumbai-in")!,
  STATIC_LOCATIONS.find(l => l.id === "bangalore-in")!,
  STATIC_LOCATIONS.find(l => l.id === "delhi-in")!,
  STATIC_LOCATIONS.find(l => l.id === "hyderabad-in")!,
  STATIC_LOCATIONS.find(l => l.id === "pune-in")!,
  STATIC_LOCATIONS.find(l => l.id === "chennai-in")!,
  STATIC_LOCATIONS.find(l => l.id === "ahmedabad-in")!,
  STATIC_LOCATIONS.find(l => l.id === "singapore-sg")!,
  STATIC_LOCATIONS.find(l => l.id === "dubai-ae")!,
].filter(Boolean);

/**
 * Fuzzy-ish search: filter locations by city, state, or country.
 * Returns at most `limit` results.
 */
export function searchStaticLocations(query: string, limit = 8): StaticLocation[] {
  if (!query || query.trim().length === 0) return POPULAR_LOCATIONS.slice(0, limit);

  const q = query.toLowerCase().trim();

  return STATIC_LOCATIONS
    .filter(loc => {
      const haystack = `${loc.city} ${loc.state ?? ""} ${loc.country}`.toLowerCase();
      // Simple prefix + contains match
      return haystack.includes(q) || loc.city.toLowerCase().startsWith(q);
    })
    .sort((a, b) => {
      // Prioritize city name starts-with match
      const aStarts = a.city.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.city.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts;
    })
    .slice(0, limit);
}
