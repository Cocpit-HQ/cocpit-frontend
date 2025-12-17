"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Home, Briefcase, Plus, Calendar, User } from "lucide-react"

import type { Page } from "@/types/common"

interface MobileBottomNavProps {
  currentPage: Page
  onAdd?: () => void
}

const NAV_ROUTES: Record<string, string> = {
  home: "/feed",
  jobs: "/jobs",
  events: "/events",
  profile: "/profile",
}

export function MobileBottomNav({ currentPage, onAdd }: MobileBottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  const handleNavigate = (page: Page) => {
    const target = NAV_ROUTES[page] ?? "/feed"
    if (pathname === target) return
    router.push(target)
  }

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 md:hidden border-t ${
        isDark ? "bg-[#171c28]/95 border-[#2d3548]" : "bg-white/95 border-gray-200"
      } backdrop-blur-md`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2">
        <button
          type="button"
          onClick={() => handleNavigate("home")}
          className="flex flex-col items-center gap-1 flex-1"
        >
          <Home
            className={`w-5 h-5 ${
              currentPage === "home" ? "text-[#5B7CFF]" : isDark ? "text-gray-400" : "text-gray-600"
            }`}
          />
          <span
            className={`text-xs ${
              currentPage === "home" ? "text-[#5B7CFF]" : isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Feed
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate("jobs")}
          className="flex flex-col items-center gap-1 flex-1"
        >
          <Briefcase
            className={`w-5 h-5 ${
              currentPage === "jobs" ? "text-[#5B7CFF]" : isDark ? "text-gray-400" : "text-gray-600"
            }`}
          />
          <span
            className={`text-xs ${
              currentPage === "jobs" ? "text-[#5B7CFF]" : isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Jobs
          </span>
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center -mt-6"
          aria-label="Create"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] flex items-center justify-center shadow-lg shadow-[#5B7CFF]/40">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate("events")}
          className="flex flex-col items-center gap-1 flex-1"
        >
          <Calendar
            className={`w-5 h-5 ${
              currentPage === "events" ? "text-[#5B7CFF]" : isDark ? "text-gray-400" : "text-gray-600"
            }`}
          />
          <span
            className={`text-xs ${
              currentPage === "events" ? "text-[#5B7CFF]" : isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Events
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNavigate("profile")}
          className="flex flex-col items-center gap-1 flex-1"
        >
          <User
            className={`w-5 h-5 ${
              currentPage === "profile" ? "text-[#5B7CFF]" : isDark ? "text-gray-400" : "text-gray-600"
            }`}
          />
          <span
            className={`text-xs ${
              currentPage === "profile" ? "text-[#5B7CFF]" : isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Profile
          </span>
        </button>
      </div>
    </nav>
  )
}

export default MobileBottomNav


