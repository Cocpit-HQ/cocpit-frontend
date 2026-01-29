import React from "react"
import Image from "next/image"
import { MapPin, Calendar, Users } from "lucide-react"
import type { EventCard } from "@/types/event"

interface HeroEventCardProps {
  event: EventCard
  onClick: () => void
  className?: string
  isActive?: boolean
  priority?: boolean // Added priority prop
}

export function HeroEventCard({ event, onClick, className = "", isActive = true, priority = false }: HeroEventCardProps) {
  // Format date nicely (e.g., "Dec 25")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('default', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative flex-shrink-0
        w-full md:w-[340px]
        h-[360px] md:h-[480px]
        rounded-2xl overflow-hidden cursor-pointer group
        transition-all duration-500 ease-out
        ${isActive ? 'scale-100 md:scale-100 opacity-100 shadow-xl z-10' : 'scale-95 md:scale-100 opacity-70 z-0'}
        ${className}
      `}
    >
      {/* Background Image */}
      <Image
        src={event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"}
        alt={event.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        priority={priority}
        sizes="(max-width: 768px) 100vw, 340px"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
          <span className="bg-white/20 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-semibold">
            {event.category}
          </span>
          {event.priceType === 'Paid' && (
            <span className="bg-primary/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              ${event.price}
            </span>
          )}
        </div>

        <div className="space-y-3 transform transition-transform duration-300 group-hover:-translate-y-2">
          {/* Title */}
          <h3 className="text-2xl font-bold leading-tight line-clamp-2 text-shadow-sm">
            {event.title}
          </h3>

          {/* Meta Info */}
          <div className="flex flex-col gap-1.5 text-sm text-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDate(event.date)} • {event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>{event.attendees} attending</span>
            </div>
          </div>

          {/* CTA Button (Visible on Hover/Focus) */}
          <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="w-full py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
