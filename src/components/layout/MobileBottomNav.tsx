"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Briefcase, Users, Plus } from "lucide-react"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useAuth } from "@/hooks/use-auth"
import { ProfileSwitcher } from "@/components/layout/ProfileSwitcher"
import { useCompanyPermissions } from "@/features/companyprofile/hooks/useCompanyPermissions"
import { useNavigationMemoryLink } from "@/hooks/use-navigation-memory"
import { Icon } from '@iconify/react'
import { useUIStore } from "@/store/ui.store"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { handleNavClick } = useNavigationMemoryLink()
  const { activeProfile, isCompany } = useActiveProfile()
  const { user } = useAuth()
  const { canPostJobs, checkPermission } = useCompanyPermissions(activeProfile)
  const { setActiveModal } = useUIStore()

  const showJobs = !isCompany || canPostJobs || checkPermission('VIEW_APPLICANTS')
  const canCreatePost = !isCompany || checkPermission('create_post') || checkPermission('CREATE_POST')

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

  const activeColor = "text-[#EC6229]" // Using the approved orange token for active states

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t bg-background/95 border-border backdrop-blur-md">
      <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
        {/* Home */}
        <Link
          href="/feed"
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/feed')}
          className="flex flex-col items-center justify-center flex-1"
        >
          <Home className={`w-6 h-6 ${isActive("/feed") ? activeColor : "text-muted-foreground"}`} />
        </Link>

        {/* Jobs */}
        {showJobs && (
          <Link
            href="/jobs"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/jobs')}
            className="flex flex-col items-center justify-center flex-1"
          >
            <Briefcase className={`w-6 h-6 ${isActive("/jobs") ? activeColor : "text-muted-foreground"}`} />
          </Link>
        )}

        {/* Create Button (Central) */}
        <div className="flex flex-col items-center justify-center flex-1">
          <button
            onClick={(e) => {
              if (!canCreatePost) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              setActiveModal('create-post');
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center border border-border ${canCreatePost ? 'text-foreground' : 'text-muted-foreground opacity-50 cursor-not-allowed'}`}
            aria-label="Create Post"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Network / Teams */}
        {isCompany ? (
          <Link
            href="/team"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/team')}
            className="flex flex-col items-center justify-center flex-1"
          >
            <Users className={`w-6 h-6 ${isActive("/team") ? activeColor : "text-muted-foreground"}`} />
          </Link>
        ) : (
          <Link
            href="/connections"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/connections')}
            className="flex flex-col items-center justify-center flex-1"
          >
            <Users className={`w-6 h-6 ${isActive("/connections") ? activeColor : "text-muted-foreground"}`} />
          </Link>
        )}

        {/* Profile */}
        <div className="flex flex-col items-center justify-center flex-1">
          {isActive("/profile") || (activeProfile?.type === "COMPANY" && isActive(`/organization/${activeProfile.slug}`)) ? (
            <ProfileSwitcher
              align="end"
              customTrigger={
                <button className="flex flex-col items-center justify-center w-full">
                  <div className={`relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#EC6229]`}>
                    <img
                      src={activeProfile?.avatar_url || user?.image || undefined}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              }
            />
          ) : (
            <Link
              href={activeProfile?.type === "COMPANY" && activeProfile.slug ? `/organization/${activeProfile.slug}` : "/profile"}
              className="flex flex-col items-center justify-center w-full"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden border border-transparent">
                <img
                  src={activeProfile?.avatar_url || user?.image || undefined}
                  alt="Profile"
                  className="w-full h-full object-cover opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all"
                />
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default MobileBottomNav
