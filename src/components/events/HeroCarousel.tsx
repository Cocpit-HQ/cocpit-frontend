import React, { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { HeroEventCard } from "./HeroEventCard"
import type { EventCard } from "@/types/events"

interface HeroCarouselProps {
  events: EventCard[]
  onEventClick: (id: number) => void
}

export function HeroCarousel({ events, onEventClick }: HeroCarouselProps) {
  // Mobile: 1 slide, Desktop: auto width (will look like a strip if needed, but here we want hero feel)
  // For "Suggested for You", we might want a single large card or a peekaboo effect.
  // Let's stick to 'align: start' with some gap.
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: false, // Snap to slide
  })

  const [isPlaying, setIsPlaying] = useState(true)

  // Auto-scroll logic (Mobile mostly, but works everywhere)
  const autoplay = useCallback(() => {
    if (!emblaApi) return
    if (isPlaying) {
      emblaApi.scrollNext()
    }
  }, [emblaApi, isPlaying])

  useEffect(() => {
    if (!emblaApi) return

    // Check if mobile (simplistic check, can be improved with media query hook if needed)
    // The requirement says "mobile view... automatically scrolled".
    // We'll apply it generally for now, or we can check window width.
    const interval = setInterval(autoplay, 3000) // 3 seconds per slide

    // Pause on interaction
    const onPointerDown = () => setIsPlaying(false)
    const onPointerUp = () => setIsPlaying(true)

    emblaApi.on("pointerDown", onPointerDown)
    emblaApi.on("pointerUp", onPointerUp)

    return () => {
      clearInterval(interval)
      if (emblaApi) {
        emblaApi.off("pointerDown", onPointerDown)
        emblaApi.off("pointerUp", onPointerUp)
      }
    }
  }, [emblaApi, autoplay])

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y gap-4 md:gap-6 pl-4 md:pl-0 py-4">
          {events.map((event) => (
            <HeroEventCard
              key={event.id}
              event={event}
              onClick={() => onEventClick(event.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
