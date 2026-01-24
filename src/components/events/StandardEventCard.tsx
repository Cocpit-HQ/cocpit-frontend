import React from "react"
import { MapPin, Users, Calendar } from "lucide-react"
import type { EventCard } from "@/types/event"

interface StandardEventCardProps {
  event: EventCard
  onClick: () => void
  className?: string
  isRegistered: boolean
  isSaved: boolean
  isSaving?: boolean
  onToggleSave: (e: React.MouseEvent) => void
}

export function StandardEventCard({ event, onClick, className = "", isRegistered, isSaved, isSaving, onToggleSave }: StandardEventCardProps) {

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl overflow-hidden border group cursor-pointer hover:-translate-y-1 transition-all duration-300 bg-card border-border hover:border-primary/50 hover:shadow-lg relative ${className}`}
    >
      <div className="relative h-48 overflow-hidden">
        {/* ... (existing image code) ... */}
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-black shadow-sm">
          {event.priceType === 'Paid' ? `$${event.price}` : 'Free'}
        </div>
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium text-white border border-white/20">
          {event.category}
        </div>
        {isRegistered && (
          <div className="absolute bottom-4 right-4 bg-green-500/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-white shadow-sm">
            Registered
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex gap-3 mb-3">
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <span className="text-xs font-bold uppercase">{event.date.includes('-') ? new Date(event.date).toLocaleString('default', { month: 'short' }) : event.date.split(' ')[0]}</span>
            <span className="text-lg font-bold">{event.date.includes('-') ? new Date(event.date).getDate() : (event.date.split(' ')[1]?.replace(',', '') || '01')}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-1 group-hover:text-primary transition-colors text-foreground">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {event.description}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            {event.location}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-primary" />
            {event.attendees} attendees
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-card bg-muted" />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
              +{parseInt(event.attendees.replace(/,/g, '')) > 3 ? parseInt(event.attendees.replace(/,/g, '')) - 3 : 0}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={onToggleSave}
              disabled={isSaving}
              className={`text-muted-foreground hover:text-primary transition-colors ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
            >
              {isSaving ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : isSaved ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></svg>
              )}
            </button>
            <button className="text-sm font-semibold text-primary hover:underline">
              {isRegistered ? "View Ticket" : "View Details"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
