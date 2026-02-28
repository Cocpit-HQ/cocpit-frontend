"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Briefcase, Plus, Calendar } from "lucide-react"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useAuth } from "@/hooks/use-auth"
import { ProfileSwitcher } from "@/components/layout/ProfileSwitcher"

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
  const { activeProfile } = useActiveProfile()
  const { user } = useAuth()

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

        {isActive("/profile") || (activeProfile?.type === "COMPANY" && isActive(`/company/${activeProfile.slug}`)) ? (
          <ProfileSwitcher
            align="end"
            customTrigger={
              <button className="flex flex-col items-center gap-1 flex-1">
                <div className={`relative w-6 h-6 rounded-full overflow-hidden border-2 ${isActive("/profile") || (activeProfile?.type === "COMPANY" && isActive(`/company/${activeProfile.slug}`)) ? "border-primary" : "border-transparent"}`}>
                  <img
                    src={activeProfile?.avatar_url || user?.image || undefined}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-xs ${isActive("/profile") || (activeProfile?.type === "COMPANY" && isActive(`/company/${activeProfile.slug}`)) ? "text-primary" : "text-muted-foreground"}`}>
                  Profile
                </span>
              </button>
            }
          />
        ) : (
          <Link
            href={activeProfile?.type === "COMPANY" && activeProfile.slug ? `/company/${activeProfile.slug}` : "/profile"}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-transparent">
              <img
                src={activeProfile?.avatar_url || user?.image || undefined}
                alt="Profile"
                className="w-full h-full object-cover opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all"
              />
            </div>
            <span
              className={`text-xs ${isActive("/profile") || (activeProfile?.type === "COMPANY" && isActive(`/company/${activeProfile.slug}`)) ? "text-primary" : "text-muted-foreground"
                }`}
            >
              Profile
            </span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export default MobileBottomNav
