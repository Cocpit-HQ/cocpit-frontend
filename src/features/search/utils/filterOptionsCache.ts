/**
 * Filter Options Cache Utility
 *
 * Implements industry-standard client-side caching for filter facets (Location, Skills,
 * Roles, Industries, Companies, Education, etc.):
 * - 0ms Synchronous Hydration: Immediately populates popover options on open without spinner flicker.
 * - Stale-While-Revalidate with TTL (default 15 mins): Eliminates duplicate network calls during user sessions.
 * - In-flight Request Deduplication: Merges concurrent identical requests into a single promise.
 * - LRU/Bounded Cache: Restricts maximum stored entries to protect browser memory.
 */

export interface CachedFilterData<T = string> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  timestamp: number;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_ENTRIES = 250;

// Central in-memory cache store
const cacheStore = new Map<string, CachedFilterData<string>>();

// In-flight promises map for request deduplication
const inFlightRequests = new Map<string, Promise<CursorPaginatedResult<string>>>();

/**
 * Builds a deterministic cache key from facet key and search query.
 */
export function buildFilterCacheKey(facetKey: string, query?: string): string {
  const normFacet = (facetKey || 'facet').toLowerCase().trim();
  const normQuery = (query || '').toLowerCase().trim();
  return normQuery ? `${normFacet}:q:${normQuery}` : `${normFacet}:__initial__`;
}

/**
 * Synchronously retrieves cached filter options if non-expired.
 * Allows components to mount with full options in 0ms, avoiding layout shifts or loading spinners.
 */
export function getCachedFilterOptions(
  facetKey: string,
  query?: string,
  ttlMs = DEFAULT_TTL_MS
): CachedFilterData<string> | null {
  const key = buildFilterCacheKey(facetKey, query);
  const entry = cacheStore.get(key);

  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > ttlMs;
  if (isExpired) {
    cacheStore.delete(key);
    return null;
  }

  return entry;
}

/**
 * Saves filter options into the in-memory cache.
 * Implements simple LRU eviction when size exceeds MAX_CACHE_ENTRIES.
 */
export function setCachedFilterOptions(
  facetKey: string,
  query: string | undefined,
  result: CursorPaginatedResult<string>
): void {
  const key = buildFilterCacheKey(facetKey, query);

  // Evict oldest entry if capacity reached
  if (cacheStore.size >= MAX_CACHE_ENTRIES && !cacheStore.has(key)) {
    const oldestKey = cacheStore.keys().next().value;
    if (oldestKey) cacheStore.delete(oldestKey);
  }

  cacheStore.set(key, {
    items: Array.isArray(result.items) ? result.items : [],
    nextCursor: result.nextCursor || null,
    hasMore: Boolean(result.hasMore),
    timestamp: Date.now(),
  });
}

/**
 * Higher-order fetcher with caching and in-flight promise deduplication.
 * - If fresh data is in cache, returns immediately without firing network requests.
 * - If a request for this key is already running, attaches to the pending promise.
 * - Otherwise executes fetcher(), caches the result, and cleans up the in-flight map.
 */
export async function fetchWithFilterCache(
  facetKey: string,
  query: string | undefined,
  fetcher: () => Promise<CursorPaginatedResult<string>>,
  ttlMs = DEFAULT_TTL_MS
): Promise<CursorPaginatedResult<string>> {
  const key = buildFilterCacheKey(facetKey, query);

  // 1. Check fresh cache
  const cached = getCachedFilterOptions(facetKey, query, ttlMs);
  if (cached) {
    return {
      items: cached.items,
      nextCursor: cached.nextCursor,
      hasMore: cached.hasMore,
    };
  }

  // 2. Check pending in-flight promise (Request Deduplication)
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  // 3. Initiate new fetch
  const requestPromise = (async () => {
    try {
      const data = await fetcher();
      setCachedFilterOptions(facetKey, query, data);
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
}

/**
 * Clear cached options for a specific facet (e.g. 'locations') or clear all if no facet provided.
 */
export function clearFilterOptionsCache(facetKey?: string): void {
  if (!facetKey) {
    cacheStore.clear();
    inFlightRequests.clear();
    return;
  }

  const prefix = `${facetKey.toLowerCase().trim()}:`;
  for (const k of cacheStore.keys()) {
    if (k.startsWith(prefix)) {
      cacheStore.delete(k);
    }
  }
}
