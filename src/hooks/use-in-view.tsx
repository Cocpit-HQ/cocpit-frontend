import { useState, useEffect, useCallback } from 'react';

export function useInView(options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false);
  const [node, setNode] = useState<Element | null>(null);

  const ref = useCallback((node: Element | null) => {
    setNode(node);
  }, []);

  useEffect(() => {
    if (node) {
      const observer = new IntersectionObserver(([entry]) => {
        setInView(entry.isIntersecting);
      }, options);

      observer.observe(node);

      return () => {
        observer.unobserve(node);
      };
    }
    // Depend on the primitive option values, not the `options` object's
    // identity — callers commonly pass an inline literal, which would
    // otherwise tear down and rebuild the observer on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, options?.threshold, options?.rootMargin, options?.root]);

  return { ref, inView };
}
