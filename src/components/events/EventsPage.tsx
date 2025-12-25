"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Users, Plus, X } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { CreateEventForm } from "@/components/events/CreateEventForm"
import { EventFilters, initialFilterState, type FilterState } from "@/components/events/EventFilters"
import { useEvents } from "@/context/EventsContext"
import type { Page } from "@/types/common"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

export function EventsPage() {
  const router = useRouter()
  const { events, isRegistered, isSaved, myEventIds, saveEvent, unsaveEvent } = useEvents()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [filters, setFilters] = useState<FilterState>(initialFilterState)

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const filteredEvents = events.filter(event => {
    // 1. Text Search
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Main Tab Logic
    switch (activeTab) {
      case 'registered':
        if (!isRegistered(event.id)) return false;
        break;
      case 'saved':
        if (!isSaved(event.id)) return false;
        break;
      case 'my_events':
        if (!myEventIds.has(event.id)) return false;
        break;
      case 'upcoming':
      default:
        // Show all non-past events? For now just all.
        break;
    }

    // 3. Filter Logic

    // Category
    if (filters.categories.length > 0) {
      if (!filters.categories.some(cat => event.category.toLowerCase().includes(cat.toLowerCase()))) {
        return false;
      }
    }

    // Type (Online/InPerson)
    if (filters.types.length > 0) {
      // Assuming event.eventType is populated or derived from location
      const isOnline = event.eventType === 'Online' || event.location.toLowerCase().includes('online') || event.location.toLowerCase().includes('virtual');
      const isInPerson = !isOnline;

      const showOnline = filters.types.includes('Online');
      const showInPerson = filters.types.includes('InPerson');

      if (showOnline && !showInPerson && !isOnline) return false;
      if (showInPerson && !showOnline && !isInPerson) return false;
    }

    // Price
    if (filters.prices.length > 0) {
        // Map event 'type' or 'priceType' to 'Free' / 'Paid'
        const isFree = event.priceType === 'Free' || event.type === 'Free' || (!event.price && !event.priceType);
        const isPaid = !isFree;

        const showFree = filters.prices.includes('Free');
        const showPaid = filters.prices.includes('Paid');

        if (showFree && !showPaid && !isFree) return false;
        if (showPaid && !showFree && !isPaid) return false;
    }

    // Popularity
    if (filters.popular) {
        const attendeeCount = parseInt(event.attendees.replace(/,/g, '') || '0');
        if (attendeeCount < 200) return false;
    }

    // Date (Simplified Mock Logic)
    if (filters.dates.length > 0) {
        const eventDate = new Date(event.date);
        const today = new Date();

        const isToday = eventDate.toDateString() === today.toDateString();
        // Mock 'This Week' and 'This Month' logic would require better date parsing
        // For now, if 'Today' is selected, check equality.
        if (filters.dates.includes('Today') && !isToday) return false;
    }

    return true;
  })

  const removeFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => {
       const list = prev[type] as string[];
       return { ...prev, [type]: list.filter(v => v !== value) };
    });
  }

  const removePopular = () => setFilters(prev => ({...prev, popular: false}));

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="events" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Events</h1>
            </div>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-purple-500/20"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>

          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Mobile: Search and Filter on same row */}
            <div className="flex gap-3 w-full">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:border-primary bg-card border-border text-foreground placeholder-muted-foreground"
                    />
                </div>
                <div className="flex-shrink-0">
                    <EventFilters filters={filters} setFilters={setFilters} />
                </div>
            </div>
          </div>

          {/* Filter Chips */}
          {(filters.categories.length > 0 || filters.types.length > 0 || filters.prices.length > 0 || filters.dates.length > 0 || filters.popular) && (
             <div className="flex flex-wrap gap-2 mb-6">
                {filters.popular && (
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        Popular
                        <button onClick={removePopular} className="hover:text-primary/70"><X className="w-3 h-3" /></button>
                    </div>
                )}
                {filters.types.map(t => (
                    <div key={t} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {t === 'InPerson' ? 'In-person' : t}
                        <button onClick={() => removeFilter('types', t)} className="hover:text-primary/70"><X className="w-3 h-3" /></button>
                    </div>
                ))}
                {filters.prices.map(p => (
                    <div key={p} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {p}
                        <button onClick={() => removeFilter('prices', p)} className="hover:text-primary/70"><X className="w-3 h-3" /></button>
                    </div>
                ))}
                {filters.categories.map(c => (
                    <div key={c} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {c}
                        <button onClick={() => removeFilter('categories', c)} className="hover:text-primary/70"><X className="w-3 h-3" /></button>
                    </div>
                ))}
                {filters.dates.map(d => (
                    <div key={d} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {d}
                        <button onClick={() => removeFilter('dates', d)} className="hover:text-primary/70"><X className="w-3 h-3" /></button>
                    </div>
                ))}
                <button
                    onClick={() => setFilters(initialFilterState)}
                    className="text-sm text-muted-foreground hover:text-foreground underline px-2"
                >
                    Clear all
                </button>
             </div>
          )}


          {/* Tabs */}
          <div className="flex gap-8 border-b border-border mb-8 overflow-x-auto no-scrollbar">
            {["upcoming", "registered", "saved", "my_events"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-medium capitalize transition-all relative whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.replace('_', ' ')}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>No events found matching your criteria.</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="rounded-2xl overflow-hidden border group cursor-pointer hover:-translate-y-1 transition-all duration-300 bg-card border-border hover:border-primary/50 hover:shadow-lg relative"
                >
                  <div className="relative h-48 overflow-hidden">
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
                    {isRegistered(event.id) && (
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
                            onClick={(e) => {
                                e.stopPropagation();
                                isSaved(event.id) ? unsaveEvent(event.id) : saveEvent(event.id);
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            {isSaved(event.id) ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                            )}
                        </button>
                        <button className="text-sm font-semibold text-primary hover:underline">
                            {isRegistered(event.id) ? "View Ticket" : "View Details"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </AppShell>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <CreateEventForm onClose={() => {
                setShowCreateEvent(false);
                if (window.location.hash !== '#my_events') {
                     // Optionally switch tab to my_events if new event created
                     setActiveTab('my_events');
                }
            }} />
        </div>
      )}
    </div>
  )
}
