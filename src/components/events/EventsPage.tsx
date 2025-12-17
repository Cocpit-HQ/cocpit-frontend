"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Calendar, MapPin, Search, Users } from "lucide-react"
import { Plus } from "lucide-react"

import { DarkSidebar } from "@/components/DarkSidebar"
import type { Page, Theme } from "@/types/common"
import type { EventCard } from "@/types/events"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
  achievements: "/achievements",
  "create-event": "/events/create",
}

const eventsSeed: EventCard[] = [
  {
    id: 1,
    title: "Product Management Summit 2025",
    date: "March 15, 2025",
    time: "10:00 AM - 5:00 PM",
    location: "San Francisco, CA",
    attendees: "234",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Tech Networking Mixer",
    date: "March 20, 2025",
    time: "6:00 PM - 9:00 PM",
    location: "Virtual Event",
    attendees: "156",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Web Development Workshop",
    date: "March 25, 2025",
    time: "2:00 PM - 6:00 PM",
    location: "New York, NY",
    attendees: "89",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop",
  },
  {
    id: 4,
    title: "AI & Machine Learning Conference",
    date: "April 5, 2025",
    time: "9:00 AM - 6:00 PM",
    location: "Seattle, WA",
    attendees: "412",
    image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Design Thinking Masterclass",
    date: "April 12, 2025",
    time: "1:00 PM - 4:00 PM",
    location: "Los Angeles, CA",
    attendees: "67",
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop",
  },
]

function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<Theme>("light")

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const updateTheme = (matches: boolean) => setSystemTheme(matches ? "dark" : "light")
    updateTheme(mediaQuery.matches)
    const listener = (event: MediaQueryListEvent) => updateTheme(event.matches)
    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }, [])

  return systemTheme
}

function EventSkeletonCard() {
  return (
    <div className="rounded-xl border border-[#2d3548] bg-[#242b3d] overflow-hidden animate-pulse">
      <div className="h-56 bg-[#1f2534]" />
      <div className="p-6 space-y-3">
        <div className="h-5 w-3/4 bg-[#323a4b] rounded" />
        <div className="h-4 w-1/2 bg-[#323a4b] rounded" />
        <div className="h-4 w-2/3 bg-[#323a4b] rounded" />
        <div className="h-10 w-32 bg-[#323a4b] rounded-full" />
      </div>
    </div>
  )
}

function EventCardItem({ event, isDark }: { event: EventCard; isDark: boolean }) {
  return (
    <div
      className={`${isDark ? "bg-[#242b3d] border-[#2d3548] hover:border-[#3d4558]" : "bg-white border-gray-200 hover:border-gray-300"} rounded-xl border overflow-hidden transition-all`}
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-80 h-56 md:h-auto flex-shrink-0">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <h3 className={`text-xl mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>{event.title}</h3>

            <div className="space-y-3 mb-6">
              <div className={`flex items-center gap-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                <Calendar className="w-5 h-5 text-[#5B7CFF]" />
                <span>
                  {event.date} · {event.time}
                </span>
              </div>
              <div className={`flex items-center gap-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                <MapPin className="w-5 h-5 text-[#5B7CFF]" />
                <span>{event.location}</span>
              </div>
              <div className={`flex items-center gap-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                <Users className="w-5 h-5 text-[#5B7CFF]" />
                <span>{event.attendees} attendees</span>
              </div>
            </div>
          </div>

          <div>
            <button className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-6 py-3 rounded-full hover:opacity-90 transition-all">
              Event Info
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EventsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const systemTheme = useSystemTheme()

  const isDark = useMemo(
    () => theme === "dark" || (theme === "system" && systemTheme === "dark"),
    [systemTheme, theme]
  )

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<EventCard[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setEvents(eventsSeed)
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <DarkSidebar navigateTo={navigateTo} currentPage="events" />

      <div className="ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className={isDark ? "text-white mb-2" : "text-gray-900 mb-2"}>Events</h1>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>Discover and join professional events</p>
            </div>
            <button
              onClick={() => navigateTo("create-event")}
              className="flex items-center gap-2 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              />
              <input
                type="text"
                placeholder="Search events..."
                className={`w-full ${
                  isDark
                    ? "bg-[#242b3d] border-[#2d3548] text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                } border rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#5B7CFF] transition-colors`}
              />
            </div>
          </div>

          <div className="space-y-6">
            {loading &&
              Array.from({ length: 3 }).map((_, idx) => <EventSkeletonCard key={idx} />)}

            {!loading && events.map((event) => <EventCardItem key={event.id} event={event} isDark={isDark} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

