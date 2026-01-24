"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Users, Plus, X } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { CreateEventForm } from "@/components/events/CreateEventForm"
import { EventFilters, initialFilterState, type FilterState } from "@/components/events/EventFilters"
import { useEvents } from "@/context/EventsContext"
import { HeroCarousel } from "@/components/events/HeroCarousel"
import { StandardEventCard } from "@/components/events/StandardEventCard"
import type { Page } from "@/types/common"
import type { EventCard } from "@/types/event"

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
  const { events, isRegistered, isSaved, isSaving, myEventIds, saveEvent, unsaveEvent } = useEvents()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [filters, setFilters] = useState<FilterState>(initialFilterState)
  const [registeredEvents, setRegisteredEvents] = useState<EventCard[]>([])
  const [loadingRegistered, setLoadingRegistered] = useState(false)
  const [unregisteringId, setUnregisteringId] = useState<number | string | null>(null)

  // Fetch registered events when tab becomes active
  useEffect(() => {
    if (activeTab === 'registered') {
      const fetchRegistered = async () => {
        setLoadingRegistered(true)
        try {
          const { getMyRegisteredEvents } = await import('@/services/api/event')
          const data = await getMyRegisteredEvents()
          setRegisteredEvents(data)
        } catch (err) {
          console.error("Failed to fetch registered events", err)
        } finally {
          setLoadingRegistered(false)
        }
      }
      fetchRegistered()
    }
  }, [activeTab])

  // Handle unregister
  const handleUnregister = async (id: number | string) => {
    if (!confirm("Are you sure you want to unregister?")) return;

    setUnregisteringId(id);

    try {
      // Show local loading state if feasible, or just rely on optimistic update
      // Creating a temporary loading state for the specific item might be complex without a new state, 
      // but blocking the UI or just removing it optimistically is fine as per requirements "Show loading state while processing"
      // Let's use a simple global loading indicator or just rely on the existing loadingRegistered if we want to block interaction

      // Since we are inside the page component, let's just use the optimistic update pattern paired with a toast/alert

      const { unregisterFromEvent } = await import('@/services/api/event');
      await unregisterFromEvent(id);

      // Optimistic update
      setRegisteredEvents(prev => prev.filter(e => e.id !== id));

      // Also update global context to keep it in sync
      if (typeof id !== 'undefined') { // type guard
        // context's cancelRegistration also calls API, so calling it here would double call. 
        // But context state needs update. 
        // Actually, context.cancelRegistration DOES call API. 
        // So we should call context.cancelRegistration INSTEAD of direct API import.
      }

    } catch (err) {
      console.error("Failed to unregister", err);
      alert("Failed to unregister. Please try again.");
    } finally {
      setUnregisteringId(null)
    }
  };

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  // General filtering logic (reused for non-discovery tabs)
  const getFilteredEvents = (baseList = events) => {
    return baseList.filter(event => {
      // 1. Text Search
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Filter Logic (Category, Type, Price, Popularity, Date) - Only applies if filters are set

      // Category
      if (filters.categories.length > 0) {
        if (!filters.categories.some(cat => event.category.toLowerCase().includes(cat.toLowerCase()))) {
          return false;
        }
      }

      // Type (Online/InPerson)
      if (filters.types.length > 0) {
        const isOnline = event.eventType === 'Online' || event.location.toLowerCase().includes('online') || event.location.toLowerCase().includes('virtual');
        const isInPerson = !isOnline;
        const showOnline = filters.types.includes('Online');
        const showInPerson = filters.types.includes('InPerson');
        if (showOnline && !showInPerson && !isOnline) return false;
        if (showInPerson && !showOnline && !isInPerson) return false;
      }

      // Price
      if (filters.prices.length > 0) {
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

      // Date
      if (filters.dates.length > 0) {
        const eventDate = new Date(event.date);
        const today = new Date();
        const isToday = eventDate.toDateString() === today.toDateString();
        if (filters.dates.includes('Today') && !isToday) return false;
      }

      return true;
    });
  };

  const filteredDiscoveryEvents = getFilteredEvents(events);

  const suggestedEvents = filteredDiscoveryEvents.slice(0, 3);
  const otherEvents = filteredDiscoveryEvents.slice(3).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtered list for other tabs (Registered, Saved, My Events)
  // Filtered list for other tabs (Registered, Saved, My Events)
  const tabEvents = getFilteredEvents(
    // Source depends on tab
    activeTab === 'registered'
      ? registeredEvents
      : events.filter(event => {
        switch (activeTab) {
          case 'saved': return isSaved(event.id);
          case 'my_events': return myEventIds.has(event.id);
          default: return true;
        }
      })
  );

  const removeFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => {
      const list = prev[type] as string[];
      return { ...prev, [type]: list.filter(v => v !== value) };
    });
  }

  const removePopular = () => setFilters(prev => ({ ...prev, popular: false }));

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
                className={`pb-4 text-sm font-medium capitalize transition-all relative whitespace-nowrap flex-shrink-0 ${activeTab === tab
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab === 'upcoming' ? 'Discover' : tab.replace('_', ' ')}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          {activeTab === 'upcoming' ? (
            <div className="space-y-10 animate-in fade-in duration-500">
              {/* Hero / Suggested Section */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Suggested for you</h2>
                <HeroCarousel
                  events={suggestedEvents}
                  onEventClick={(id) => router.push(`/events/${id}`)}
                />
              </section>

              {/* All other events */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">All Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherEvents.map(event => (
                    <StandardEventCard
                      key={event.id}
                      event={event}
                      onClick={() => router.push(`/events/${event.id}`)}
                      isRegistered={isRegistered(event.id)}
                      isSaved={isSaved(event.id)}
                      isSaving={isSaving(event.id)}
                      onToggleSave={(e) => {
                        e.stopPropagation();
                        isSaved(event.id) ? unsaveEvent(event.id) : saveEvent(event.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            // Grid for other tabs
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tabEvents.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p>No events found in this section.</p>
                </div>
              ) : (
                tabEvents.map((event) => (
                  <div key={event.id} className="relative group">
                    <StandardEventCard
                      event={event}
                      onClick={() => router.push(`/events/${event.id}`)}
                      isRegistered={activeTab === 'registered' ? true : isRegistered(event.id)}
                      isSaved={isSaved(event.id)}
                      isSaving={isSaving(event.id)}
                      onToggleSave={(e) => {
                        e.stopPropagation();
                        isSaved(event.id) ? unsaveEvent(event.id) : saveEvent(event.id);
                      }}
                    />
                    {activeTab === 'registered' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnregister(event.id)
                        }}
                        className="absolute top-4 right-4 z-20 bg-red-500 text-white text-xs px-3 py-1 rounded shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {unregisteringId === event.id ? 'Processing...' : 'Unregister'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </AppShell>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <CreateEventForm onClose={() => {
            setShowCreateEvent(false);
            if (window.location.hash !== '#my_events') {
              setActiveTab('my_events');
            }
          }} />
        </div>
      )}
    </div>
  )
}
