"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CocpitLogoIcon } from "@/components/icons";

// Routes where the watermark should be hidden (e.g. chat, messaging, jobs)
const EXCLUDED_ROUTES = [
  "/messaging",
  "/chat",
  "/jobs",
];

/**
 * GlobalBrandMark is the single source of truth for the Cocpit logo watermark.
 * - Desktop (>= 640px): Fixed at bottom: 40px, right: 40px across all pages & features.
 * - Mobile (< 640px):
 *     - Auth / Onboarding flows: positioned at top-10 left-6 for mobile-friendly UI.
 *     - Authenticated app: hidden from bottom-right so it never collides with mobile bottom navigation.
 * - Configurable: Hide on specific features (e.g. /messaging, /jobs, /chat) in one place.
 */
export function GlobalBrandMark() {
  const pathname = usePathname();

  // If currently on an excluded route, do not render the brand watermark
  if (EXCLUDED_ROUTES.some((route) => pathname?.startsWith(route))) {
    return null;
  }

  // On auth and onboarding pages, mobile layout places the logo at top-10 left-6
  const isAuthOrOnboarding =
    pathname === "/" ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/restore-account");

  return (
    <div
      className={
        isAuthOrOnboarding
          ? "absolute top-10 left-6 sm:fixed sm:top-auto sm:left-auto sm:bottom-[40px] sm:right-[40px] z-[9000] pointer-events-auto"
          : "hidden sm:block fixed bottom-[40px] right-[40px] z-[9000] pointer-events-auto"
      }
    >
      <Link
        href="https://cocpit.in"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Cocpit"
        className="block relative text-ds-text-primary hover:opacity-80 transition-opacity"
      >
        <CocpitLogoIcon className="w-[27px] h-[30px]" />
      </Link>
    </div>
  );
}

export default GlobalBrandMark;
