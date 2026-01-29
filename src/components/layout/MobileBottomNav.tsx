"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Briefcase, Plus, Calendar, User } from "lucide-react"

interface MobileBottomNavProps {
  onAdd?: () => void
}

const NAV_ROUTES: Record<string, string> = {
  home: "/feed",
  jobs: "/jobs",
  events: "/events",
  profile: "/profile",
}

export function MobileBottomNav({ onAdd }: MobileBottomNavProps) {
  const pathname = usePathname()

  const isActive = (route: string) => {
    if (route === "/feed" && pathname === "/") return true
    return pathname?.startsWith(route)
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t bg-background/95 border-border backdrop-blur-md"
    >
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2">
        <Link
          href="/feed"
          className="flex flex-col items-center gap-1 flex-1"
        >
          <Home
            className={`w-5 h-5 ${isActive("/feed") ? "text-primary" : "text-muted-foreground"
              }`}
          />
          <span
            className={`text-xs ${isActive("/feed") ? "text-primary" : "text-muted-foreground"
              }`}
          >
            Feed
          </span>
        </Link>

        <Link
          href="/jobs"
          className="flex flex-col items-center gap-1 flex-1"
        >
          <Briefcase
            className={`w-5 h-5 ${isActive("/jobs") ? "text-primary" : "text-muted-foreground"
              }`}
          />
          <span
            className={`text-xs ${isActive("/jobs") ? "text-primary" : "text-muted-foreground"
              }`}
          >
            Jobs
          </span>
        </Link>

        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center -mt-6"
          aria-label="Create"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
            <Plus className="w-6 h-6 text-primary-foreground" />
          </div>
        </button>

        <Link
          href="/events"
          className="flex flex-col items-center gap-1 flex-1"
        >
          <Calendar
            className={`w-5 h-5 ${isActive("/events") ? "text-primary" : "text-muted-foreground"
              }`}
          />
          <span
            className={`text-xs ${isActive("/events") ? "text-primary" : "text-muted-foreground"
              }`}
          >
            Events
          </span>
        </Link>

        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 flex-1"
        >
          <User
            className={`w-5 h-5 ${isActive("/profile") ? "text-primary" : "text-muted-foreground"
              }`}
          />
          <span
            className={`text-xs ${isActive("/profile") ? "text-primary" : "text-muted-foreground"
              }`}
          >
            Profile
          </span>
        </Link>
      </div>
    </nav>
  )
}

export default MobileBottomNav
