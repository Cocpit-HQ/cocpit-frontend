'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Helper to save current scroll position before navigating away (e.g. to a post or original post in repost),
 * ensuring the user returns to their exact scroll position when navigating back.
 */
export const saveScrollPosition = (source = "post", postId?: string) => {
  if (typeof window === "undefined") return;
  let currentScroll = window.scrollY;
  const currentPath = window.location.pathname;

  let targetEl: HTMLElement | null = null;
  if (postId) {
    sessionStorage.setItem("cocpit_last_interacted_post_id", postId.toString());
    targetEl = (document.getElementById(`post-${postId}`) || document.querySelector(`[data-post-id="${postId}"]`)) as HTMLElement | null;
  }

  // If window.scrollY is 0, check for active scroll container (e.g. ProfileAllPostsScreen or ancestor of targetEl)
  if (currentScroll === 0) {
    const allPostsContainer = document.getElementById("profile-all-posts-scroll-container");
    if (allPostsContainer && allPostsContainer.scrollTop > 0) {
      currentScroll = allPostsContainer.scrollTop;
    } else if (targetEl) {
      let parent = targetEl.parentElement;
      while (parent && parent !== document.body) {
        if (parent.scrollTop > 0) {
          currentScroll = parent.scrollTop;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }

  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const container = document.getElementById("profile-all-posts-scroll-container");
    const containerTop = container ? container.getBoundingClientRect().top : 0;
    sessionStorage.setItem("cocpit_last_interacted_post_viewport_top", (rect.top - containerTop).toString());
  }

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

let isInitialMount = true;

export function useScrollRestoration(isReady: boolean, containerId?: string) {
  const pathname = usePathname();
  const restoredRef = useRef(false);
  const [hasRestored, setHasRestored] = useState(false);
  const lastPathnameRef = useRef(pathname);

  if (lastPathnameRef.current !== pathname) {
    lastPathnameRef.current = pathname;
    restoredRef.current = false;
    setHasRestored(false);
  }

  // Disable native browser scroll restoration fighting us
  useIsomorphicLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (isReady && !restoredRef.current) {
      const { useUIStore } = require('@/store/ui.store');
      const isEditing = !!useUIStore.getState().editingPostId;
      const isReposting = !!useUIStore.getState().sharedPostData;
      
      if (isEditing || isReposting) {
        return;
      }

      let saved = sessionStorage.getItem(`scroll-${pathname}`);
      if (!saved && pathname.startsWith('/profile')) {
        saved = sessionStorage.getItem("cocpit_profile_scroll_y");
      }
      
      if (isInitialMount && typeof window !== "undefined") {
        const navEntry = window.performance?.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        const isReload = navEntry?.type === "reload" || window.performance?.navigation?.type === 1;
        if (isReload) {
          saved = null;
          sessionStorage.removeItem(`scroll-${pathname}`);
        }
        isInitialMount = false;
      }

      const getScrollElement = () => containerId ? document.getElementById(containerId) : null;

      if (saved) {
        const initialTargetScroll = parseInt(saved, 10);
        const lastPostId = sessionStorage.getItem("cocpit_last_interacted_post_id");
        const lastViewportTopStr = sessionStorage.getItem("cocpit_last_interacted_post_viewport_top");
        const lastViewportTop = lastViewportTopStr ? parseFloat(lastViewportTopStr) : null;
        let retries = 0;
        const maxRetries = 60; // 60 frames = ~1000ms

        const attemptScroll = () => {
          const el = getScrollElement();
          
          const targetEl = lastPostId ? (document.getElementById(`post-${lastPostId}`) || document.querySelector(`[data-post-id="${lastPostId}"]`)) : null;

          let targetScroll = initialTargetScroll;
          if (targetEl && lastViewportTop !== null) {
            const containerTop = el ? el.getBoundingClientRect().top : 0;
            const currentElTop = targetEl.getBoundingClientRect().top - containerTop;
            const currentWinScroll = el ? el.scrollTop : window.scrollY;
            targetScroll = Math.max(0, currentWinScroll + currentElTop - lastViewportTop);
          }

          // 1. Attempt scroll
          if (el) {
            el.scrollTo({ top: targetScroll, behavior: 'instant' });
          } else {
            window.scrollTo({ top: targetScroll, behavior: 'instant' });
          }

          // 2. Measure actual scroll location
          const currentScroll = el ? el.scrollTop : window.scrollY;

          // 3. Evaluate success (within small fractional margin)
          if (Math.abs(currentScroll - targetScroll) < 5) {
            setTimeout(() => setHasRestored(true), 150);
            return;
          }

          // 4. Retry conditions
          if (retries >= maxRetries) {
             setTimeout(() => setHasRestored(true), 150);
             return;
          }

          // Keep attempting for subsequent frames as virtualizer/DOM mutates sizes
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
    if (!hasRestored) return;

    let timeoutId: NodeJS.Timeout;
    
    const getScrollElement = () => containerId ? document.getElementById(containerId) : null;
    const scrollTarget = getScrollElement() || window;

    const handleScroll = () => {
      const { useUIStore } = require('@/store/ui.store');
      if (useUIStore.getState().editingPostId) return;

      const el = getScrollElement();
      const currentScroll = el ? el.scrollTop : window.scrollY;
      
      // Discard coordinates if they abruptly crash to zero when navigating away
      if (currentScroll === 0 && sessionStorage.getItem(`scroll-${pathname}`) !== '0') {
          return;
      }
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(`scroll-${pathname}`, currentScroll.toString());
        if (pathname.startsWith('/profile')) {
          sessionStorage.setItem("cocpit_profile_scroll_y", currentScroll.toString());
        }
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
