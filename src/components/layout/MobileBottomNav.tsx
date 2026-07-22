"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Briefcase, Sparkles, Calendar, Users, LineChart } from "lucide-react"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useAuth } from "@/hooks/use-auth"
import { ProfileSwitcher } from "@/components/layout/ProfileSwitcher"
import { useCompanyPermissions } from "@/features/companyprofile/hooks/useCompanyPermissions"
import { useNavigationMemoryLink } from "@/hooks/use-navigation-memory"
import { Icon } from '@iconify/react'

const NAV_ROUTES: Record<string, string> = {
  home: "/feed",
  jobs: "/jobs",
  ai: "/ai-assistant",
  events: "/events",
  profile: "/profile",
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { handleNavClick } = useNavigationMemoryLink()
  const { activeProfile, isCompany } = useActiveProfile()
  const { user } = useAuth()
  const { canPostJobs, checkPermission } = useCompanyPermissions(activeProfile)

  const showJobs = !isCompany || canPostJobs || checkPermission('VIEW_APPLICANTS')

  const isActive = (route: string) => {
    if (!pathname) return false

    // Feed special case
    if (route === "/feed" && pathname === "/") return true;

    // Exact match for organization profile to avoid highlighting on settings/events
    if (route.startsWith('/organization/') && !route.endsWith('/settings') && !route.endsWith('/events')) {
      return pathname === route;
    }

    // Profile special case: only highlight for own profile and its sub-pages
    // This prevents highlighting when viewing public profiles at /profile/[id]
    if (route === "/profile") {
      return pathname === "/profile" || pathname === "/profile/posts" || pathname.startsWith("/profile/edit");
    }

    // Default behavior
    return pathname.startsWith(route)
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t bg-background/95 border-border backdrop-blur-md"
    >
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2">
        <Link
          href="/feed"
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/feed')}
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

        {showJobs && (
          <Link
            href="/jobs"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/jobs')}
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
        )}

        {isCompany ? (
          <>
            <Link
              href={activeProfile?.slug ? `/organization/${activeProfile.slug}/analytics` : "/analytics"}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, activeProfile?.slug ? `/organization/${activeProfile.slug}/analytics` : "/analytics")}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <Icon 
                icon="hugeicons:analytics-up" 
                className={`w-5 h-5 ${isActive(activeProfile?.slug ? `/organization/${activeProfile.slug}/analytics` : "/analytics") ? "text-primary" : "text-muted-foreground"
                  }`} 
              />
              <span
                className={`text-xs ${isActive(activeProfile?.slug ? `/organization/${activeProfile.slug}/analytics` : "/analytics") ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                Analytics
              </span>
            </Link>

            <Link
              href="/team"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/team')}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <Users
                className={`w-5 h-5 ${isActive("/team") ? "text-primary" : "text-muted-foreground"
                  }`}
              />
              <span
                className={`text-xs ${isActive("/team") ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                Teams
              </span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/ai-assistant"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/ai-assistant')}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <Sparkles
                className={`w-5 h-5 ${isActive("/ai-assistant") ? "text-primary" : "text-muted-foreground"
                  }`}
              />
              <span
                className={`text-xs ${isActive("/ai-assistant") ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                AI
              </span>
            </Link>

            <Link
              href="/events"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/events')}
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
          </>
        )}

        {isActive("/profile") || (activeProfile?.type === "COMPANY" && isActive(`/organization/${activeProfile.slug}`)) ? (
          <ProfileSwitcher
            align="end"
            customTrigger={
              <button className="flex flex-col items-center gap-1 flex-1">
                <div className={`relative w-6 h-6 rounded-full overflow-hidden border-2 ${isActive("/profile") || (activeProfile?.type === "COMPANY" && isActive(`/organization/${activeProfile.slug}`)) ? "border-primary" : "border-transparent"}`}>
                  <img
                    src={activeProfile?.avatar_url || user?.image || undefined}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-xs ${isActive("/profile") || (activeProfile?.type === "COMPANY" && isActive(`/organization/${activeProfile.slug}`)) ? "text-primary" : "text-muted-foreground"}`}>
                  {activeProfile?.type === "COMPANY" ? "Company" : "Profile"}
                </span>
              </button>
            }
          />
        ) : (
          <Link
            href={activeProfile?.type === "COMPANY" && activeProfile.slug ? `/organization/${activeProfile.slug}` : "/profile"}
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
              className={`text-xs ${isActive("/profile") || (activeProfile?.type === "COMPANY" && isActive(`/organization/${activeProfile.slug}`)) ? "text-primary" : "text-muted-foreground"
                }`}
            >
              {activeProfile?.type === "COMPANY" ? "Company" : "Profile"}
            </span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export default MobileBottomNav
