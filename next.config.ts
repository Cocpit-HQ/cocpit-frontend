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

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
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
    const backendUrl = process.env.INTERNAL_API_URL || (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : null) || 'http://localhost:5001/api';
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
