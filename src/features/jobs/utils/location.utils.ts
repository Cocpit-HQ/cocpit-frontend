/**
 * Location formatting utilities for Cocpit Job cards.
 * Formats addresses cleanly into "City, State, Nation" format on the UI side,
 * stripping street names, building numbers, and postal codes.
 */

// Checks if a part is a street address, building, or sublocality/layout/sector
export const isStreetOrSublocalityPart = (p: string): boolean => {
  const trimmed = p.trim();
  // Plus code (e.g. GVHF+GQF or 7JVW+32)
  if (/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}/i.test(trimmed)) return true;
  // Starting with door / building number
  if (/^\d+/.test(trimmed)) return true;
  // Suite, flat, unit, room, floor
  if (/^(suite|ste|apt|flat|unit|floor|fl|room|rm|no\.)\b/i.test(trimmed)) return true;
  // Street, road, layout, sector, nagar, colony, enclave, etc.
  if (/\b(sector\s*\d+|block\s*[a-z0-9]+|street|st\b|road|rd\b|avenue|ave\b|blvd|boulevard|lane|ln\b|drive|dr\b|way|circle|cir|court|ct|highway|hwy|expressway|layout|nagar|colony|enclave|marg|vaddo|waddo|phase\s*\d+)\b/i.test(trimmed)) return true;
  return false;
};

// Checks if a part is purely a postal code (e.g. "10310", "NW1 6XE", "560102")
export const isPostalOnly = (p: string): boolean =>
  /^\d{3,10}$/.test(p.trim()) || /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(p.trim());

/**
 * Formats a location string into "City, State, Nation" format.
 * Examples:
 * - "14 Thiam Ruam Mit Rd, Khwaeng Huai Khwang, Khet Huai Khwang, Krung Thep Maha Nakhon 10310, Thailand"
 *   -> "Huai Khwang, Krung Thep Maha Nakhon, Thailand"
 * - "Kolhapur, Maharashtra, India" -> "Kolhapur, Maharashtra, India"
 * - "123 Main St, Suite 400, Austin, TX 78701, United States" -> "Austin, TX, United States"
 * - "London, NW1 6XE, United Kingdom" -> "London, United Kingdom"
 * - "Bangalore, Karnataka" -> "Bangalore, Karnataka"
 * - "Tokyo, Japan" -> "Tokyo, Japan"
 * - "Remote" -> "Remote"
 */
export const formatJobLocation = (loc?: string | null): string => {
  if (!loc) return '';
  if (!loc.includes(',')) return loc.trim();

  const rawParts = loc.split(',').map((p) => p.trim()).filter(Boolean);
  if (rawParts.length <= 1) return rawParts[0] || '';

  // Filter out street addresses and standalone postal codes
  let cleanParts = rawParts.filter((p) => !isStreetOrSublocalityPart(p) && !isPostalOnly(p));

  // If filtering removed everything, fallback to raw parts
  if (cleanParts.length === 0) cleanParts = rawParts;

  // Clean embedded postal codes (e.g. "Krung Thep Maha Nakhon 10310" -> "Krung Thep Maha Nakhon", "TX 78701" -> "TX")
  cleanParts = cleanParts
    .map((p) => p.replace(/\b\d{4,}\b/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  // If more than 3 parts remain, keep the last 3 parts (City, State, Nation)
  if (cleanParts.length > 3) {
    cleanParts = cleanParts.slice(-3);
  }

  // Remove administrative prefix terms like "Khwaeng", "Khet" if present
  cleanParts = cleanParts.map((p) => p.replace(/^(Khwaeng|Khet)\s+/i, '').trim());

  // Deduplicate adjacent identical parts
  const deduped: string[] = [];
  for (const part of cleanParts) {
    if (deduped.length === 0 || deduped[deduped.length - 1].toLowerCase() !== part.toLowerCase()) {
      deduped.push(part);
    }
  }

  return deduped.join(', ');
};

/**
 * Extracts only the City name from a full location string.
 * Examples:
 * - "235, 9th Main Rd, Sector 6, HSR Layout, Bengaluru, Karnataka 560102, India" -> "Bengaluru"
 * - "GVHF+GQF, Agarkar Nagar, Pune, Maharashtra 411001, India" -> "Pune"
 * - "Civil Enclave, Pune International Airport Area, Lohgaon, Pune, Maharashtra 411032, India" -> "Pune"
 * - "5/38, Maddo Waddo, MADDO VADDO, Calangute, Goa 403516, India" -> "Calangute"
 * - "Kolkata, West Bengal, India" -> "Kolkata"
 */
export const extractJobCity = (loc?: string | null): string => {
  if (!loc) return '';
  if (!loc.includes(',')) return loc.trim();

  const rawParts = loc.split(',').map((p) => p.trim()).filter(Boolean);
  if (rawParts.length <= 1) return rawParts[0] || '';

  // Filter out street/sublocality parts and standalone postal codes
  let cleanParts = rawParts.filter((p) => !isStreetOrSublocalityPart(p) && !isPostalOnly(p));
  if (cleanParts.length === 0) cleanParts = rawParts;

  // Clean embedded postal codes
  cleanParts = cleanParts
    .map((p) => p.replace(/\b\d{4,}\b/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  // If more than 3 parts remain, keep the last 3 (City, State, Country)
  if (cleanParts.length > 3) {
    cleanParts = cleanParts.slice(-3);
  }

  // Deduplicate adjacent parts
  const deduped: string[] = [];
  for (const part of cleanParts) {
    if (deduped.length === 0 || deduped[deduped.length - 1].toLowerCase() !== part.toLowerCase()) {
      deduped.push(part);
    }
  }

  return deduped[0] || rawParts[0];
};

/**
 * Determines whether a location string fits within the 300px card width without truncation.
 */
export const doesLocationFit = (loc?: string | null, workMode?: string | null): boolean => {
  if (!loc) return true;
  const maxChars = workMode ? 22 : 32;
  return loc.trim().length <= maxChars;
};

/**
 * Formats a location specifically for fixed-width cards (e.g. 300px RecommendedJobCard):
 * - If the selected location fits in the card, displays it as-is.
 * - If the location is too long, displays only the City name.
 */
export const formatCardLocation = (loc?: string | null, workMode?: string | null): string => {
  if (!loc) return '';
  if (doesLocationFit(loc, workMode)) {
    return loc.trim();
  }
  return extractJobCity(loc);
};
