"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * A hook to intelligently handle "go back" actions on detail pages.
 * 
 * When `MemoryRouter` uses `router.replace` from a base route (like /events) 
 * to a deep link (like /events/[id]), the base route is never added to the 
 * browser's history stack. Relying purely on `router.back()` in this scenario 
 * will take the user out of the current section entirely (e.g., back to /feed).
 * 
 * This hook forces a return to the logical parent base route if the user is 
 * within a known tracked section.
 */
export function useSmartBack() {
  const router = useRouter();
  const pathname = usePathname();

  const goBack = useCallback((fallbackUrl?: string) => {
    let targetUrl = fallbackUrl;

    // Attempt to infer the base section from the pathname if no fallback provided
    if (!targetUrl && pathname) {
      const match = pathname.match(/^\/([^/?]+)/);
      if (match) {
        targetUrl = `/${match[1]}`;
      }
    }

    if (targetUrl) {
      // Clear the deep link from memory by resetting it to the base URL.
      // This prevents the MemoryRouter from immediately redirecting us back 
      // into the detail page we just left.
      
      let finalTarget = targetUrl;
      const match = targetUrl.match(/^\/([^/?]+)/);
      
      if (match) {
        const section = match[1]; // e.g. 'events' or 'jobs'
        
        // Check if we have a detailed _base memory (which includes searchParams like ?tab=offers)
        const baseMemory = sessionStorage.getItem(`nav_memory_${section}_base`);
        if (baseMemory) {
          finalTarget = baseMemory;
        }

        // Overwrite the deep-link history so going back to base doesn't immediately shoot us back to the detail page
        sessionStorage.setItem(`nav_memory_${section}`, finalTarget);
      }
      
      router.push(finalTarget, { scroll: false });
      return;
    }

    // Default to browser back if no section matched
    router.back();
  }, [router, pathname]);

  return { goBack };
}
