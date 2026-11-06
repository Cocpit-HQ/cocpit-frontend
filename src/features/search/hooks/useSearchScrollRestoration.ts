'use client';

import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface UseSearchScrollRestorationOptions {
  isReady: boolean;
  currentSearchUrl: string;
  query: string;
  type: string;
}

const getStorageKey = (url: string) => `cocpit_search_scroll_${url}`;

export function useSearchScrollRestoration({
  isReady,
  currentSearchUrl,
  query,
  type,
}: UseSearchScrollRestorationOptions) {
  const currentUrlRef = useRef(currentSearchUrl);
  const prevQueryRef = useRef(query);
  const prevTypeRef = useRef(type);
  const restoredUrlRef = useRef<string | null>(null);
  const isRestoringRef = useRef(false);

  currentUrlRef.current = currentSearchUrl;

  // 1. Tell browser to not prematurely clamp scroll before React renders
  useIsomorphicLayoutEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // 2. Reset scroll to top when query or category tab changes
  useEffect(() => {
    const isNewQuery = prevQueryRef.current !== query;
    const isNewType = prevTypeRef.current !== type;

    if (isNewQuery || isNewType) {
      prevQueryRef.current = query;
      prevTypeRef.current = type;
      restoredUrlRef.current = null;
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [query, type]);

  // 3. Continuous passive scroll tracking (debounced)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (isRestoringRef.current) return;
      const scrollY = window.scrollY;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const url = currentUrlRef.current;
        if (url && scrollY >= 0) {
          sessionStorage.setItem(getStorageKey(url), scrollY.toString());
        }
      }, 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // 4. Save scroll position on unmount (when navigating to single page)
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        const scrollY = window.scrollY;
        const url = currentUrlRef.current;
        if (url && scrollY > 0) {
          sessionStorage.setItem(getStorageKey(url), scrollY.toString());
        }
      }
    };
  }, []);

  // 5. Container-level event delegation click capture
  const handleCaptureClick = useCallback((e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;

    const target = e.target as HTMLElement | null;
    const clickable = target?.closest('a, button, [role="button"]');
    if (!clickable) return;

    const scrollY = window.scrollY;
    const url = currentUrlRef.current;
    if (url && scrollY >= 0) {
      sessionStorage.setItem(getStorageKey(url), scrollY.toString());
    }

    const itemEl = target?.closest('[data-search-item-id]');
    if (itemEl) {
      const itemId = itemEl.getAttribute('data-search-item-id');
      if (itemId) {
        sessionStorage.setItem('cocpit_search_target_item_id', itemId);
      }
    }
  }, []);

  // 6. Multi-frame layout-aware scroll restoration loop
  useIsomorphicLayoutEffect(() => {
    if (!isReady || typeof window === 'undefined') return;
    if (restoredUrlRef.current === currentSearchUrl) return;

    const saved = sessionStorage.getItem(getStorageKey(currentSearchUrl));
    if (!saved) {
      restoredUrlRef.current = currentSearchUrl;
      return;
    }

    const targetY = parseInt(saved, 10);
    if (isNaN(targetY) || targetY <= 0) {
      restoredUrlRef.current = currentSearchUrl;
      return;
    }

    isRestoringRef.current = true;
    let retries = 0;
    const maxRetries = 45; // ~750ms at 60fps

    const attemptScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // If document hasn't expanded enough to allow scrolling to target, wait for next frame
      if (scrollHeight <= clientHeight && retries < maxRetries) {
        retries++;
        requestAnimationFrame(attemptScroll);
        return;
      }

      window.scrollTo({ top: targetY, behavior: 'instant' });

      const currentScroll = window.scrollY;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const expectedScroll = Math.min(targetY, maxScroll);

      if (Math.abs(currentScroll - expectedScroll) < 15 || retries >= maxRetries) {
        restoredUrlRef.current = currentSearchUrl;
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
        return;
      }

      retries++;
      requestAnimationFrame(attemptScroll);
    };

    requestAnimationFrame(attemptScroll);
  }, [isReady, currentSearchUrl]);

  return {
    handleCaptureClick,
  };
}

