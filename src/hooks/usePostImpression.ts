import { useEffect, useRef } from 'react';
import api from '@/lib/axios';

/**
 * Hook to track post impressions
 * @param postId The ID of the post to track
 * @param threshold Visibility threshold (default 0.6 for 60%)
 */
export const usePostImpression = (postId: string, threshold = 0.6) => {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const elementRef = useRef<HTMLElement | null>(null);
    const hasTracked = useRef(false);

    useEffect(() => {
        if (!postId || typeof window === 'undefined' || hasTracked.current) {
            console.log(`[DEBUG] Hook: Skipping observation for ${postId}. hasTracked: ${hasTracked.current}`);
            return;
        }

        const recordImpression = async () => {
            try {
                // Prevent duplicate tracking in same session/component lifecycle
                if (hasTracked.current) return;
                hasTracked.current = true;

                console.log(`[DEBUG] Hook: Recording impression for post ${postId}`);
                await api.post(`/dashboard/post/${postId}/impression`);
                console.log(`[DEBUG] Hook: Successfully recorded impression for post ${postId}`);
            } catch (err) {
                // Silent fail for impressions
                console.error(`[ERROR] Hook: Failed to track impression for post ${postId}`, err);
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

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        observerRef.current = observer;

        return () => {
            if (observerRef.current && elementRef.current) {
                observerRef.current.unobserve(elementRef.current);
            }
        };
    }, [postId, threshold]);

    return elementRef;
};
