
"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Plus, X, MapPin } from "lucide-react"
import { CreateEventForm } from "@/components/events/CreateEventForm"
import { EventFilters, initialFilterState, type FilterState } from "@/components/events/EventFilters"
import { HeroCarousel } from "@/components/events/HeroCarousel"
import { EventDashboard } from "@/components/events/EventDashboard"
import { useTheme } from "next-themes"
import { Theme, Page } from "@/types/common"
import { EventFeed } from "@/components/events/EventFeed"
import { UserEventsList } from "@/components/events/UserEventsList"
import { useEventFeed } from "@/hooks/use-event-queries"

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
  const searchParams = useSearchParams()
  const { theme } = useTheme()

  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>(initialFilterState)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [activeTab, setActiveTabState] = useState(searchParams.get('tab') || "upcoming")

  // URL Sync
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/events?${params.toString()}`, { scroll: false });
  };

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [searchParams]);

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  // Filter Helpers
  const removeFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => {
      const list = prev[type] as string[];
      return { ...prev, [type]: list.filter(v => v !== value) };
    });
  }
  const removePopular = () => setFilters(prev => ({ ...prev, popular: false }));

  // Hero Carousel Logic: Fetch first few items from the feed hook to display as suggestions
  // We can just use the same hook but with limit=3 or reuse the cache.
  // For simplicity, we'll re-use the infinite feed hook.
  const { data: feedData, isLoading: isSuggestionsLoading } = useEventFeed({ limit: 5 });
  const suggestedEvents = feedData?.pages[0]?.items.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
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
                className="w-full pl-12 pr-4 py-3 rounded-full border focus:outline-none focus:border-primary bg-card border-border text-foreground placeholder-muted-foreground"
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
        <div className="flex gap-3 md:gap-4 mb-8 overflow-x-auto scrollbar-hide py-1">
          {["upcoming", "registered", "saved", "my_events", "dashboard"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium capitalize transition-all relative whitespace-nowrap flex-shrink-0 ${activeTab === tab
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md shadow-purple-500/20"
                : "bg-muted text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground border border-black/5 dark:border-white/5"
                }`}
            >
              {tab === 'upcoming' ? 'Discover' : tab === 'dashboard' ? 'Event Dashboard' : tab.replace('_', ' ')}
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
              </div>

              {isSuggestionsLoading ? (
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

            {/* Main Feed */}
            <EventFeed filters={filters} searchQuery={searchQuery} />
          </div>
        ) : activeTab === 'dashboard' ? (
          <EventDashboard navigateTo={navigateTo} theme={mounted ? (theme || 'dark') as Theme : 'dark'} />
        ) : (
          // Other Tabs
          <UserEventsList key={activeTab} type={activeTab as 'my_events' | 'registered' | 'saved'} />
        )}

      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm">
          <CreateEventForm onClose={() => {
            setShowCreateEvent(false);
            if (activeTab !== 'my_events') {
              setActiveTab('my_events');
            }
          }} />
        </div>
      )}
    </div>
  )
}
