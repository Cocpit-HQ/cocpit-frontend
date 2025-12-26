import React from "react"
import { MapPin, Calendar } from "lucide-react"
import type { EventCard } from "@/types/events"

interface StandardEventCardProps {
  event: EventCard
  onClick: () => void
  className?: string
}

export function StandardEventCard({ event, onClick, className = "" }: StandardEventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('default', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      onClick={onClick}
      className={`flex-shrink-0 w-[240px] md:w-[260px] bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-md group ${className}`}
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-white">
            {event.category}
        </div>
      </div>

      <div className="p-3">
        <h4 className="font-semibold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {event.title}
        </h4>

        <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-primary" />
                <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="line-clamp-1">{event.location}</span>
            </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
             <span className="font-medium text-foreground">
                {event.priceType === 'Paid' ? `$${event.price}` : 'Free'}
             </span>
             <span className="text-muted-foreground">
                {event.attendees} going
             </span>
        </div>
      </div>
    </div>
  )
}
