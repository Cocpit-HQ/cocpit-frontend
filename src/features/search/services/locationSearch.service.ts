import api from '@/lib/axios';
import { searchPlaces } from '@/services/api/location';
import { searchStaticLocations, STATIC_LOCATIONS } from '@/data/staticLocations';
import { formatJobLocation } from '@/features/jobs/utils/location.utils';

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Master curated locations spanning top Indian, UAE, and Global tech & business hubs
export const ALL_CURATED_LOCATIONS: string[] = [
  // India Top Metros & Tech Hubs
  'Bengaluru, Karnataka, India',
  'Mumbai, Maharashtra, India',
  'Delhi, India',
  'New Delhi, Delhi, India',
  'Hyderabad, Telangana, India',
  'Pune, Maharashtra, India',
  'Chennai, Tamil Nadu, India',
  'Noida, Uttar Pradesh, India',
  'Gurugram, Haryana, India',
  'Kolkata, West Bengal, India',
  'Ahmedabad, Gujarat, India',
  'Jaipur, Rajasthan, India',
  'Chandigarh, India',
  'Kochi, Kerala, India',
  'Indore, Madhya Pradesh, India',
  'Lucknow, Uttar Pradesh, India',
  'Coimbatore, Tamil Nadu, India',
  'Nagpur, Maharashtra, India',
  'Surat, Gujarat, India',
  'Vadodara, Gujarat, India',
  'Visakhapatnam, Andhra Pradesh, India',
  'Bhubaneswar, Odisha, India',
  'Mysuru, Karnataka, India',
  'Nashik, Maharashtra, India',
  'Bhopal, Madhya Pradesh, India',
  'Patna, Bihar, India',
  'Thiruvananthapuram, Kerala, India',
  'Mangalore, Karnataka, India',
  'Goa, India',
  'Ludhiana, Punjab, India',
  'Agra, Uttar Pradesh, India',
  'Ghaziabad, Uttar Pradesh, India',
  'Pimpri-Chinchwad, Maharashtra, India',
  'Thane, Maharashtra, India',

  // UAE & Middle East
  'Dubai, United Arab Emirates',
  'Abu Dhabi, United Arab Emirates',
  'Sharjah, United Arab Emirates',
  'Doha, Qatar',
  'Riyadh, Saudi Arabia',

  // Global Hubs
  'Singapore',
  'London, United Kingdom',
  'New York, NY, USA',
  'San Francisco, CA, USA',
  'Seattle, WA, USA',
  'Austin, TX, USA',
  'Toronto, ON, Canada',
  'Berlin, Germany',
  'Amsterdam, Netherlands',
  'Dublin, Ireland',
  'Tokyo, Japan',
  'Sydney, Australia',
];

const normKey = (s: string) => s.toLowerCase().replace(/_/g, ' ').trim();

/**
 * Paginated location provider with infinite scrolling support.
 * - Browsing (query is empty): Cursor-paginated batches through backend DB locations & curated hubs.
 * - Searching (query is non-empty): Live Google Places autocomplete + local static location matching.
 */
export async function getPaginatedLocations(
  query?: string,
  cursor?: string,
  limit: number = 15,
  sessionToken?: string
): Promise<CursorPaginatedResult<string>> {
  const trimmed = (query || '').trim();

  // ─── SEARCH MODE ───────────────────────────────────────────────────────────
  if (trimmed.length > 0) {
    const combinedResults: string[] = [];
    const seen = new Set<string>();

    const addUnique = (loc: string) => {
      const cleanLoc = formatJobLocation(loc);
      if (!cleanLoc) return;
      const key = normKey(cleanLoc);
      if (key && !seen.has(key)) {
        seen.add(key);
        combinedResults.push(cleanLoc);
      }
    };

    // 1. Google Places autocomplete search (restricted to cities/regions)
    if (trimmed.length >= 2 && sessionToken) {
      try {
        const places = await searchPlaces(trimmed, sessionToken, ['in', 'ae'], true, '(cities)');
        if (places && places.length > 0) {
          places.forEach((p: any) => {
            const desc = p.description || p.displayName;
            if (desc) addUnique(desc);
          });
        }
      } catch (err) {
        // Fallback silently to static matching
      }
    }

    // 2. Curated master list matching
    const qLower = trimmed.toLowerCase();
    ALL_CURATED_LOCATIONS.filter((loc) => loc.toLowerCase().includes(qLower)).forEach(addUnique);

    // 3. Static locations dataset matching
    const staticResults = searchStaticLocations(trimmed, 10);
    staticResults.forEach((r) => {
      if (r.formattedAddress) addUnique(r.formattedAddress);
    });

    // 4. Backend database matching (jobs, orgs, users)
    try {
      const res = await api.get('/jobs/locations', { params: { q: trimmed, limit } });
      if (res.data && Array.isArray(res.data.items)) {
        res.data.items.forEach(addUnique);
      }
    } catch {
      // Ignore backend error in search mode
    }

    // If query has no matches at all, allow the user to select their typed search as custom location
    if (combinedResults.length === 0 && trimmed.length >= 2) {
      const cleanTyped = formatJobLocation(trimmed) || trimmed;
      combinedResults.push(cleanTyped);
    }

    return {
      items: combinedResults,
      nextCursor: null,
      hasMore: false,
    };
  }

  // ─── BROWSING MODE (Cursor-paginated infinite scroll) ──────────────────────
  let dbItems: string[] = [];
  let dbNextCursor: string | null = null;
  let dbHasMore = false;

  try {
    const res = await api.get('/jobs/locations', {
      params: { limit, cursor: cursor || undefined },
    });
    if (res.data && Array.isArray(res.data.items)) {
      dbItems = res.data.items;
      dbNextCursor = res.data.nextCursor || null;
      dbHasMore = Boolean(res.data.hasMore);
    }
  } catch {
    // If backend endpoint is unavailable or fails, fallback to curated list pagination
  }

  // If backend provided database items, clean to City, State, Country and deduplicate
  const pageIndex = cursor ? parseInt(cursor, 10) : 0;
  const isNumericCursor = !isNaN(pageIndex) && String(pageIndex) === cursor;

  if (dbItems.length > 0 && !isNumericCursor) {
    const cleanedItems: string[] = [];
    const seen = new Set<string>();
    for (const item of dbItems) {
      const clean = formatJobLocation(item);
      if (!clean) continue;
      const key = normKey(clean);
      if (!seen.has(key)) {
        seen.add(key);
        cleanedItems.push(clean);
      }
    }

    return {
      items: cleanedItems,
      nextCursor: dbNextCursor,
      hasMore: dbHasMore,
    };
  }

  // Fallback / standard paginator over ALL_CURATED_LOCATIONS
  const currentOffset = isNumericCursor ? pageIndex : 0;
  const rawSlice = ALL_CURATED_LOCATIONS.slice(currentOffset, currentOffset + limit);
  const pageSlice = rawSlice.map((loc) => formatJobLocation(loc) || loc);
  const nextOffset = currentOffset + limit;
  const hasMore = nextOffset < ALL_CURATED_LOCATIONS.length;

  return {
    items: pageSlice,
    nextCursor: hasMore ? String(nextOffset) : null,
    hasMore,
  };
}

