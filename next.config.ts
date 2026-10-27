import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const EXPRESS_AUTH_ROUTES = [
  "login",
  "register",
  "logout",
  "me",
  "refresh",
  "actor-context",
  "sessions",
  "request-otp",
  "verify-otp",
  "forgot-password",
  "forgot-password-link",
  "reset-password",
  "reset-link-status",
  "verify-reset-token",
  "reset-password-token",
  "google",
  "apple",
  "admin",
  "validate-password",
];

function normalizeBackendUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  let trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (!trimmed.endsWith("/api")) {
    trimmed = `${trimmed}/api`;
  }
  return trimmed;
}

const DEFAULT_INTERNAL_API_URL = normalizeBackendUrl(
  process.env.INTERNAL_API_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000/api"
);

function resolveBackendUrl(): string {
  const candidate =
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";

  const normalized = normalizeBackendUrl(candidate);
  if (normalized) return normalized;

  // Fail the deploy build instead of silently proxying production traffic to localhost.
  // RAILWAY_ENVIRONMENT_NAME is set by Railway during builds; REQUIRE_INTERNAL_API_URL=true forces it elsewhere (CI).
  if (process.env.RAILWAY_ENVIRONMENT_NAME || process.env.REQUIRE_INTERNAL_API_URL === "true") {
    throw new Error(
      "INTERNAL_API_URL is not set. Set it to the backend URL including /api " +
      "(Railway: https://cocpit-backend-staging.up.railway.app/api) before building."
    );
  }
  return DEFAULT_INTERNAL_API_URL || "http://localhost:5000/api";
}

// ── Image optimiser allowlist ───────────────────────────────────────────────
// Only these hosts may be fetched through /_next/image. A wildcard here would turn
// the optimiser into an open proxy billed to us. Add hosts without a code change via
// IMAGE_REMOTE_HOSTS="cdn.example.com,img.other.com" (build-time).
const IMAGE_HOSTS = [
  "res.cloudinary.com",        // Legacy assets (kept until migration complete)
  "lh3.googleusercontent.com", // Google avatars
  "images.unsplash.com",       // event card placeholders
  "api.dicebear.com",          // generated avatars
  "ui-avatars.com",            // generated avatars
  // ── Cloudflare R2 / CDN (Dual-Asset Architecture) ──────────────────────
  "pub-432e428714cf45fa81543429322f3026.r2.dev", // R2 public dev URL for cocpit-media
  "pub-9ab7b27b805e4ef3954360339e67917a.r2.dev", // R2 public dev URL (fallback)
  "cdn.cocpit.com",            // Future custom CDN domain (connect in Cloudflare dashboard)
  ...(process.env.IMAGE_REMOTE_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean),
];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Reduced from 100mb → 10mb since file uploads no longer proxy through Next.js.
    // Direct R2 presigned PUT bypasses this server entirely.
    // Only auth API calls and small JSON payloads pass through now.
    proxyClientMaxBodySize: '10mb',
  },
  images: {
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      pathname: "/**",
    })),
    // Uncomment the below line to disable image optimization globally in development (can speed up fast-refresh but hangs carousels with large images)
    // unoptimized: process.env.NODE_ENV === 'development',
  },
  async headers() {
    return [
      {
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
      {
        // Cache static fonts, images, and other assets aggressively (but NOT css/js to prevent breaking Next.js hydration and HMR)
        source: '/:all*(svg|jpg|png|webp|avif|woff2|woff|ttf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache media files
        source: '/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = resolveBackendUrl();
    const authPattern = EXPRESS_AUTH_ROUTES.join("|");
    return [
      {
        // Explicitly proxy Express backend auth endpoints (with sub-paths)
        source: `/api/auth/:path(${authPattern})/:rest*`,
        destination: `${backendUrl}/auth/:path/:rest*`,
      },
      {
        // Explicitly proxy Express backend auth endpoints (single path segment)
        source: `/api/auth/:path(${authPattern})`,
        destination: `${backendUrl}/auth/:path`,
      },
      {
        // Proxy all other /api routes except /api/auth
        source: "/api/:path((?!auth).*)",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzeBundles(nextConfig);
