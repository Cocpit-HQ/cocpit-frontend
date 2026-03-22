'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const TRACKED_SECTIONS = ['events', 'jobs', 'feed'];

/**
 * Hook to constantly update the last visited deep path per section in sessionStorage.
 * This runs at the root layout level.
 */
export function useNavigationTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track if it matches a known section boundary
    const sectionMatch = TRACKED_SECTIONS.find(s => pathname.startsWith(`/${s}`));
    if (sectionMatch) {
      sessionStorage.setItem(`nav_memory_${sectionMatch}`, pathname);
    }
  }, [pathname]);
}

/**
 * Utility to use inside Sidebar or Navigation components to replace href clicks.
 * It strictly maintains URL tracking without any global Zustand state.
 */
export function useNavigationMemoryLink() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetBase: string) => {
    // Determine the base section (e.g., from "/events" to "events")
    const sectionMatch = TRACKED_SECTIONS.find(s => targetBase.startsWith(`/${s}`));

    if (sectionMatch) {
      // If we are currently NOT in this section, check memory
      if (!pathname.startsWith(`/${sectionMatch}`)) {
        const savedPath = sessionStorage.getItem(`nav_memory_${sectionMatch}`);
        if (savedPath && savedPath !== targetBase) {
          e.preventDefault();
          router.push(savedPath); // Forward to exact last memory correctly
        }
      }
      // If we ARE in this section, normal navigation applies (drops user to base section, resetting memory)
    }
  }, [pathname, router]);

  return { handleNavClick };
}
