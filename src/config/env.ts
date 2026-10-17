/**
 * Environment Variables Configuration
 * Ensures all required env vars are loaded and validated
 */

const isServer = typeof window === "undefined";

// Local main API (cocpit-backend src/server.js). Keep in sync with next.config.ts.
export const DEFAULT_INTERNAL_API_URL = "http://localhost:5000/api";

export const env = {
  // API
  API_URL: isServer 
    ? (process.env.INTERNAL_API_URL || DEFAULT_INTERNAL_API_URL) 
    : (process.env.NEXT_PUBLIC_API_URL || "/api"),
  API_KEY: process.env.NEXT_PUBLIC_API_KEY,
  
  // Auth
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  
  // External services
  UPLOAD_SERVICE_URL: process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL,
  // No hardcoded fallback — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (restricted by HTTP referrer).
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY,
  
  // Development
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.DEBUG === "true",

} as const;

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const required = ["API_URL"];
  const missing = required.filter((key) => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
  }
}
