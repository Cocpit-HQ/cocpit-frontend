import { getSession } from "next-auth/react";

// Hybrid In-Memory Session Storage & Deduplication
let inMemorySession: any | null | undefined = undefined;
let isSessionInitialized = false;
let sessionPromise: Promise<any> | null = null;
let lastFetchTime = 0;
const SESSION_CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Synchronizes NextAuth React session state directly into memory.
 * Called by AxiosAuthSync in Providers.
 */
export function setInMemorySession(session: any) {
  inMemorySession = session;
  isSessionInitialized = true;
  lastFetchTime = Date.now();
}

/**
 * Clears cached session state upon logout or session invalidation.
 */
export function clearInMemorySession() {
  inMemorySession = null;
  isSessionInitialized = true;
  lastFetchTime = 0;
  sessionPromise = null;
}

/**
 * Retrieves session with Hybrid pattern:
 * 1. Synchronous memory state if initialized and within TTL (0ms latency, 0 network requests).
 * 2. Promise deduplication if multiple requests demand a network fetch simultaneously.
 * 3. Forced network refresh on 401 retries when forceRefresh is true.
 */
export async function getHybridSession(forceRefresh = false): Promise<any> {
  const now = Date.now();

  // 1. Return synchronous memory token immediately if initialized and fresh
  if (!forceRefresh && isSessionInitialized && (now - lastFetchTime < SESSION_CACHE_TTL)) {
    return inMemorySession;
  }

  // 2. Promise deduplication: share single in-flight network fetch across concurrent requests
  if (sessionPromise) {
    return sessionPromise;
  }

  // 3. Fallback / Refresh: execute network query and update local state upon completion
  sessionPromise = getSession()
    .then((session) => {
      inMemorySession = session || null;
      isSessionInitialized = true;
      lastFetchTime = Date.now();
      sessionPromise = null;
      return session;
    })
    .catch((error) => {
      sessionPromise = null;
      throw error;
    });

  return sessionPromise;
}
