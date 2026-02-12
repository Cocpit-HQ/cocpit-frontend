import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { MoreVertical, Heart, Trash2, Volume2, VolumeX, X } from "lucide-react"
import { StoryDetail, StoryGroup } from "@/types/showcase"
import { StoryInteractionPanel } from "./StoryInteractionPanel"
import { showcaseService } from "@/services/showcase.service"
import { SharedPostCard } from "./SharedPostCard"
import { StoryMetadata } from "@/types/story-editor"
import { ViewerLayerItem } from "./ViewerLayerItem"
import { useActiveProfile } from "@/context/ActiveProfileContext"

type UserStorySlideProps = {
    group: StoryGroup
    isActiveUser: boolean
    onNextUser: () => void
    onPrevUser: () => void
    onClose: () => void
    isDark?: boolean
    onStoryUpdate?: (story: StoryDetail) => void
}

// Individual User Story Viewer
export const UserStorySlide = ({
    group,
    isActiveUser,
    onNextUser,
    onPrevUser,
    onClose,
    isDark,
    onStoryUpdate
}: UserStorySlideProps) => {
    const [storyIndex, setStoryIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [showInteraction, setShowInteraction] = useState(false)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [likeKey, setLikeKey] = useState(0)
    const [showMenu, setShowMenu] = useState(false)
    const { activeProfile } = useActiveProfile();

    // Use ref to track progress for interval logic (avoids Strict Mode double-invocation bug)
    const progressRef = useRef(0)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Stories are already sorted by backend (Oldest -> Newest)
    // Deduplicate stories to prevent "same key" errors
    const sortedStories = useMemo(() => {
        if (!group?.stories) return [];
        const stories = group.stories || [];
        const unique = new Map();
        stories.forEach(s => unique.set(s.id, s));
        return Array.from(unique.values());
    }, [group?.stories]);

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
    }, [isActiveUser]) // eslint-disable-line react-hooks/exhaustive-deps

    // Reset like/description when story changes
    useEffect(() => {
        setIsLiked(!!currentStory?.isLiked) // Update with current story state
        setLikeKey(0)
        setIsDescriptionExpanded(false)

        // Record View
        if (isActiveUser && currentStory && !currentStory.isAuthor) {
            const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
            showcaseService.viewStory(currentStory.id, companyId).catch(err => console.error("View story failed", err));
        }
    }, [storyIndex, currentStory?.isLiked, isActiveUser, activeProfile]) // Only reset when story index changes

    // Sync progressRef with progress state
    useEffect(() => {
        progressRef.current = progress
    }, [progress])

    // Poll for status if processing
    useEffect(() => {
        if (!isActiveUser || !currentStory || currentStory.media_type !== 'video' || currentStory.media_status !== 'processing') return;

        const pollInterval = setInterval(async () => {
            // Optional: You could fetch just the status here if you had a lightweight endpoint
            // For now we trust the onStoryUpdate prop or just auto-retry playback
        }, 5000);

        // Auto-stop after 60s
        const timeout = setTimeout(() => {
            clearInterval(pollInterval);
        }, 60000);

        return () => {
            clearInterval(pollInterval);
            clearTimeout(timeout);
        }
    }, [isActiveUser, currentStory]);

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
        if (!currentStory || currentStory.media_type !== 'video' || !videoRef.current) return;

        const shouldPlay = isActiveUser && !isPaused && !showInteraction && !isDescriptionExpanded;

        if (shouldPlay) {
            videoRef.current.play().catch(e => {
                // Ignore AbortError if we pause immediately after
                if (e.name !== 'AbortError') console.warn("Play failed", e);
            });
        } else {
            videoRef.current.pause();
        }
    }, [isActiveUser, isPaused, showInteraction, isDescriptionExpanded, currentStory, storyIndex]);

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
                            <img src={currentStory.thumbnail_url || currentStory.image} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" alt="thumbnail" />
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
                                    handleNext();
                                }

                                if (!isPaused && !showInteraction) {
                                    if (vid.duration) {
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

                                        const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
                                        showcaseService.reactToStory(currentStory.id, newLikedState, companyId).catch(err => {
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
