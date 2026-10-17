import React from "react"
import Image from "next/image"
import { MapPin, Users, Calendar } from "lucide-react"
import type { EventCard } from "@/types/event"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface StandardEventCardProps {
  event: EventCard
  onClick: () => void
  className?: string
  isRegistered: boolean
  isSaved: boolean
  isSaving?: boolean
  onToggleSave: (e: React.MouseEvent) => void
  priority?: boolean
}

export function StandardEventCard({ event, onClick, className = "", isRegistered, isSaved, isSaving, onToggleSave, priority = false }: StandardEventCardProps) {

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl overflow-hidden border group cursor-pointer hover:-translate-y-1 transition-all duration-300 bg-card border-border hover:border-primary/50 hover:shadow-lg relative h-full flex flex-col ${event.event_status === "expired" ? "opacity-60" : ""} ${className}`}
    >
      <div className="relative h-48 overflow-hidden">
        {/* ... (existing image code) ... */}
        <Image
          src={event.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex gap-3 mb-3">
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <span className="text-xs font-bold uppercase">{event.date.includes('-') ? new Date(event.date).toLocaleString('default', { month: 'short' }) : event.date.split(' ')[0]}</span>
            <span className="text-lg font-bold">{event.date.includes('-') ? new Date(event.date).getDate() : (event.date.split(' ')[1]?.replace(',', '') || '01')}</span>
          </div>
          <div className="flex-1">
            {event.event_status && (
              <div className={`mb-1.5 w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold border
                ${event.event_status === "live" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                  event.event_status === "registration_closed" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                  event.event_status === "expired" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                  "bg-blue-500/10 text-blue-500 border-blue-500/20"}
              `}>
                {event.event_status === "live" && "Live"}
                {event.event_status === "registration_closed" && "Registration Closed"}
                {event.event_status === "expired" && "Expired"}
                {event.event_status === "upcoming" && "Upcoming"}
              </div>
            )}

            <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-1 group-hover:text-primary transition-colors text-foreground">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {event.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {event.company ? (
                <>
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={event.company.logo} />
                    <AvatarFallback>{event.company.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-muted-foreground">{event.company.name}</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Hosted by {event.organizer?.name || event.organizerName || "Organizer"}</span>
              )}
            </div>
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

        <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
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
