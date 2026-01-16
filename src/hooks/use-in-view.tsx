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
  }, [node, options]);

  return { ref, inView };
}
