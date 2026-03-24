import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
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
    return [
      {
        // Proxy specific backend auth routes
        source: "/api/auth/:path(login|refresh|register|google|logout|me|actor-context|sessions|reset-password|request-otp|verify-otp)",
        destination: "http://localhost:5000/api/auth/:path*",
      },
      {
        // Proxy all other /api routes except /api/auth
        source: "/api/:path((?!auth).*)",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default analyzeBundles(nextConfig);
