"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Users, Plus, X, Loader2 } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { CreateEventForm } from "@/components/events/CreateEventForm"
import { EventFilters, initialFilterState, type FilterState } from "@/components/events/EventFilters"
import { useEvents } from "@/context/EventsContext"
import { HeroCarousel } from "@/components/events/HeroCarousel"
import { StandardEventCard } from "@/components/events/StandardEventCard"
import type { Page } from "@/types/common"
import type { EventCard } from "@/types/event"
import { Skeleton } from "@/components/ui/skeleton"
import { getAllEvents } from "@/services/api/event"
import { mapBackendEventToEventCard } from "@/lib/mappers/event.mapper"
import { EventDashboard } from "@/components/events/EventDashboard"
import { useTheme } from "next-themes"
import { Theme } from "@/types/common"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

function EventSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

export function EventsPage() {
  const router = useRouter()
  // We still use context for actions (save/unsave) and "my" lists, but NOT for the main feed
  const { isRegistered, isSaved, isSaving, myEventIds, saveEvent, unsaveEvent, events: contextEvents } = useEvents()
  const { theme } = useTheme()

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [filters, setFilters] = useState<FilterState>(initialFilterState)

  // Pagination State for "Upcoming" (Discover)
  const [pagedEvents, setPagedEvents] = useState<EventCard[]>([])
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingPaged, setIsLoadingPaged] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Tabs State
  const [registeredEvents, setRegisteredEvents] = useState<EventCard[]>([])
  const [loadingRegistered, setLoadingRegistered] = useState(false)
  const [unregisteringId, setUnregisteringId] = useState<number | string | null>(null)

  // Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null)
  const lastEventElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingPaged) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMoreEvents()
      }
    })
    if (node) observer.current.observe(node)
  }, [isLoadingPaged, hasMore])

  // Helper to map UI filters to Backend Query Params
  const getBackendParams = (currentFilters: FilterState, query: string, cursor?: string) => {
    const params: any = { limit: 9, cursor };

    if (query) params.q = query;

    if (currentFilters.categories.length > 0) {
      params.category = currentFilters.categories[0];
    }

    if (currentFilters.types.length > 0) {
      if (currentFilters.types.includes('Online') && !currentFilters.types.includes('InPerson')) params.type = 'Online';
      if (currentFilters.types.includes('InPerson') && !currentFilters.types.includes('Online')) params.type = 'InPerson';
    }

    if (currentFilters.dates.length > 0) {
      const today = new Date();
      if (currentFilters.dates.includes('Today')) {
        params.date = today.toISOString().split('T')[0];
      } else if (currentFilters.dates.includes('Tomorrow')) {
        const tmrw = new Date(today);
        tmrw.setDate(tmrw.getDate() + 1);
        params.date = tmrw.toISOString().split('T')[0];
      } else if (currentFilters.dates.includes('This week')) {
        params.startDate = today.toISOString().split('T')[0];
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End on Saturday
        params.endDate = endOfWeek.toISOString().split('T')[0];
      } else if (currentFilters.dates.includes('This weekend')) {
        const diffToSat = 6 - today.getDay();
        const sat = new Date(today); sat.setDate(today.getDate() + diffToSat);
        const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
        params.startDate = sat.toISOString().split('T')[0];
        params.endDate = sun.toISOString().split('T')[0];
      }
    }
    return params;
  };

  const fetchMoreEvents = async () => {
    if (isLoadingPaged || !hasMore) return
    setIsLoadingPaged(true)

    try {
      const backendFilters = getBackendParams(filters, searchQuery, nextCursor);
      const data = await getAllEvents(backendFilters)

      let newItems: EventCard[] = []
      let newCursor: string | undefined = undefined
      let more = false

      if (Array.isArray(data)) {
        newItems = data.map(mapBackendEventToEventCard)
        more = false
      } else {
        newItems = data.items.map(mapBackendEventToEventCard)
        newCursor = data.nextCursor
        more = data.hasMore
      }

      setPagedEvents(prev => {
        const existingIds = new Set(prev.map(e => e.id))
        const uniqueNewItems = newItems.filter(e => !existingIds.has(e.id))
        return [...prev, ...uniqueNewItems]
      })
      setNextCursor(newCursor)
      setHasMore(more)
    } catch (err) {
      console.error("Failed to fetch events", err)
    } finally {
      setIsLoadingPaged(false)
    }
  }

  // Initial Fetch for Paged Events
  useEffect(() => {
    if (activeTab === 'upcoming') {
      const initFetch = async () => {
        setIsInitialLoading(true)
        setPagedEvents([])
        setNextCursor(undefined)
        setHasMore(true) // Reset

        try {
          const backendFilters = getBackendParams(filters, searchQuery);
          const data = await getAllEvents(backendFilters)

          if (Array.isArray(data)) {
            setPagedEvents(data.map(mapBackendEventToEventCard))
            setHasMore(false)
          } else {
            setPagedEvents(data.items.map(mapBackendEventToEventCard))
            setNextCursor(data.nextCursor)
            setHasMore(data.hasMore)
          }
        } catch (err) {
          console.error("Initial fetch failed", err)
        } finally {
          setIsInitialLoading(false)
        }
      }
      // Debounce slightly if search query changes
      const timeoutId = setTimeout(() => {
        initFetch()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [activeTab, searchQuery, filters]) // Re-fetch on filter change

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
      const { unregisterFromEvent } = await import('@/services/api/event');
      await unregisterFromEvent(id);
      setRegisteredEvents(prev => prev.filter(e => e.id !== id));
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

  const removeFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => {
      const list = prev[type] as string[];
      return { ...prev, [type]: list.filter(v => v !== value) };
    });
  }

  const removePopular = () => setFilters(prev => ({ ...prev, popular: false }));

  // Helper for other tabs (using contextEvents)
  const getContextTabEvents = () => {
    if (activeTab === 'saved') return contextEvents.filter(e => isSaved(e.id))
    if (activeTab === 'my_events') return contextEvents.filter(e => myEventIds.has(e.id))
    return []
  }

  // Suggestions (Mock logic: just take first few paged events or empty if loading)
  const suggestedEvents = pagedEvents.slice(0, 3)
  const displayEvents = pagedEvents // Infinite scroll list

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
                  placeholder="Search events (location)..."
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
            {["upcoming", "registered", "saved", "my_events", "dashboard"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-medium capitalize transition-all relative whitespace-nowrap flex-shrink-0 ${activeTab === tab
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab === 'upcoming' ? 'Discover' : tab === 'dashboard' ? 'Event Dashboard' : tab.replace('_', ' ')}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          {activeTab === 'upcoming' ? (
            <div className="space-y-10 animate-in fade-in duration-500">

              {/* Suggestions Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">Suggested for you</h2>
                  {/* Placeholder for future suggestion settings or "See all" */}
                </div>

                {isInitialLoading ? (
                  <div className="w-full h-64 bg-muted animate-pulse rounded-xl" />
                ) : suggestedEvents.length > 0 ? (
                  <HeroCarousel
                    events={suggestedEvents}
                    onEventClick={(id) => router.push(`/events/${id}`)}
                  />
                ) : (
                  <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border">
                    <p>No suggestions available at the moment.</p>
                  </div>
                )}
              </section>

              {/* All Events Section (Infinite Scroll) */}
              <section>
                <h2 className="text-2xl font-bold mb-4 text-foreground">All Events</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayEvents.map((event, index) => {
                    if (displayEvents.length === index + 1) {
                      return (
                        <div ref={lastEventElementRef} key={event.id}>
                          <StandardEventCard
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
                        </div>
                      )
                    } else {
                      return (
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
                      )
                    }
                  })}

                  {/* Skeletons for initial loading or loading more */}
                  {(isInitialLoading || isLoadingPaged) && (
                    <>
                      <EventSkeleton />
                      <EventSkeleton />
                      <EventSkeleton />
                    </>
                  )}
                </div>

                {!isInitialLoading && !hasMore && displayEvents.length > 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>You&apos;ve reached the end!</p>
                  </div>
                )}

                {!isInitialLoading && displayEvents.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">No events found matching your criteria.</p>
                  </div>
                )}
              </section>
            </div>
          ) : activeTab === 'dashboard' ? (
            <EventDashboard navigateTo={navigateTo} theme={(theme || 'dark') as Theme} />
          ) : (
            // Other Tabs (Unchanged layout mostly, but using local state/context logic)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === 'registered' ? registeredEvents : getContextTabEvents()).length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p>No events found in this section.</p>
                </div>
              ) : (
                (activeTab === 'registered' ? registeredEvents : getContextTabEvents()).map((event) => (
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
