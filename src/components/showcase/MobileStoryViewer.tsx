import React, { useState, useEffect, useMemo, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { EmblaCarouselType } from "embla-carousel"
import { StoryDetail, StoryGroup } from "@/types/showcase"
import { UserStorySlide } from "./UserStorySlide"

type MobileStoryViewerProps = {
    groups: StoryGroup[]
    initialGroupId: string | number
    onClose: () => void
    isDark?: boolean
    onStoryUpdate?: (story: StoryDetail) => void
}

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
        duration: 20, // Faster duration for snappier feel
    })

    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    // Sync index on select
    const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
        // Avoid synchronous state update during render/effect cycle
        // Use functional state update to ensure we are working with fresh data if needed, but index is primitive
        setCurrentIndex(emblaApi.selectedScrollSnap())
    }, [])

    useEffect(() => {
        if (emblaApi) {
            emblaApi.scrollTo(initialIndex, true) // Instant jump
            emblaApi.on('select', onSelect)
        }
    }, [emblaApi, initialIndex, onSelect])

    const handleNextUser = useCallback(() => {
        if (emblaApi && emblaApi.canScrollNext()) {
            emblaApi.scrollNext()
        } else {
            onClose()
        }
    }, [emblaApi, onClose]);

    const handlePrevUser = useCallback(() => {
        if (emblaApi && emblaApi.canScrollPrev()) {
            emblaApi.scrollPrev()
        }
    }, [emblaApi]);


    // Optimistic Preloading / Virtualization:
    // Only render the slide content if it is the current slide, or immediate neighbors.
    // This allows the DOM to be lighter.
    const shouldRenderSlide = (idx: number) => {
        const distance = Math.abs(idx - currentIndex);
        return distance <= 1; // Render current, prev, and next
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <div className="h-full overflow-hidden" ref={emblaRef}>
                <div className="flex h-full touch-pan-y">
                    {validGroups.map((group, idx) => (
                        <div key={group.author.id} className="flex-[0_0_100%] min-w-0 relative h-full">
                            {/* Virtualization: Only keep heavy DOM elements for neighbors */}
                            {shouldRenderSlide(idx) ? (
                                <UserStorySlide
                                    group={group}
                                    isActiveUser={idx === currentIndex}
                                    onNextUser={handleNextUser}
                                    onPrevUser={handlePrevUser}
                                    onClose={onClose}
                                    isDark={isDark}
                                    onStoryUpdate={onStoryUpdate}
                                />
                            ) : (
                                /* Reduced placeholder for off-screen slides to maintain Embla layout */
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                    {/* Optional: Minimal loader or author avatar if we want to show something during fast scroll */}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
