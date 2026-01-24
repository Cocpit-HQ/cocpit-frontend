import React, { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { HeroEventCard } from "./HeroEventCard"
import type { EventCard } from "@/types/event"

interface HeroCarouselProps {
  events: EventCard[]
  onEventClick: (id: number | string) => void
}

export function HeroCarousel({ events, onEventClick }: HeroCarouselProps) {
  // --- Mobile Carousel Logic ---
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    containScroll: "trimSnaps",
    skipSnaps: false,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

  // Update selected index on scroll
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  // Handle click: Center if side card, Navigate if center card
  const handleCardClick = useCallback((index: number, eventId: number | string) => {
    if (!emblaApi) return

    if (index === selectedIndex) {
      // It's the center card -> Navigate
      onEventClick(eventId)
    } else {
      // It's a side card -> Scroll to it
      emblaApi.scrollTo(index)
    }
  }, [emblaApi, selectedIndex, onEventClick])

  return (
    <>
      {/* Mobile View: Centered Carousel with Peek & Two-Step Click */}
      <div className="relative md:hidden -mx-4">
        <div className="overflow-hidden px-4 py-8" ref={emblaRef}>
          <div className="flex touch-pan-y gap-4">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="flex-[0_0_75%] min-w-0 pl-2 first:pl-4 last:pr-4"
              >
                <HeroEventCard
                  event={event}
                  isActive={index === selectedIndex}
                  onClick={() => handleCardClick(index, event.id)}
                  className={index === selectedIndex ? 'shadow-2xl' : ''}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop View: Standard Horizontal Row/Grid */}
      <div className="hidden md:flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
        {events.map((event) => (
          <HeroEventCard
            key={event.id}
            event={event}
            onClick={() => onEventClick(event.id)}
            isActive={true} // Always active on desktop
            className="w-[340px]"
          />
        ))}
      </div>
    </>
  )
}
