import React from "react"
import { StandardEventCard } from "./StandardEventCard"
import type { EventCard } from "@/types/events"
import { ChevronRight } from "lucide-react"
import { useEvents } from "@/context/EventsContext"

interface EventSectionProps {
  title: string
  events: EventCard[]
  onEventClick: (id: number) => void
  onViewAll?: () => void
  className?: string
}

export function EventSection({ title, events, onEventClick, onViewAll, className }: EventSectionProps) {
  const { isRegistered, isSaved, saveEvent, unsaveEvent } = useEvents()
  if (events.length === 0) return null

  return (
    <div className={`py-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-3">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event) => (
            <StandardEventCard
              key={event.id}
              event={event}
              onClick={() => onEventClick(event.id)}
              isRegistered={isRegistered(event.id)}
              isSaved={isSaved(event.id)}
              onToggleSave={(e) => {
                e.stopPropagation();
                isSaved(event.id) ? unsaveEvent(event.id) : saveEvent(event.id);
              }}
            />
          ))}
      </div>
    </div>
  )
}

