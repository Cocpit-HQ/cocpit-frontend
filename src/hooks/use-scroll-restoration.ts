'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 Helper to save current scroll position before navigating away (e.g. to a post or original post in repost),
 * ensuring the user returns to their exact scroll position when navigating back.
 */
export const saveScrollPosition = (source = "post") => {
  if (typeof window === "undefined") return;
  const currentScroll = window.scrollY;
  const currentPath = window.location.pathname;

  sessionStorage.setItem(`scroll-${currentPath}`, currentScroll.toString());
  sessionStorage.setItem("cocpit_scroll_y", currentScroll.toString());
  sessionStorage.setItem("cocpit_scroll_source", source);
  sessionStorage.setItem("cocpit_scroll_path", currentPath);
  sessionStorage.setItem("cocpit_profile_scroll_y", currentScroll.toString());
  sessionStorage.setItem("cocpit_profile_scroll_source", source);
  sessionStorage.setItem("cocpit_profile_scroll_path", currentPath);

  try {
    const currentState = { ...window.history.state };
    currentState.cocpit_scroll_y = currentScroll;
    currentState.cocpit_scroll_source = source;
    currentState.cocpit_scroll_path = currentPath;
    currentState.cocpit_popstate_occurred = true;
    window.history.replaceState(currentState, "", window.location.href);
  } catch (err) {
    console.error("Failed to update history state:", err);
  }
};

export function useScrollRestoration(isReady: boolean, containerId?: string) {
  const pathname = usePathname();
  const restoredRef = useRef(false);
  const [hasRestored, setHasRestored] = useState(false);

  // Disable native browser scroll restoration fighting us
  useIsomorphicLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (isReady && !restoredRef.current) {
      const saved = sessionStorage.getItem(`scroll-${pathname}`);
      
      const getScrollElement = () => containerId ? document.getElementById(containerId) : null;

      if (saved) {
        const targetScroll = parseInt(saved, 10);
        let retries = 0;
        const maxRetries = 20; // 20 frames = ~330ms

        const attemptScroll = () => {
          const el = getScrollElement();
          
          // 1. Attempt scroll
          if (el) {
            el.scrollTo({ top: targetScroll, behavior: 'instant' });
          } else {
            window.scrollTo({ top: targetScroll, behavior: 'instant' });
          }

          // 2. Measure actual scroll location
          const currentScroll = el ? el.scrollTop : window.scrollY;

          // 3. Evaluate success (within small fractional margin)
          // If true, DOM successfully expanded to accommodate coordinate
          if (Math.abs(currentScroll - targetScroll) < 5) {
            setTimeout(() => setHasRestored(true), 150);
            return;
          }

          // 4. Retry conditions
          if (retries >= maxRetries) {
             console.warn(`[ScrollRestoration] DOM height did not reach target ${targetScroll} within ${maxRetries} frames. Clamped at ${currentScroll}.`);
             setTimeout(() => setHasRestored(true), 150);
             return;
          }

          // Keep attempting for subsequent frames as the virtualizer/DOM mutates sizes
          retries++;
          requestAnimationFrame(attemptScroll);
        };

        // Initialize recursive robust restoration loop
        attemptScroll();
      } else {
        const el = getScrollElement();
        if (el) {
          el.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        setTimeout(() => setHasRestored(true), 150);
      }
      
      restoredRef.current = true;
    }
  }, [isReady, pathname, containerId]);

  // Scroll position sync (debounced)
  useEffect(() => {
    // Block saving 0 coordinates until AFTER restoration sequence is complete
    if (!hasRestored) return;

    let timeoutId: NodeJS.Timeout;
    
    const getScrollElement = () => containerId ? document.getElementById(containerId) : null;
    const scrollTarget = getScrollElement() || window;

    const handleScroll = () => {
      const el = getScrollElement();
      const currentScroll = el ? el.scrollTop : window.scrollY;
      
      // Discard coordinates if they abruptly crash to zero when navigating away
      if (currentScroll === 0 && sessionStorage.getItem(`scroll-${pathname}`) !== '0') {
          return;
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(`scroll-${pathname}`, currentScroll.toString());
      }, 150); 
    };

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [pathname, hasRestored, containerId]);

  return restoredRef.current;
}
