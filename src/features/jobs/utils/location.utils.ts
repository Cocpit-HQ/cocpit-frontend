/**
 * Location formatting utilities for Cocpit Job cards.
 * Formats addresses cleanly into "City, State, Nation" format on the UI side,
 * stripping street names, building numbers, and postal codes.
 */

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

  // Checks if a part is a street address, building, or unit
  const isStreetPart = (p: string): boolean =>
    /^\d+/.test(p) ||
    /^(suite|ste|apt|flat|unit|floor|fl|room|rm|no\.)\b/i.test(p) ||
    /\b(street|st|road|rd|avenue|ave|blvd|boulevard|lane|ln|drive|dr|way|circle|cir|court|ct|highway|hwy|expressway)\b/i.test(p);

  // Checks if a part is purely a postal code (e.g. "10310", "NW1 6XE")
  const isPostalOnly = (p: string): boolean =>
    /^\d{3,10}$/.test(p) || /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(p);

  // Filter out street addresses and standalone postal codes
  let cleanParts = rawParts.filter((p) => !isStreetPart(p) && !isPostalOnly(p));

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

