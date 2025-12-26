import React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { StandardEventCard } from "./StandardEventCard"
import type { EventCard } from "@/types/events"
import { ChevronRight } from "lucide-react"

interface EventSectionProps {
  title: string
  events: EventCard[]
  onEventClick: (id: number) => void
  onViewAll?: () => void
}

export function EventSection({ title, events, onEventClick, onViewAll }: EventSectionProps) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true // Allow free scrolling for lists
  })

  if (events.length === 0) return null

  return (
    <div className="py-4">
      <div className="flex items-center justify-between px-4 md:px-0 mb-3">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {onViewAll && (
            <button
                onClick={onViewAll}
                className="flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
                View All <ChevronRight className="w-4 h-4" />
            </button>
        )}
      </div>

      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y gap-4 pl-4 md:pl-0 pb-4">
            {events.map((event) => (
              <StandardEventCard
                key={event.id}
                event={event}
                onClick={() => onEventClick(event.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
