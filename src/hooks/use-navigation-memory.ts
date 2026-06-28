'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useJobStore } from '@/store/job.store';

const TRACKED_SECTIONS = ['events', 'jobs', 'feed'];

/**
 * Hook to constantly update the last visited deep path per section in sessionStorage.
 * This runs at the root layout level.
 */
export function useNavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track if it matches a known section boundary
    const sectionMatch = TRACKED_SECTIONS.find(s => pathname.startsWith(`/${s}`));
    if (sectionMatch) {
      const segments = pathname.split('/').filter(Boolean);
      const isSubpage = segments.length > 1;

      const queryString = searchParams.toString();
      const currentPath = queryString ? `${pathname}?${queryString}` : pathname;

      // Only save base section paths in memory, not detail subpages
      if (!isSubpage) {
        sessionStorage.setItem(`nav_memory_${sectionMatch}`, currentPath);
      }

      // Store a flawless _base memory for robust back-navigation tab restoration
      if (pathname === `/${sectionMatch}`) {
        sessionStorage.setItem(`nav_memory_${sectionMatch}_base`, currentPath);
      }
    }

    // Clear jobs scroll memory if we leave the jobs section
    if (pathname && !pathname.startsWith('/jobs')) {
      const tabsList = ['Explore', 'My Applications', 'Offers', 'Saved', 'My Listings'];
      tabsList.forEach(tab => {
        sessionStorage.removeItem(`jobs_scroll_page_${tab}`);
        sessionStorage.removeItem(`jobs_scroll_container_${tab}`);
      });
      sessionStorage.removeItem('coming_from_job_detail');
      useJobStore.getState().setActiveCandidateTab('Explore');
    }
  }, [pathname, searchParams]);
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
