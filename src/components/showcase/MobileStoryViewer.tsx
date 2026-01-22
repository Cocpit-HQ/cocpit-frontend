import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { X, MoreVertical, Heart, Trash2 } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { EmblaCarouselType } from "embla-carousel"
import { StoryDetail, StoryGroup } from "@/types/showcase"
import { StoryInteractionPanel } from "./StoryInteractionPanel"
import { showcaseService } from "@/services/showcase.service"

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
    const [likeKey, setLikeKey] = useState(0)
    const [showMenu, setShowMenu] = useState(false)

    // Use ref to track progress for interval logic (avoids Strict Mode double-invocation bug)
    const progressRef = useRef(0)

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

    // Auto-advance
    useEffect(() => {
        if (!isActiveUser || showInteraction || isPaused || isDescriptionExpanded) return
        if (!currentStory) return // Don't auto-advance if no current story

        const interval = setInterval(() => {
            // Check ref to avoid calling handleNext from updater (Strict Mode safe)
            if (progressRef.current >= 100) {
                handleNext()
            } else {
                setProgress(prev => prev + 1)
            }
        }, 50) // 5s per story

        return () => clearInterval(interval)
    }, [isActiveUser, showInteraction, storyIndex, isPaused, isDescriptionExpanded, currentStory])

    const handleNext = () => {
        // Safety check: ensure we have stories
        if (!sortedStories || sortedStories.length === 0) {
            onNextUser();
            return;
        }

        if (storyIndex < sortedStories.length - 1) {
            setStoryIndex(prev => prev + 1)
            setProgress(0)
        } else {
            // Defer to next tick to avoid state update during render
            setTimeout(() => onNextUser(), 0)
        }
    }

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
    const touchStartY = useRef<number | null>(null)
    const touchStartX = useRef<number | null>(null)

    const handleLongPress = () => {
        setIsPaused(true)
    }

    const handleRelease = () => {
        setIsPaused(false)
    }

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
            className="w-full h-full relative flex-shrink-0"
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
                        <div className="w-8 h-8 rounded-full border border-white/50 overflow-hidden">
                            <img src={group.author.avatar} alt={group.author.name} className="w-full h-full object-cover" />
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
            </div>

            {/* Content */}
            <div className="w-full h-full flex items-center justify-center bg-black">
                <img
                    src={currentStory.image}
                    alt={currentStory.title}
                    className="w-full h-full object-cover"
                />
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
                                className="absolute bottom-6 right-4 pointer-events-auto"
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
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
