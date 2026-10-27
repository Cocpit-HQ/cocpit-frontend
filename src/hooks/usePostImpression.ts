import { useEffect, useRef } from 'react';
import api from '@/lib/axios';

/**
 * Hook to track post impressions
 * @param postId The ID of the post to track
 * @param threshold Visibility threshold (default 0.6 for 60%)
 */
export const usePostImpression = <T extends HTMLElement = HTMLElement>(postId: string, threshold = 0.6) => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const elementRef = useRef<T | null>(null);
    const hasTracked = useRef(false);

    useEffect(() => {
        if (!postId || typeof window === 'undefined' || hasTracked.current) {
            return;
        }

        const recordImpression = async () => {
            try {
                // Prevent duplicate tracking in same session/component lifecycle
                if (hasTracked.current) return;
                hasTracked.current = true;

                await api.post(`/dashboard/post/${postId}/impression`);
            } catch {
                // Silent fail for impressions
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
                        recordImpression();
                        if (elementRef.current) {
                            observer.unobserve(elementRef.current);
                        }
                    }
                });
            },
            { threshold: [0, threshold] }
        );

        const currentElement = elementRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        observerRef.current = observer;

        return () => {
            if (observerRef.current && currentElement) {
                observerRef.current.unobserve(currentElement);
            }
        };
    }, [postId, threshold]);

    return elementRef;
};
