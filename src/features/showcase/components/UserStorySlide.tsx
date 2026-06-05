import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Heart, Trash2, Volume2, VolumeX, X } from "lucide-react"
import { StoryDetail, StoryGroup } from "../types/showcase"
import { StoryInteractionPanel } from "./StoryInteractionPanel"
import { showcaseService } from "../services/showcase.service"
import { SharedPostCard } from "./SharedPostCard"
import { JobStoryCard } from "@/components/jobs/JobStoryCard"
import { StoryMetadata } from "../types/story-editor"
import { VirtualLayerCanvas } from "./ViewerLayerItem"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useStorySync } from "../hooks/use-story-sync"
import { formatTimeAgo } from "@/lib/utils"
import { useStories } from "@/context/StoriesContext"

type UserStorySlideProps = {
    group: StoryGroup
    isActiveUser: boolean
    onNextUser: () => void
    onPrevUser: () => void
    onClose: () => void
    isDark?: boolean
    onStoryUpdate?: (story: StoryDetail) => void
    onStoryViewed?: (storyId: number) => void
    disableMediaBackgroundFallback?: boolean
}

// Individual User Story Viewer
export const UserStorySlide = ({
    group,
    isActiveUser,
    onNextUser,
    onPrevUser,
    onClose,
    isDark,
    onStoryUpdate,
    onStoryViewed,
    disableMediaBackgroundFallback: _disableMediaBackgroundFallback = false
}: UserStorySlideProps) => {
    type StoryLike = StoryDetail;
    const [storyIndex, setStoryIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [showInteraction, setShowInteraction] = useState(false)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const { activeProfile } = useActiveProfile();
    const { markStoryViewed } = useStories();

    const videoSlotRef0 = useRef<HTMLVideoElement>(null)
    const videoSlotRef1 = useRef<HTMLVideoElement>(null)
    const videoEndTriggeredRef = useRef(false)
    const preloadCacheRef = useRef<Map<number, Promise<void>>>(new Map())
    const [activeVideoSlot, setActiveVideoSlot] = useState<0 | 1>(0)
    const [videoSlotStories, setVideoSlotStories] = useState<[number | null, number | null]>([null, null])
    const [videoSlotSrcs, setVideoSlotSrcs] = useState<[string, string]>(["", ""])
    const [videoSlotReady, setVideoSlotReady] = useState<[boolean, boolean]>([false, false])

    // Stories are already sorted by backend (Oldest -> Newest)
    // Deduplicate stories to prevent "same key" errors
    const sortedStories = useMemo(() => {
        if (!group?.stories) return [];
        const stories = group.stories || [];
        const unique = new Map();
        stories.forEach(s => unique.set(s.id, s));
        return Array.from(unique.values()).sort(
            (a, b) => new Date(a.created_at || new Date()).getTime() - new Date(b.created_at || new Date()).getTime()
        );
    }, [group?.stories]);

    // Ensure storyIndex is within bounds
    const safeStoryIndex = Math.min(storyIndex, sortedStories.length - 1);
    const currentStory = sortedStories[safeStoryIndex >= 0 ? safeStoryIndex : 0]
    const nextStory = sortedStories[storyIndex + 1]
    const isMyStory = group.is_current_user;

    const storyById = useMemo(() => {
        const map = new Map<number, StoryLike>();
        sortedStories.forEach((s) => map.set(s.id, s));
        return map;
    }, [sortedStories]);

    const storyHasVideoLayer = useCallback((story?: StoryLike) => {
        if (!story) return false;
        let meta = story.story_metadata as any;
        if (typeof meta === "string") {
            try {
                meta = JSON.parse(meta);
            } catch {
                meta = null;
            }
        }
        const layers = meta?.layers;
        return Array.isArray(layers) && layers.some((l: any) => l?.type === "video");
    }, []);

    const getLegacyVideoSrc = useCallback((story?: StoryLike): string => {
        if (!story || story.media_type !== "video") return "";

        let url = story.media_url || story.image || "";
        if (url && url.includes("cloudinary")) {
            // Normalize extension to .mp4, handling query strings
            if (!url.match(/\.mp4(\?|$)/i)) {
                url = url.replace(/\.[^/.?]+(\?.*)?$/, '.mp4$1');
            }
        }
        return url;
    }, []);

    const isValidMediaUrl = useCallback((url?: string | null): boolean => {
        const candidate = (url || "").trim();
        if (!candidate) return false;

        // Reject the fake job placeholder from being treated as a valid image source
        if (candidate === "job-structured-data") return false;

        if (
            candidate.startsWith("blob:") ||
            candidate.startsWith("data:") ||
            candidate.startsWith("/") ||
            candidate.startsWith("./") ||
            candidate.startsWith("../")
        ) {
            return true;
        }

        try {
            const parsed = new URL(candidate);
            return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
            return false;
        }
    }, []);

    const currentIsLegacyVideo = currentStory?.media_type === "video" && !storyHasVideoLayer(currentStory);
    const nextIsLegacyVideo = nextStory?.media_type === "video" && !storyHasVideoLayer(nextStory);
    const currentLegacySrc = getLegacyVideoSrc(currentStory);
    const nextLegacySrc = getLegacyVideoSrc(nextStory);
    const hasValidCurrentLegacySrc = isValidMediaUrl(currentLegacySrc);
    // Snapshot-based: image stories always use media_url (the baked composite snapshot)
    const currentImageSrc = currentStory?.media_type !== "video" ? (currentStory?.media_url || "") : "";
    const hasValidCurrentImageSrc = isValidMediaUrl(currentImageSrc);
    const getStoryPosterSrc = useCallback((story?: StoryLike): string => {
        if (!story) return "";
        const candidate = story.thumbnail_url || story.image || "";
        return isValidMediaUrl(candidate) ? candidate : "";
    }, [isValidMediaUrl]);
    const getVideoSlotRef = useCallback((slot: 0 | 1) => (slot === 0 ? videoSlotRef0 : videoSlotRef1), []);
    const markVideoSlotReady = useCallback((slot: 0 | 1, ready: boolean) => {
        setVideoSlotReady((prev) => {
            if (prev[slot] === ready) return prev;
            const next: [boolean, boolean] = [...prev];
            next[slot] = ready;
            return next;
        });
    }, []);

    // Initialize isLiked state - must be after all other useState hooks
    const [isLiked, setIsLiked] = useState(!!currentStory?.isLiked)
    const [isImageReady, setIsImageReady] = useState(false)
    const [isVirtualLayerReady, setIsVirtualLayerReady] = useState(false)
    const [mediaLoadFailed, setMediaLoadFailed] = useState(false)

    // Parse Metadata safely
    const metadata = useMemo(() => {
        let meta = currentStory?.story_metadata;
        if (typeof meta === 'string') {
            try {
                meta = JSON.parse(meta);
            } catch (e) {
                console.error("Failed to parse story_metadata", e);
                meta = null;
            }
        }
        return (meta as unknown as StoryMetadata) || { layers: [] };
    }, [currentStory]);

    // Snapshot-based: only videos with layers use VirtualLayerCanvas (images are pre-baked snapshots)
    const isLayeredStory = currentStory?.media_type === "video" && (metadata?.layers?.length || 0) > 0;
    const isMediaReady = mediaLoadFailed || (isLayeredStory ? isVirtualLayerReady : (currentStory?.media_type === "video" ? videoSlotReady[activeVideoSlot] : isImageReady));

    // Track if this is the first time becoming active
    const wasActiveRef = useRef(false)

    // Reset when this slide becomes active (only on transition to active, not on story updates)
    useEffect(() => {
        if (isActiveUser && !wasActiveRef.current) {
            // Just became active
            wasActiveRef.current = true
            if (sortedStories.length > 0) {
                const firstUnseenIdx = sortedStories.findIndex(story => !story.is_seen);
                const initialStoryIdx = firstUnseenIdx !== -1 ? firstUnseenIdx : 0;
                setStoryIndex(initialStoryIdx)
                setProgress(0)
                const initialStory = sortedStories[initialStoryIdx];
                setIsLiked(!!initialStory?.isLiked)
                setIsDescriptionExpanded(false)
            }
        } else if (!isActiveUser) {
            // Became inactive
            wasActiveRef.current = false
        }
    }, [isActiveUser, sortedStories])

    // Reset like/description when story changes
    useEffect(() => {
        setIsLiked(!!currentStory?.isLiked) // Update with current story state
        setIsDescriptionExpanded(false)
        setMediaLoadFailed(false)
        setIsVirtualLayerReady(false)

        // For job stories: we handle readiness in the second useEffect
        // but let's ensure we don't accidentally set it to false here for too long
        if (currentStory?.story_metadata?.type === 'job') {
            setIsImageReady(true);
        } else if (currentStory?.media_type !== 'video' && currentStory?.media_url) {
            const probe = new Image();
            probe.src = currentStory.media_url;
            if (probe.complete && probe.naturalWidth > 0) {
                setIsImageReady(true); // Already cached — no flash
            } else {
                setIsImageReady(false);
            }
        } else {
            setIsImageReady(false);
        }
    }, [currentStory?.id]) // ONLY reset when the actual story changes



    // Record View separately when becoming active
    useEffect(() => {
        if (isActiveUser && currentStory && !currentStory.isAuthor) {
            const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
            showcaseService.markShowcaseSeen(currentStory.id, companyId)
                .then(() => {
                    markStoryViewed(currentStory.id);
                    if (onStoryViewed) onStoryViewed(currentStory.id);
                })
                .catch(err => console.error("View story failed", err));
        }
    }, [currentStory?.id, currentStory?.isAuthor, isActiveUser, activeProfile?.id, activeProfile?.type, markStoryViewed])

    // Real-time synchronization
    useStorySync(isActiveUser ? currentStory?.id : undefined, {
        onReactionUpdated: ({ likeCount }) => {
            if (currentStory && onStoryUpdate) {
                // Map API "like_count" to UI "likes" string/number
                onStoryUpdate({ ...currentStory, likes: likeCount });
            }
        }
    });

    useEffect(() => {
        if (currentStory) {
            console.log("FINAL STORY:", currentStory);
            console.log('[DEBUG] UserStorySlide currentStory details:', {
                id: currentStory.id,
                media_url: currentStory.media_url,
                metadata_type: currentStory.story_metadata?.type,
                full_metadata: currentStory.story_metadata
            });
        }
    }, [currentStory?.id]);

    useEffect(() => {
        if (!currentStory || isLayeredStory) return;

        if (currentStory.media_type === "video") {
            if (!hasValidCurrentLegacySrc) {
                setMediaLoadFailed(true);
                markVideoSlotReady(activeVideoSlot, true);
            }
            return;
        }

        // For job stories, we are always ready if we used our internal placeholder or gradient
        if (currentStory.story_metadata?.type === 'job') {
            setMediaLoadFailed(false);
            setIsImageReady(true);
            return;
        }

        if (!hasValidCurrentImageSrc) {
            setMediaLoadFailed(true);
            setIsImageReady(true);
        }
    }, [
        currentStory,
        isLayeredStory,
        hasValidCurrentLegacySrc,
        hasValidCurrentImageSrc,
        activeVideoSlot,
        markVideoSlotReady,
    ]);

    const isNavigatingRef = useRef(false)

    // Reset navigation lock when active user changes or story index changes
    useEffect(() => {
        if (isActiveUser) {
            isNavigatingRef.current = false
        }
    }, [isActiveUser, storyIndex])

    const preloadStoryMedia = useCallback((story?: StoryLike): Promise<void> => {
        if (!story || !story.id) return Promise.resolve();
        const cached = preloadCacheRef.current.get(story.id);
        if (cached) return cached;

        const preloadPromise = new Promise<void>((resolve) => {
            if (story.media_type === "video") {
                const videoSrc = story.media_url || story.image || "";
                if (!isValidMediaUrl(videoSrc)) {
                    resolve();
                    return;
                }

                const v = document.createElement("video");
                v.preload = "metadata";
                const done = () => resolve();
                v.onloadedmetadata = done;
                v.oncanplay = done;
                v.onerror = done;
                v.src = videoSrc;
                v.load();

                // Also preload poster image if available to avoid black flash.
                if (story.thumbnail_url || story.image) {
                    const posterSrc = story.thumbnail_url || story.image || "";
                    const img = new Image();
                    img.onload = () => { };
                    img.onerror = () => { };
                    if (isValidMediaUrl(posterSrc)) {
                        img.src = posterSrc;
                    }
                }
                return;
            }

            // Snapshot-based: use media_url (baked composite) for preloading
            const imageSrc = story.media_url || story.image || story.thumbnail_url || "";
            if (!isValidMediaUrl(imageSrc)) {
                resolve();
                return;
            }

            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = imageSrc;
        });

        preloadCacheRef.current.set(story.id, preloadPromise);
        return preloadPromise;
    }, [isValidMediaUrl]);

    // Prefetch the NEXT story's media while the current one plays
    useEffect(() => {
        if (!isActiveUser || !sortedStories.length) return;
        const nextIdx = storyIndex + 1;
        if (nextIdx < sortedStories.length) {
            const next = sortedStories[nextIdx];
            if (next?.media_url && next.media_type !== 'video') {
                // Preload the next snapshot image into browser cache
                const img = new Image();
                img.src = next.media_url;
            }
            preloadStoryMedia(next);
        }
    }, [isActiveUser, storyIndex, sortedStories, preloadStoryMedia])

    // Allow onEnded/onTimeUpdate completion to fire exactly once per story.
    useEffect(() => {
        videoEndTriggeredRef.current = false;
    }, [currentStory?.id, storyIndex]);

    const advanceToNext = useCallback((waitForReady: boolean) => {
        // Safety check: ensure we have stories
        if (!sortedStories || sortedStories.length === 0) {
            if (!isNavigatingRef.current) {
                isNavigatingRef.current = true;
                onNextUser();
            }
            return;
        }

        if (isNavigatingRef.current) return;

        if (storyIndex < sortedStories.length - 1) {
            isNavigatingRef.current = true;
            const targetIndex = storyIndex + 1;
            const targetStory = sortedStories[targetIndex];
            const go = () => {
                setStoryIndex(targetIndex);
                setProgress(0);
            };

            const isLegacyToLegacy =
                !!targetStory &&
                currentIsLegacyVideo &&
                targetStory.media_type === "video" &&
                !storyHasVideoLayer(targetStory);

            if (isLegacyToLegacy && targetStory) {
                const nextSlot: 0 | 1 = activeVideoSlot === 0 ? 1 : 0;
                const nextSrc = getLegacyVideoSrc(targetStory);
                const slotMatches =
                    videoSlotStories[nextSlot] === targetStory.id &&
                    videoSlotSrcs[nextSlot] === nextSrc;

                if (!slotMatches) {
                    setVideoSlotStories((prev) => {
                        const next: [number | null, number | null] = [...prev];
                        next[nextSlot] = targetStory.id;
                        return next;
                    });
                    setVideoSlotSrcs((prev) => {
                        const next: [string, string] = [...prev];
                        next[nextSlot] = nextSrc;
                        return next;
                    });
                    markVideoSlotReady(nextSlot, false);
                }

                const switchWhenReady = () => {
                    setActiveVideoSlot(nextSlot);
                    go();
                };

                const preloadElement = getVideoSlotRef(nextSlot).current;
                const alreadyReady =
                    (slotMatches && videoSlotReady[nextSlot]) ||
                    (!!preloadElement && preloadElement.readyState >= 3);

                if (alreadyReady) {
                    markVideoSlotReady(nextSlot, true);
                    switchWhenReady();
                    return;
                }

                if (waitForReady) {
                    let resolved = false;
                    const resolveOnce = () => {
                        if (resolved) return;
                        resolved = true;
                        switchWhenReady();
                    };

                    window.setTimeout(() => {
                        const el = getVideoSlotRef(nextSlot).current;
                        if (!el) {
                            void preloadStoryMedia(targetStory).finally(resolveOnce);
                            return;
                        }

                        const onCanPlay = () => {
                            markVideoSlotReady(nextSlot, true);
                            cleanup();
                            resolveOnce();
                        };
                        const onError = () => {
                            cleanup();
                            resolveOnce();
                        };
                        const cleanup = () => {
                            el.removeEventListener("canplay", onCanPlay);
                            el.removeEventListener("error", onError);
                        };

                        if (el.readyState >= 3) {
                            markVideoSlotReady(nextSlot, true);
                            resolveOnce();
                            return;
                        }

                        el.addEventListener("canplay", onCanPlay);
                        el.addEventListener("error", onError);
                        window.setTimeout(() => {
                            cleanup();
                            void preloadStoryMedia(targetStory).finally(resolveOnce);
                        }, 220);
                    }, 0);
                    return;
                }

                switchWhenReady();
                return;
            }

            if (waitForReady) {
                void preloadStoryMedia(targetStory).finally(go);
            } else {
                go();
            }
        } else {
            isNavigatingRef.current = true;
            // Defer to next tick to avoid state update during render
            setTimeout(() => onNextUser(), 0)
        }
    }, [
        sortedStories,
        storyIndex,
        onNextUser,
        preloadStoryMedia,
        currentIsLegacyVideo,
        storyHasVideoLayer,
        activeVideoSlot,
        getLegacyVideoSrc,
        videoSlotStories,
        videoSlotSrcs,
        videoSlotReady,
        getVideoSlotRef,
        markVideoSlotReady,
    ])

    const handleNext = useCallback(() => {
        advanceToNext(true);
    }, [advanceToNext]);

    const handleAutoNext = useCallback(() => {
        advanceToNext(true);
    }, [advanceToNext]);

    // Keep two mounted video elements for seamless legacy video transitions.
    useEffect(() => {
        if (!currentIsLegacyVideo || !currentStory) return;

        const visibleSlot = activeVideoSlot;
        const preloadSlot: 0 | 1 = visibleSlot === 0 ? 1 : 0;

        if (
            videoSlotStories[visibleSlot] !== currentStory.id ||
            videoSlotSrcs[visibleSlot] !== currentLegacySrc
        ) {
            setVideoSlotStories((prev) => {
                const next: [number | null, number | null] = [...prev];
                next[visibleSlot] = currentStory.id;
                return next;
            });
            setVideoSlotSrcs((prev) => {
                const next: [string, string] = [...prev];
                next[visibleSlot] = currentLegacySrc;
                return next;
            });
            setVideoSlotReady((prev) => {
                const next: [boolean, boolean] = [...prev];
                next[visibleSlot] = false;
                return next;
            });
        }

        if (nextIsLegacyVideo && nextStory && nextLegacySrc) {
            if (
                videoSlotStories[preloadSlot] !== nextStory.id ||
                videoSlotSrcs[preloadSlot] !== nextLegacySrc
            ) {
                setVideoSlotStories((prev) => {
                    const next: [number | null, number | null] = [...prev];
                    next[preloadSlot] = nextStory.id;
                    return next;
                });
                setVideoSlotSrcs((prev) => {
                    const next: [string, string] = [...prev];
                    next[preloadSlot] = nextLegacySrc;
                    return next;
                });
                setVideoSlotReady((prev) => {
                    const next: [boolean, boolean] = [...prev];
                    next[preloadSlot] = false;
                    return next;
                });
            }
        }
    }, [
        currentIsLegacyVideo,
        currentStory,
        currentLegacySrc,
        nextIsLegacyVideo,
        nextStory,
        nextLegacySrc,
        activeVideoSlot,
        videoSlotStories,
        videoSlotSrcs,
    ]);

    // Control legacy video playback based on interaction state.
    useEffect(() => {
        if (!currentStory || currentStory.media_type !== 'video' || !currentIsLegacyVideo) return;

        const activeVideo = getVideoSlotRef(activeVideoSlot).current;
        if (!activeVideo) return;

        const shouldPlay = isActiveUser && !isPaused && !showInteraction && !isDescriptionExpanded;

        if (shouldPlay) {
            activeVideo.play().catch(e => {
                // Ignore AbortError if we pause immediately after
                if (e.name !== 'AbortError') console.warn("Play failed", e);
            });
        } else {
            activeVideo.pause();
        }
    }, [
        isActiveUser,
        isPaused,
        showInteraction,
        isDescriptionExpanded,
        currentStory,
        storyIndex,
        currentIsLegacyVideo,
        activeVideoSlot,
        getVideoSlotRef,
    ]);

    // Progress timer for IMAGES
    useEffect(() => {
        if (!isActiveUser || isPaused || showInteraction || isDescriptionExpanded) return;
        if (!currentStory || currentStory.media_type === 'video') return; // Video handles its own progress

        const duration = 5000; // 5 seconds per image
        const interval = 100;
        const step = 100 * (interval / duration);

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [isActiveUser, isPaused, showInteraction, isDescriptionExpanded, currentStory]);

    // Check if legacy video slots are already ready (e.g., loaded from cache)
    useEffect(() => {
        const checkReady = () => {
            if (videoSlotRef0.current && videoSlotRef0.current.readyState >= 2) {
                markVideoSlotReady(0, true);
            }
            if (videoSlotRef1.current && videoSlotRef1.current.readyState >= 2) {
                markVideoSlotReady(1, true);
            }
        };

        checkReady();

        const v0 = videoSlotRef0.current;
        const v1 = videoSlotRef1.current;

        if (v0) {
            v0.addEventListener('canplay', checkReady);
            v0.addEventListener('loadeddata', checkReady);
        }
        if (v1) {
            v1.addEventListener('canplay', checkReady);
            v1.addEventListener('loadeddata', checkReady);
        }

        return () => {
            if (v0) {
                v0.removeEventListener('canplay', checkReady);
                v0.removeEventListener('loadeddata', checkReady);
            }
            if (v1) {
                v1.removeEventListener('canplay', checkReady);
                v1.removeEventListener('loadeddata', checkReady);
            }
        };
    }, [videoSlotSrcs[0], videoSlotSrcs[1], currentLegacySrc, activeVideoSlot, isActiveUser, markVideoSlotReady]);

    // Keep next story warm in memory so auto-advance is instant.
    useEffect(() => {
        if (!sortedStories.length) return;
        void preloadStoryMedia(currentStory);
        void preloadStoryMedia(sortedStories[storyIndex + 1]);
    }, [sortedStories, storyIndex, currentStory, preloadStoryMedia]);

    // Trigger next story when progress reaches 100
    useEffect(() => {
        if (progress >= 100) {
            handleAutoNext();
        }
    }, [progress, handleAutoNext]);

    const handlePrev = () => {
        // Safety check: ensure we have stories
        if (!sortedStories || sortedStories.length === 0) {
            onPrevUser();
            return;
        }

        if (storyIndex > 0) {
            setStoryIndex(prev => prev - 1)
            setProgress(0)
        } else {
            setTimeout(() => onPrevUser(), 0)
        }
    }

    // Touch handling
    const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        })
        setIsPaused(true)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        setIsPaused(false)
        if (!touchStart) return

        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
            time: Date.now()
        }

        const deltaY = touchStart.y - touchEnd.y
        const deltaTime = touchEnd.time - touchStart.time

        // Swipe down to close
        if (deltaY < -50 && deltaTime < 300) {
            onClose();
            setTouchStart(null);
            return;
        }

        // Swipe up to show interaction panel
        if (deltaY > 50 && deltaTime < 300) {
            setShowInteraction(true)
            setTouchStart(null)
            return
        }

        // Tap to navigate
        if (Math.abs(deltaY) < 10 && deltaTime < 300) {
            if (showInteraction) {
                setShowInteraction(false)
                setIsDescriptionExpanded(false)
                return
            }

            const screenWidth = window.innerWidth
            const tapX = e.changedTouches[0].clientX

            // If description is expanded and we tap outside of it (this container), close it
            if (isDescriptionExpanded) {
                setIsDescriptionExpanded(false)
                return
            }

            if (tapX < screenWidth * 0.3) {
                handlePrev()
            } else if (tapX > screenWidth * 0.7) {
                handleNext()
            }
        }
        setTouchStart(null)
    }

    const handleTouchCancel = () => {
        setIsPaused(false)
        setTouchStart(null)
    }

    // Guard clause AFTER all hooks - check if we have no stories at all
    // Don't check currentStory directly as it might be temporarily undefined during transitions
    if (sortedStories.length === 0) {
        return null;
    }

    // If currentStory is still undefined after bounds checking, something is wrong
    if (!currentStory) {
        return null;
    }

    const handleVideoCompleted = () => {
        if (videoEndTriggeredRef.current) return;
        videoEndTriggeredRef.current = true;
        setProgress(100);
        handleAutoNext();
    };

    const uploader = currentStory.author || group.author;
    const uploaderName = uploader?.name || "Unknown";
    const uploaderAvatar = uploader?.avatar || "/assets/pngegg.png";
    const storyTimestamp = formatTimeAgo(currentStory.created_at, currentStory.timeAgo);
    const displayedLikeCount =
        (currentStory.likes || 0) -
        (currentStory.isLiked ? 1 : 0) +
        (isLiked ? 1 : 0);

    const handleToggleLike = async (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
        const nextLiked = !isLiked;

        setIsLiked(nextLiked);
        try {
            await showcaseService.reactToStory(currentStory.id, nextLiked, companyId);
            onStoryUpdate?.({
                ...currentStory,
                isLiked: nextLiked,
                likes: Math.max(0, (currentStory.likes || 0) + (nextLiked ? 1 : -1)),
            });
        } catch (error) {
            console.error("Failed to react to story", error);
            setIsLiked(!nextLiked);
        }
    };

    const handleDeleteStory = async (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (!currentStory.isAuthor) return;

        if (!window.confirm("Are you sure you want to delete this story?")) {
            return;
        }

        try {
            const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
            await showcaseService.deleteStory(currentStory.id, companyId);
            onClose();
        } catch (error) {
            console.error("Failed to delete story", error);
            window.alert("Failed to delete story");
        }
    };

    return (
        <div
            className="w-full h-full relative flex-shrink-0 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
        >
            {/* Interaction Panel */}
            <StoryInteractionPanel
                isOpen={showInteraction}
                onClose={() => setShowInteraction(false)}
                story={{
                    ...currentStory,
                    likes: displayedLikeCount,
                    isLiked: isLiked
                }}
                isMyStory={isMyStory}
                isDark={!!isDark}
            />

            {/* Full-screen black background (letterbox padding) */}
            <div className="absolute inset-0 bg-transparent" />

            {/* 9:16 Story Frame — media is always contained within this box */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ pointerEvents: 'none' }}
            >
                <div
                    className="relative overflow-hidden bg-transparent w-[calc(100dvh*9/16)] h-[100dvh] md:w-[min(100vw,calc(100dvh*9/16))] md:h-[min(100dvh,calc(100vw*16/9))]"
                >

                    {/* Global Loader until media is ready */}
                    {!isMediaReady && (
                        <div className="absolute inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Header / Progress */}
                    <div className={`absolute top-0 left-0 right-0 z-20 pointer-events-none transition-opacity duration-200 ease-in ${isMediaReady ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
                        <div className="relative z-10 w-full">
                            <div
                                className="flex gap-1 px-1"
                                style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
                            >
                                {sortedStories.map((s, idx) => (
                                    <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-100 ease-linear"
                                            style={{
                                                width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-1 px-3 pb-1.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <img 
                                        src={uploaderAvatar} 
                                        alt={uploaderName}
                                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                                        onError={(e) => {
                                            e.currentTarget.src = "/assets/pngegg.png";
                                        }}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-white leading-tight truncate">
                                            {uploaderName}
                                        </span>
                                        {storyTimestamp && (
                                            <span className="text-xs font-normal text-white/80 leading-tight whitespace-nowrap">
                                                {storyTimestamp}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pointer-events-auto">
                                    {currentStory.media_type === "video" && (
                                        <button
                                            type="button"
                                            className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMuted((prev) => !prev);
                                            }}
                                            onTouchStart={(e) => e.stopPropagation()}
                                            onTouchEnd={(e) => e.stopPropagation()}
                                            aria-label={isMuted ? "Unmute story" : "Mute story"}
                                        >
                                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                    )}
                                    {currentStory.isAuthor && (
                                        <button
                                            type="button"
                                            className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center"
                                            onClick={handleDeleteStory}
                                            onTouchStart={(e) => e.stopPropagation()}
                                            onTouchEnd={(e) => e.stopPropagation()}
                                            aria-label="Delete story"
                                            title="Delete story"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClose();
                                        }}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onTouchEnd={(e) => e.stopPropagation()}
                                        aria-label="Close story"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {mediaLoadFailed && !isLayeredStory ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white z-10">
                            <p className="text-sm font-medium">Media unavailable</p>
                        </div>
                    ) : currentStory.media_type === 'video' && isActiveUser && !isLayeredStory ? (
                        /* Ready State - double buffered native video (no black transition) */
                        <div className="absolute inset-0 z-0">
                            {[0, 1].map((slot) => {
                                const slotKey = slot as 0 | 1;
                                const slotStoryId = videoSlotStories[slotKey];
                                const slotStory = slotStoryId ? storyById.get(slotStoryId) : undefined;
                                const slotSrc = videoSlotSrcs[slotKey];
                                const resolvedSrc =
                                    slotSrc || (slotKey === activeVideoSlot ? currentLegacySrc : "");
                                const safeResolvedSrc = isValidMediaUrl(resolvedSrc) ? resolvedSrc : "";
                                const posterSrc = getStoryPosterSrc(slotStory) || getStoryPosterSrc(currentStory);
                                const isSlotCurrentStory =
                                    slotStoryId === currentStory.id &&
                                    resolvedSrc === currentLegacySrc;
                                const isSlotActive = slotKey === activeVideoSlot;
                                const isActiveCurrentStorySlot = isSlotActive && isSlotCurrentStory;

                                const isReady = videoSlotReady[slotKey];

                                return (
                                    <div
                                        key={`legacy-slot-${slot}`}
                                        className={`absolute inset-0 w-full h-full transition-opacity duration-150 ${isSlotActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                                    >


                                        <video
                                            ref={slotKey === 0 ? videoSlotRef0 : videoSlotRef1}
                                            src={safeResolvedSrc || undefined}
                                            poster={posterSrc || undefined}
                                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in ${isReady ? "opacity-100" : "opacity-0"}`}
                                            playsInline
                                            preload="auto"
                                            muted={isMuted}
                                            autoPlay={isSlotActive && isActiveUser && !isPaused && !showInteraction && !isDescriptionExpanded}
                                            onCanPlay={() => markVideoSlotReady(slotKey, true)}
                                            onLoadedData={() => {
                                                markVideoSlotReady(slotKey, true);
                                                if (isActiveCurrentStorySlot) {
                                                    setMediaLoadFailed(false);
                                                }
                                            }}
                                            onEnded={isActiveCurrentStorySlot ? handleVideoCompleted : undefined}
                                            onTimeUpdate={isActiveCurrentStorySlot ? (e) => {
                                                const vid = e.currentTarget;
                                                const trim = metadata.trim;

                                                // End at trim boundary and progress to next story once.
                                                if (trim && vid.currentTime >= trim.end) {
                                                    vid.currentTime = trim.end;
                                                    vid.pause();
                                                    handleVideoCompleted();
                                                    return;
                                                }

                                                if (!isPaused && !showInteraction && vid.duration) {
                                                    const duration = trim ? (trim.end - trim.start) : vid.duration;
                                                    const current = trim ? (vid.currentTime - trim.start) : vid.currentTime;
                                                    const percent = Math.max(0, Math.min(100, (current / duration) * 100));
                                                    setProgress(percent);
                                                }
                                            } : undefined}
                                            onLoadedMetadata={isActiveCurrentStorySlot ? (e) => {
                                                const vid = e.currentTarget;
                                                videoEndTriggeredRef.current = false;
                                                if (metadata.trim) {
                                                    vid.currentTime = metadata.trim.start;
                                                }
                                            } : undefined}
                                            onError={(e) => {
                                                markVideoSlotReady(slotKey, true);
                                                if (isActiveCurrentStorySlot) {
                                                    setMediaLoadFailed(true);
                                                }
                                                console.error("Video Playback Error:", e.currentTarget.error);
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : hasValidCurrentImageSrc ? (
                        <>
                            {/* Snapshot-based: render the baked composite image directly */}
                            <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none bg-transparent">
                                <img
                                    src={currentImageSrc}
                                    alt={currentStory?.title || "Story"}
                                    className={`w-full h-full object-cover transition-opacity duration-300 ease-in ${isImageReady ? 'opacity-100' : 'opacity-0'}`}
                                    onLoad={() => setIsImageReady(true)}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        setMediaLoadFailed(true);
                                        setIsImageReady(true);
                                    }}
                                />
                            </div>
                        </>
                    ) : currentStory.story_metadata?.type === "job" ? (
                        currentStory.story_metadata?.backgroundStyle ? (
                            <div className="absolute inset-0 z-0">
                                <div className={`w-full h-full ${currentStory.story_metadata.backgroundStyle}`} />
                            </div>
                        ) : null
                    ) : null}

                    {/* Render Overlays based on Story Type */}
                    {(() => {
                        const metadata = currentStory.story_metadata;
                        const type = metadata?.type;
                        const scale = typeof metadata?.scale === "number"
                            ? metadata.scale
                            : type === "job"
                                ? 1.5
                                : 0.9;
                        const scaleStyle = { transform: `scale(${scale})` };

                        switch (type) {
                            case 'job':
                                return (
                                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto p-8">
                                        <div style={scaleStyle} className={metadata?.is_baked ? "opacity-0" : ""}>
                                            <JobStoryCard metadata={metadata as any} onAction={onClose} />
                                        </div>
                                    </div>
                                );
                            case 'post':
                            default:
                                if (currentStory.shared_post) {
                                    return (
                                        <div className={`absolute inset-0 flex items-center justify-center z-10 ${metadata?.is_baked ? "pointer-events-auto" : "pointer-events-none"} p-8`}>
                                            <div style={scaleStyle} className={`transition-transform duration-200 ${metadata?.is_baked ? "opacity-0" : ""}`}>
                                                <SharedPostCard sharedPost={currentStory.shared_post} />
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                        }
                    })()}

                    {/* Metadata Layers Overlay — rendered inside a fixed virtual canvas */}
                    {/* Only show layers if NOT using a pre-rendered final URL */}
                    {isLayeredStory && (
                        <div className={`absolute inset-0 transition-opacity duration-200 ease-in ${isVirtualLayerReady ? 'opacity-100' : 'opacity-0'}`}>
                            <VirtualLayerCanvas
                                layers={metadata.layers}
                                fallbackVideoUrl={currentStory.media_url}
                                isActive={isActiveUser && !isPaused && !showInteraction && !isDescriptionExpanded}
                                onVideoEnd={handleAutoNext}
                                onVideoProgress={setProgress}
                                background={metadata.background}
                                onReady={() => setIsVirtualLayerReady(true)}
                            />
                        </div>
                    )}

                    {!showInteraction && (
                        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ease-in ${isMediaReady ? 'opacity-100' : 'opacity-0'}`}>
                            {/* Description Overlay */}
                            {currentStory.description && (
                                <div
                                    className={`absolute transition-all duration-300 z-30 pointer-events-auto
                                    ${isDescriptionExpanded
                                            ? "left-4 right-4 bottom-4 bg-black/80 rounded-xl p-6 max-h-[50vh] overflow-y-auto"
                                            : "left-4 right-16 bottom-10"
                                        }
                                Fast
                                `}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsDescriptionExpanded(!isDescriptionExpanded);
                                    }}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                >
                                    <p className={`text-white text-sm leading-relaxed drop-shadow-md transition-opacity duration-300 ${isDescriptionExpanded ? 'opacity-100' : 'opacity-90'}`}>
                                        {isDescriptionExpanded ? (
                                            currentStory.description
                                        ) : (
                                            <>
                                                {(() => {
                                                    const limit = 100;
                                                    if (currentStory.description.length <= limit) return currentStory.description;
                                                    const truncated = currentStory.description.slice(0, limit);
                                                    const lastSpace = truncated.lastIndexOf(' ');
                                                    return truncated.slice(0, lastSpace > 0 ? lastSpace : limit);
                                                })()}
                                                {currentStory.description.length > 100 && (
                                                    <>
                                                        ... <span className="font-semibold underline ml-1 text-white/90">Read more</span>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </p>
                                </div>
                            )}

                            {!isDescriptionExpanded && (
                                <div className="absolute bottom-24 left-0 right-0 text-center pointer-events-none">
                                    <div className="flex flex-col items-center gap-1 opacity-60 animate-bounce">
                                        <p className="text-white text-xs font-medium drop-shadow-md">Swipe up for details</p>
                                    </div>
                                </div>
                            )}

                            {/* Like Button - Hidden for own stories */}
                            {!currentStory?.isAuthor && (
                                <div className="absolute right-4 bottom-6 z-30 pointer-events-auto">
                                    <button
                                        type="button"
                                        className="w-12 h-12 rounded-full bg-black/55 backdrop-blur text-white border border-white/35 flex items-center justify-center"
                                        onClick={handleToggleLike}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onTouchEnd={(e) => e.stopPropagation()}
                                        aria-label={isLiked ? "Unlike story" : "Like story"}
                                    >
                                        <Heart className={`w-5 h-5 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </div> {/* end 9:16 story frame */}
            </div> {/* end letterbox centering wrapper */}
        </div >
    )
}
