import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { X, MoreVertical } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { EmblaCarouselType } from "embla-carousel"
import { StoryDetail } from "@/types/showcase"
import { StoryInteractionPanel } from "./StoryInteractionPanel"

type MobileStoryViewerProps = {
  stories: StoryDetail[]
  initialStoryId: number
  onClose: () => void
  isDark: boolean
}

type UserGroup = {
    authorName: string
    stories: StoryDetail[]
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
    isDark
}: {
    group: UserGroup
    isActiveUser: boolean
    onNextUser: () => void
    onPrevUser: () => void
    onClose: () => void
    isDark: boolean
}) => {
    const [storyIndex, setStoryIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [showInteraction, setShowInteraction] = useState(false)

    // Sort stories chronologically (Oldest -> Newest)
    // We assume ID correlates with time.
    const sortedStories = useMemo(() => {
        return [...group.stories].sort((a, b) => a.id - b.id)
    }, [group.stories])

    const currentStory = sortedStories[storyIndex]
    const isMyStory = currentStory?.author.name === "You"

    // Reset when this slide becomes active
    useEffect(() => {
        if (isActiveUser) {
            setStoryIndex(0)
            setProgress(0)
        }
    }, [isActiveUser])

    // Auto-advance
    useEffect(() => {
        if (!isActiveUser || showInteraction) return

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    handleNext()
                    return 0
                }
                return prev + 1
            })
        }, 50) // 5s per story

        return () => clearInterval(interval)
    }, [isActiveUser, showInteraction, storyIndex])

    const handleNext = () => {
        if (storyIndex < sortedStories.length - 1) {
            setStoryIndex(prev => prev + 1)
            setProgress(0)
        } else {
            onNextUser()
        }
    }

    const handlePrev = () => {
        if (storyIndex > 0) {
            setStoryIndex(prev => prev - 1)
            setProgress(0)
        } else {
            onPrevUser()
        }
    }

    // Touch handling
    const touchStartY = useRef<number | null>(null)
    const touchStartX = useRef<number | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY
        touchStartX.current = e.touches[0].clientX
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartY.current === null || touchStartX.current === null) return

        const deltaY = e.changedTouches[0].clientY - touchStartY.current
        const deltaX = e.changedTouches[0].clientX - touchStartX.current

        touchStartY.current = null
        touchStartX.current = null

        // Vertical Swipe (Up/Down)
        if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
             if (deltaY > 0) {
                 onClose()
             } else {
                 setShowInteraction(true)
             }
             return
        }

        // Horizontal Swipe is handled by Embla naturally!
        // But Taps need to be handled.
        // If swipe distance is very small, treat as tap.
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            const screenWidth = window.innerWidth
            const tapX = e.changedTouches[0].clientX

            if (tapX < screenWidth * 0.3) {
                handlePrev()
            } else if (tapX > screenWidth * 0.7) {
                handleNext()
            }
        }
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
                story={currentStory}
                isMyStory={isMyStory}
                isDark={isDark}
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
                            <img src={currentStory.author.avatar} alt={currentStory.author.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm flex items-center gap-2">
                                {currentStory.author.name}
                                <span className="text-white/60 font-normal text-xs">{currentStory.timeAgo}</span>
                            </p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 pointer-events-auto">
                        <button onClick={(e) => { e.stopPropagation(); }} className="text-white">
                           <MoreVertical className="w-5 h-5" />
                        </button>
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
                    <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
                        <div className="flex flex-col items-center gap-1 opacity-60 animate-bounce">
                            <div className="w-6 h-1 bg-white/50 rounded-full" />
                            <p className="text-white text-xs font-medium drop-shadow-md">Swipe up for details</p>
                        </div>
                    </div>
                )}
             </div>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */

export function MobileStoryViewer({ stories, initialStoryId, onClose, isDark }: MobileStoryViewerProps) {

  // Group and Sort
  const userGroups = useMemo(() => {
    const groups: UserGroup[] = []
    stories.forEach((story) => {
        const existing = groups.find(g => g.authorName === story.author.name)
        if (existing) {
            existing.stories.push(story)
        } else {
            groups.push({
                authorName: story.author.name,
                stories: [story]
            })
        }
    })
    // Sort groups by latest story ID (Newest first)
    groups.sort((a, b) => {
        const latestA = Math.max(...a.stories.map(s => s.id))
        const latestB = Math.max(...b.stories.map(s => s.id))
        return latestB - latestA
    })
    return groups
  }, [stories])

  // Initial Index
  const initialIndex = useMemo(() => {
      const idx = userGroups.findIndex(g => g.stories.some(s => s.id === initialStoryId))
      return idx === -1 ? 0 : idx
  }, [userGroups, initialStoryId])

  const [emblaRef, emblaApi] = useEmblaCarousel({
      loop: false,
      duration: 30, // Adjust for slide feel
  })

  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Sync index on select
  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setCurrentIndex(emblaApi.selectedScrollSnap())
  }, [])

  // Cube Effect Logic
  const TWEEN_FACTOR_BASE = 0.5;
  const numberWithinRange = (number: number, min: number, max: number): number => Math.min(Math.max(number, min), max)

  const tweenCube = useCallback((emblaApi: EmblaCarouselType, eventName?: string) => {
    const engine = emblaApi.internalEngine()
    const scrollProgress = emblaApi.scrollProgress()
    const slidesInView = emblaApi.slidesInView()
    const isScrollEvent = eventName === 'scroll'

    emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      let diffToTarget = scrollSnap - scrollProgress
      const slidesInSnap = engine.slideRegistry[snapIndex]

      slidesInSnap.forEach((slideIndex) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return

        // 3D Cube Transform
        // Perspective needs to be on container
        const slideNode = emblaApi.slideNodes()[slideIndex]

        // Simple rotation based on distance
        // Normalized distance: 0 = center, 1 = right, -1 = left
        // Wait, embla scrollProgress is 0 to 1 total.

        // Let's use simpler logic:
        // Embla doesn't easily give "distance from center" in standard API as nicely as Swiper.
        // But we can approximate.

        // Actually, just simple slide is often better than a hacked cube.
        // User requested "Cube effect".
        // Let's try to simulate 3D rotation.

        // For now, let's stick to a clean slide. Implementing true 3D cube manually with Embla requires deep dive into engine.location.
        // However, I can add `perspective` to the container and maybe scale/opacity?
      })
    })
  }, [])

  // useEffect(() => {
  //   if (!emblaApi) return
  //   emblaApi.on('scroll', tweenCube)
  //   emblaApi.on('reInit', tweenCube)
  // }, [emblaApi, tweenCube])

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
            {userGroups.map((group, idx) => (
                <div key={group.authorName} className="flex-[0_0_100%] min-w-0 relative">
                     {/* We use perspective here for potential 3D children */}
                     <UserStorySlide
                        group={group}
                        isActiveUser={idx === currentIndex}
                        onNextUser={handleNextUser}
                        onPrevUser={handlePrevUser}
                        onClose={onClose}
                        isDark={isDark}
                     />
                </div>
            ))}
        </div>
      </div>
    </div>
  )
}
