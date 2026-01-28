import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { X, MoreVertical, Heart, Trash2, Volume2, VolumeX } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { EmblaCarouselType } from "embla-carousel"
import { StoryDetail, StoryGroup } from "@/types/showcase"
import { StoryInteractionPanel } from "./StoryInteractionPanel"
import { showcaseService } from "@/services/showcase.service"
import { SharedPostCard } from "./SharedPostCard"
import { StoryMetadata, StoryLayer } from "@/types/story-editor"
// import dynamic from "next/dynamic";
// const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

type MobileStoryViewerProps = {
    groups: StoryGroup[]
    initialGroupId: number
    onClose: () => void
    isDark?: boolean
    onStoryUpdate?: (story: StoryDetail) => void
}

/* -------------------------------------------------------------------------- */
/*                               Internal Components                          */
/* -------------------------------------------------------------------------- */

const ViewerLayerItem = ({ layer, isActive, onVideoEnd, fallbackVideoUrl, onVideoProgress }: {
    layer: StoryLayer;
    isActive: boolean;
    onVideoEnd?: () => void;
    fallbackVideoUrl?: string;
    onVideoProgress?: (progress: number) => void;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hasTriggeredEnd = useRef(false);

    // Handle video layer trim logic
    useEffect(() => {
        if (layer.type === 'video' && videoRef.current && isActive) {
            const vid = videoRef.current;
            hasTriggeredEnd.current = false; // Reset on new video

            // Start at trim start
            if (layer.trim) {
                vid.currentTime = layer.trim.start;
            }

            // Wait for video to be ready before playing
            const playVideo = () => {
                if (vid.readyState >= 2) { // HAVE_CURRENT_DATA or better
                    vid.play().catch(err => {
                        // Ignore AbortError (happens when video is interrupted by new load)
                        if (err.name !== 'AbortError') {
                            console.error('Video play failed:', err);
                        }
                    });
                } else {
                    // Wait for loadeddata event
                    vid.addEventListener('loadeddata', () => {
                        vid.play().catch(err => {
                            if (err.name !== 'AbortError') {
                                console.error('Video play failed:', err);
                            }
                        });
                    }, { once: true });
                }
            };

            playVideo();
        }
    }, [layer, isActive]);

    // Determine video source (fallback to Cloudinary URL if blob)
    const getVideoSrc = () => {
        if (layer.type === 'video') {
            // If src is a blob URL, use fallback
            if (layer.src.startsWith('blob:')) {
                return fallbackVideoUrl || layer.src;
            }
            return layer.src;
        }
        return '';
    };

    return (
        <div
            className="absolute origin-center pointer-events-none"
            style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: layer.type === 'text' ? 'auto' : `${layer.width}%`,
                height: layer.type === 'text' ? 'auto' : `${layer.height}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
                zIndex: layer.zIndex + 10, // Ensure above background
            }}
        >
            {layer.type === 'text' ? (
                <p style={{
                    color: layer.style.color,
                    fontSize: `${layer.style.fontSize}px`, // This might need viewport scaling adjustment
                    fontWeight: layer.style.fontWeight,
                    fontFamily: layer.style.fontFamily,
                    textAlign: layer.style.textAlign,
                    whiteSpace: 'nowrap',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    padding: '4px'
                }}>
                    {layer.content}
                </p>
            ) : layer.type === 'sticker' ? (
                <img src={layer.src} className="w-full h-full object-contain" />
            ) : layer.type === 'image' ? (
                /* Image Layer - movable/scalable */
                <img src={layer.src} className="w-full h-full object-contain pointer-events-none" />
            ) : layer.type === 'video' ? (
                <video
                    ref={videoRef}
                    src={getVideoSrc()}
                    className="w-full h-full object-contain pointer-events-none"
                    muted={layer.isMuted}
                    playsInline
                    onTimeUpdate={(e) => {
                        const vid = e.currentTarget;
                        if (layer.trim) {
                            const trimDuration = layer.trim.end - layer.trim.start;
                            const currentTime = vid.currentTime - layer.trim.start;

                            // Update progress
                            if (onVideoProgress && trimDuration > 0) {
                                const percent = Math.min(100, (currentTime / trimDuration) * 100);
                                onVideoProgress(percent);
                            }

                            // Check if we've reached the end of trim
                            if (vid.currentTime >= layer.trim.end && !hasTriggeredEnd.current) {
                                hasTriggeredEnd.current = true;
                                vid.pause();
                                if (onVideoEnd) onVideoEnd();
                            }
                        } else {
                            // No trim, use full duration
                            if (onVideoProgress && vid.duration) {
                                const percent = (vid.currentTime / vid.duration) * 100;
                                onVideoProgress(percent);
                            }
                        }
                    }}
                    onEnded={(e) => {
                        // Natural end (no trim)
                        if (!layer.trim && !hasTriggeredEnd.current) {
                            hasTriggeredEnd.current = true;
                            if (onVideoEnd) onVideoEnd();
                        }
                    }}
                />
            ) : null}
        </div>
    );
};

// Individual User Story Viewer
const UserStorySlide = ({
    group,
    isActiveUser,
    onNextUser,
    onPrevUser,
    onClose,
    isDark,
    onStoryUpdate
}: {
    group: StoryGroup
    isActiveUser: boolean
    onNextUser: () => void
    onPrevUser: () => void
    onClose: () => void
    isDark?: boolean
    onStoryUpdate?: (story: StoryDetail) => void
}) => {
    const [storyIndex, setStoryIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [showInteraction, setShowInteraction] = useState(false)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [likeKey, setLikeKey] = useState(0)
    const [showMenu, setShowMenu] = useState(false)

    // Use ref to track progress for interval logic (avoids Strict Mode double-invocation bug)
    const progressRef = useRef(0)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Stories are already sorted by backend (Oldest -> Newest)
    // Deduplicate stories to prevent "same key" errors
    const sortedStories = useMemo(() => {
        const stories = group.stories || [];
        const unique = new Map();
        stories.forEach(s => unique.set(s.id, s));
        return Array.from(unique.values());
    }, [group.stories]);

    // Ensure storyIndex is within bounds
    const safeStoryIndex = Math.min(storyIndex, sortedStories.length - 1);
    const currentStory = sortedStories[safeStoryIndex >= 0 ? safeStoryIndex : 0]
    const isMyStory = group.is_current_user

    // Initialize isLiked state - must be after all other useState hooks
    const [isLiked, setIsLiked] = useState(!!currentStory?.isLiked)

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

    // Track if this is the first time becoming active
    const wasActiveRef = useRef(false)

    // Reset when this slide becomes active (only on transition to active, not on story updates)
    useEffect(() => {
        if (isActiveUser && !wasActiveRef.current) {
            // Just became active
            wasActiveRef.current = true
            if (sortedStories.length > 0) {
                setStoryIndex(0)
                setProgress(0)
                const firstStory = sortedStories[0];
                setIsLiked(!!firstStory?.isLiked)
                setLikeKey(0)
                setIsDescriptionExpanded(false)
            }
        } else if (!isActiveUser) {
            // Became inactive
            wasActiveRef.current = false
        }
    }, [isActiveUser])

    // Reset like/description when story changes
    useEffect(() => {
        setIsLiked(!!currentStory?.isLiked) // Update with current story state
        setLikeKey(0)
        setIsDescriptionExpanded(false)
    }, [storyIndex]) // Only reset when story index changes, not when like state changes

    // Sync progressRef with progress state
    useEffect(() => {
        progressRef.current = progress
    }, [progress])

    // Poll for status if processing
    useEffect(() => {
        if (!isActiveUser || currentStory.media_type !== 'video' || currentStory.media_status !== 'processing') return;

        const pollInterval = setInterval(async () => {
            // Optional: You could fetch just the status here if you had a lightweight endpoint
            // For now we trust the onStoryUpdate prop or just auto-retry playback

            // Simplest approach: Just try to reload the video or check status if we have an endpoint
            // Since we rely on global updates, we might just show "Processing" and hope socket/refetch updates it
            // BUT user asked for polling safeguards
            // console.log("Polling story status...", currentStory.id);
        }, 5000);

        // Auto-stop after 60s
        const timeout = setTimeout(() => {
            clearInterval(pollInterval);
        }, 60000);

        return () => {
            clearInterval(pollInterval);
            clearTimeout(timeout);
        }
    }, [isActiveUser, currentStory.media_type, currentStory.media_status, currentStory.id]);

    const isNavigatingRef = useRef(false)

    // Reset navigation lock when active user changes or story index changes
    useEffect(() => {
        if (isActiveUser) {
            isNavigatingRef.current = false
        }
    }, [isActiveUser, storyIndex])

    const handleNext = useCallback(() => {
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
            isNavigatingRef.current = true; // Will be reset by useEffect when storyIndex changes
            setStoryIndex(prev => prev + 1)
            setProgress(0)
        } else {
            isNavigatingRef.current = true;
            // Defer to next tick to avoid state update during render
            setTimeout(() => onNextUser(), 0)
        }
    }, [sortedStories, storyIndex, onNextUser])

    // Control Video Playback based on Interaction State
    useEffect(() => {
        if (currentStory.media_type !== 'video' || !videoRef.current) return;

        const shouldPlay = isActiveUser && !isPaused && !showInteraction && !isDescriptionExpanded;

        if (shouldPlay) {
            videoRef.current.play().catch(e => {
                // Ignore AbortError if we pause immediately after
                if (e.name !== 'AbortError') console.warn("Play failed", e);
            });
        } else {
            videoRef.current.pause();
        }
    }, [isActiveUser, isPaused, showInteraction, isDescriptionExpanded, currentStory.media_type, storyIndex]); // storyIndex dependency ensures we re-evaluate on slide change

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

    // Trigger next story when progress reaches 100
    useEffect(() => {
        if (progress >= 100) {
            handleNext();
        }
    }, [progress, handleNext]);

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
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
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
    }

    // Guard clause AFTER all hooks - check if we have no stories at all
    // Don't check currentStory directly as it might be temporarily undefined during transitions
    if (sortedStories.length === 0) {
        return null;
    }

    // If currentStory is still undefined after bounds checking, something is wrong
    if (!currentStory) {
        console.error('UserStorySlide: currentStory is undefined despite having stories', {
            storyIndex,
            safeStoryIndex,
            storiesLength: sortedStories.length
        });
        return null;
    }

    return (
        <div
            className="w-full h-full relative flex-shrink-0 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Interaction Panel */}
            <StoryInteractionPanel
                isOpen={showInteraction}
                onClose={() => setShowInteraction(false)}
                story={{
                    ...currentStory,
                    likes: (currentStory.likes || 0) - (currentStory.isLiked ? 1 : 0) + (isLiked ? 1 : 0),
                    isLiked: isLiked
                }}
                isMyStory={isMyStory}
                isDark={!!isDark}
            />

            {/* Header / Progress */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <div className="flex gap-1 mb-3">
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

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-white/50 overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            {group.author.avatar ? (
                                <img
                                    src={group.author.avatar}
                                    alt={group.author.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Hide image on error and show initials instead
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : null}
                            {!group.author.avatar && (
                                <span className="text-white font-bold text-xs">
                                    {group.author.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm flex items-center gap-2">
                                {group.author.name}
                                <span className="text-white/60 font-normal text-xs">{currentStory.timeAgo}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pointer-events-auto">
                        {isMyStory && (
                            <div className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }} onTouchEnd={(e) => e.stopPropagation()} className="text-white">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm("Delete this story?")) {
                                                    await showcaseService.deleteStory(currentStory.id);
                                                    onClose();
                                                    window.location.reload();
                                                }
                                            }}
                                            onTouchEnd={(e) => e.stopPropagation()}
                                            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Story
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Mute Toggle (Bottom Right or Custom Location, checking Video Type) */}
                {currentStory.media_type === 'video' && isActiveUser && (
                    <div className="absolute top-28 right-4 z-30 pointer-events-auto">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                            }}
                            onTouchEnd={(e) => e.stopPropagation()}
                            className="bg-black/40 p-2 rounded-full backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
                        >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="w-full h-full flex items-center justify-center bg-black relative">

                {/* Shared Post Overlay */}
                {currentStory.shared_post && (
                    <div className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none p-8 ${currentStory.story_metadata?.backgroundStyle || ''}`}>
                        {/* Fallback Background if no style but also no media (text mode) */}
                        {!currentStory.media_url && !currentStory.story_metadata?.backgroundStyle && (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-[-1]" />
                        )}

                        <div style={{ transform: `scale(${currentStory.story_metadata?.scale || 0.9})` }} className="transition-transform duration-200">
                            <SharedPostCard sharedPost={currentStory.shared_post} />
                        </div>
                    </div>
                )}

                {/* 1. Video Player (HLS) */}
                {/* Only render if there's no video layer in metadata (legacy support) */}
                {currentStory.media_type === 'video' && isActiveUser && !metadata.layers?.some(l => l.type === 'video') ? (
                    currentStory.media_status === 'processing' ? (
                        /* Processing State */
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
                            <img src={currentStory.thumbnail_url || currentStory.image} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" />
                            <div className="z-20 flex flex-col items-center">
                                <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
                                <span className="text-white font-medium text-sm">Processing Video...</span>
                            </div>
                        </div>
                    ) : currentStory.media_status === 'failed' ? (
                        /* Failed State */
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                            <p>Video failed to load</p>
                        </div>
                    ) : (
                        /* Ready State - Native Video (Safer & Faster) */
                        <video
                            ref={videoRef}
                            src={(() => {
                                let url = currentStory.media_url;
                                // Force MP4 for Cloudinary to ensure Chrome compatibility (fixes .mov black screen)
                                if (url && url.includes('cloudinary') && !url.endsWith('.mp4')) {
                                    // Replace extension with .mp4
                                    url = url.replace(/\.[^/.]+$/, ".mp4");
                                }
                                return url;
                            })()}
                            className="w-full h-full object-contain"
                            playsInline
                            autoPlay
                            muted={isMuted}
                            onEnded={handleNext}
                            // Video Trim Logic
                            onTimeUpdate={(e) => {
                                const vid = e.currentTarget;
                                const trim = metadata.trim;

                                // Enforce Trim Loop
                                if (trim && vid.currentTime >= trim.end) {
                                    vid.currentTime = trim.start;
                                    // If we just looped, we don't want to finish the story yet unless it was a natural end, 
                                    // but usually stories just play once. 
                                    // With trim, maybe we want to loop the trim section?
                                    // Standard story behavior: play trim section ONCE then next?
                                    // Or loop trim section until timeout?
                                    // Usually stories play for 15s or video duration.
                                    // Let's assume play ONCE then handleNext.
                                    handleNext();
                                }

                                if (!isPaused && !showInteraction) {
                                    if (vid.duration) {
                                        // Progress based on trimmed duration if exists? Or full duration?
                                        // Usually progress bar reflects TIME ELAPSED relative to DISPLAY DURATION.
                                        // Simplified: Use actual video time.
                                        const duration = trim ? (trim.end - trim.start) : vid.duration;
                                        const current = trim ? (vid.currentTime - trim.start) : vid.currentTime;
                                        const percent = Math.max(0, Math.min(100, (current / duration) * 100));
                                        setProgress(percent);
                                    }
                                }
                            }}
                            onLoadedMetadata={(e) => {
                                const vid = e.currentTarget;
                                if (metadata.trim) {
                                    vid.currentTime = metadata.trim.start;
                                }
                            }}
                            onError={(e) => console.error("Video Playback Error:", e.currentTarget.error)}
                        />
                    )
                ) : currentStory.image ? (
                    <>
                        {/* 2. Image Render (Standard - Instagram Style) */}
                        {/* Background: Blurred Cover */}
                        {/* Background: Custom or Blurred Cover */}
                        <div
                            className={`absolute inset-0 z-0 overflow-hidden ${(metadata.background?.startsWith('bg-') || metadata.background?.startsWith('from-')) ? metadata.background : 'bg-black'}`}
                            style={(!metadata.background?.startsWith('bg-') && !metadata.background?.startsWith('from-')) ? { background: metadata.background } : {}}
                        >
                            {!metadata.background && (
                                <>
                                    <img
                                        src={currentStory.image}
                                        alt=""
                                        className="w-full h-full object-cover blur-2xl scale-110 opacity-50"
                                    />
                                    <div className="absolute inset-0 bg-black/30" />
                                </>
                            )}
                        </div>

                        {/* Foreground: Contained Image (Only if NO Image Layers exist in metadata) */}
                        {!metadata.layers?.some(l => l.type === 'image') && (
                            <div className="relative z-1 w-full h-full flex items-center justify-center">
                                <img
                                    src={currentStory.image}
                                    alt={currentStory.title}
                                    className="w-full h-full object-contain drop-shadow-2xl"
                                />
                            </div>
                        )}
                    </>
                ) : null}

                {/* Metadata Layers Overlay (Text/Stickers/Images/Videos) */}
                {metadata.layers?.map(layer => (
                    <ViewerLayerItem
                        key={layer.id}
                        layer={layer}
                        isActive={isActiveUser}
                        onVideoEnd={layer.type === 'video' ? handleNext : undefined}
                        fallbackVideoUrl={currentStory.media_url}
                        onVideoProgress={layer.type === 'video' ? setProgress : undefined}
                    />
                ))}

                {!showInteraction && (
                    <>
                        {/* Description Overlay */}
                        {currentStory.description && (
                            <div
                                className={`absolute transition-all duration-300 z-30 pointer-events-auto
                                    ${isDescriptionExpanded
                                        ? "left-4 right-4 bottom-4 bg-black/80 rounded-xl p-6 max-h-[50vh] overflow-y-auto"
                                        : "left-4 right-16 bottom-10"
                                    }
                                `}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    // Toggle expansion
                                    setIsDescriptionExpanded(!isDescriptionExpanded)
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
                                                // Truncate at the last space before the limit
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
                                    <div className="w-6 h-1 bg-white/50 rounded-full" />
                                    <p className="text-white text-xs font-medium drop-shadow-md">Swipe up for details</p>
                                </div>
                            </div>
                        )}

                        {/* Like Button (Only for others) */}
                        {!isMyStory && (
                            <div
                                className="absolute bottom-6 right-4 pointer-events-auto z-50"
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const newLikedState = !isLiked
                                        setIsLiked(newLikedState)
                                        setLikeKey(prev => prev + 1)

                                        // Update parent
                                        const baseCount = (currentStory.likes || 0) - (currentStory.isLiked ? 1 : 0);
                                        const newCount = baseCount + (newLikedState ? 1 : 0);

                                        if (onStoryUpdate) {
                                            onStoryUpdate({
                                                ...currentStory,
                                                isLiked: newLikedState,
                                                likes: newCount
                                            })
                                        }

                                        showcaseService.reactToStory(currentStory.id, newLikedState).catch(err => {
                                            console.error("Failed to react to story", err)
                                            setIsLiked(!newLikedState) // Revert on error
                                        })
                                    }}
                                    className="p-3 rounded-full active:scale-95 transition-transform"
                                >
                                    <Heart
                                        key={likeKey}
                                        className={`w-8 h-8 ${isLiked ? "fill-red-500 text-red-500" : "text-white"} ${likeKey > 0 ? 'animate-wiggle' : ''}`}
                                    />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    )
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export function MobileStoryViewer({ groups, initialGroupId, onClose, isDark, onStoryUpdate }: MobileStoryViewerProps) {

    // Filter out groups with no stories (e.g. empty "Your Story" placeholder)
    const validGroups = useMemo(() => {
        return groups.filter(g => g.stories.length > 0);
    }, [groups]);

    // Initial Index
    const initialIndex = useMemo(() => {
        const idx = validGroups.findIndex(g => g.author.id === initialGroupId)
        return idx === -1 ? 0 : idx
    }, [validGroups, initialGroupId])

    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        duration: 30, // Adjust for slide feel
    })

    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    // Sync index on select
    const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
        // Avoid synchronous state update during render/effect cycle
        requestAnimationFrame(() => {
            setCurrentIndex(emblaApi.selectedScrollSnap())
        })
    }, [])

    useEffect(() => {
        if (emblaApi) {
            emblaApi.scrollTo(initialIndex, true) // Instant jump
            emblaApi.on('select', onSelect)
        }
    }, [emblaApi, initialIndex, onSelect])

    const handleNextUser = () => {
        if (emblaApi && emblaApi.canScrollNext()) {
            emblaApi.scrollNext()
        } else {
            onClose()
        }
    }

    const handlePrevUser = () => {
        if (emblaApi && emblaApi.canScrollPrev()) {
            emblaApi.scrollPrev()
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <div className="h-full overflow-hidden" ref={emblaRef}>
                <div className="flex h-full touch-pan-y">
                    {validGroups.map((group, idx) => (
                        <div key={group.author.id} className="flex-[0_0_100%] min-w-0 relative">
                            {/* We use perspective here for potential 3D children */}
                            <UserStorySlide
                                group={group}
                                isActiveUser={idx === currentIndex}
                                onNextUser={handleNextUser}
                                onPrevUser={handlePrevUser}
                                onClose={onClose}
                                isDark={isDark}
                                onStoryUpdate={onStoryUpdate}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
