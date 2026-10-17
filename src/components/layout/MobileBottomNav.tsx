"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { MobileProfileSwitcher } from "@/components/layout/MobileProfileSwitcher"
import { useCompanyPermissions } from "@/features/businessProfile"
import { useNavigationMemoryLink } from "@/hooks/use-navigation-memory"
import { Icon } from "@/components/icons"
import { useFeatureFlags } from "@/context/FeatureFlagContext"
import { useUIStore } from "@/store/ui.store"

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { handleNavClick } = useNavigationMemoryLink()
  const { activeProfile, isCompany } = useActiveProfile()
  const { canPostJobs, checkPermission } = useCompanyPermissions(activeProfile)
  const { isFeatureActive } = useFeatureFlags()
  const { setActiveModal } = useUIStore()

  const showJobs = true;
  const canCreatePost = !isCompany || checkPermission('create_post') || checkPermission('CREATE_POST')

  const isActive = (route: string) => {
    if (!pathname) return false

    // Normalize pathname to remove trailing slash for consistent matching
    const normalizedPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

    // Feed special case
    if (route === "/feed" && normalizedPath === "/") return true;

    // Exact match for organization profile to avoid highlighting on settings/events
    if (route.startsWith('/organization/') && !route.endsWith('/settings') && !route.endsWith('/events') && !route.endsWith('/analytics')) {
      return normalizedPath.startsWith(route);
    }

    // Profile special case: highlight when viewing any profile page
    if (route === "/profile") {
      return normalizedPath.toLowerCase().startsWith("/profile");
    }

    // Default behavior
    return normalizedPath.startsWith(route)
  }

  const activeColor = "text-ds-accent" // Using the approved orange token for active states
  const inactiveColor = "text-ds-text-primary"

  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = React.useState(false);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearLongPress = React.useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleProfileTouchStart = React.useCallback(() => {
    clearLongPress();
    longPressTimerRef.current = setTimeout(() => {
      setIsProfileSwitcherOpen(true);
    }, 500);
  }, [clearLongPress]);

  React.useEffect(() => {
    return () => {
      clearLongPress();
    };
  }, [clearLongPress]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkKeyboard = () => {
      if (window.innerWidth >= 768) {
        setIsKeyboardOpen(false);
        return;
      }

      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        if (heightDiff > 120) {
          setIsKeyboardOpen(true);
          return;
        }
      }

      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      );
      setIsKeyboardOpen(Boolean(isInput));
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (window.innerWidth < 768 && target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(checkKeyboard, 100);
    };

    window.addEventListener('focusin', handleFocusIn, { passive: true });
    window.addEventListener('focusout', handleFocusOut, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkKeyboard, { passive: true });
    }

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkKeyboard);
      }
    };
  }, []);

  if (isKeyboardOpen) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 sm:hidden border-t bg-ds-bg/95 border-ds-border backdrop-blur-md transform-gpu pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-md mx-auto flex items-center justify-between px-6 py-2 h-[50px] gap-[15px]">
        {/* Home */}
        {isFeatureActive('enableFeedAccess') && (
          <Link
            href="/feed"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/feed')}
            className="flex flex-col items-center justify-center flex-1"
          >
            <Icon name="feed" className={`w-[20px] h-[20px] ${isActive("/feed") ? activeColor : inactiveColor}`} />
          </Link>
        )}

        {/* Network / Teams */}
        {isCompany ? (
          <Link
            href="/team"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/team')}
            className="flex flex-col items-center justify-center flex-1"
          >
            <Icon name="teams" className={`w-[20px] h-[20px] ${isActive("/team") ? activeColor : inactiveColor}`} />
          </Link>
        ) : (
          <Link
            href="/connections"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/connections')}
            className="flex flex-col items-center justify-center flex-1"
          >
            <Icon name="connection" className={`w-[20px] h-[20px] ${isActive("/connections") ? activeColor : inactiveColor}`} />
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
              if (pathname !== "/feed" && pathname !== "/") {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("scroll-/feed", "0");
                  sessionStorage.removeItem("cocpit_last_interacted_post_id");
                  sessionStorage.removeItem("cocpit_last_interacted_post_viewport_top");
                }
                router.push("/feed");
              } else {
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }
              }
              setActiveModal('create-post');
            }}
            className={`w-[46px] h-[34px] rounded-[8px] flex items-center justify-center border border-ds-border bg-transparent ${canCreatePost ? 'text-ds-accent' : 'text-muted-foreground opacity-50 cursor-default'}`}
            aria-label="Create Post"
          >
            <Icon name="plus" className="w-[20px] h-[20px]" />
          </button>
        </div>

        {/* Jobs */}
        {showJobs && (
          <Link
            href="/jobs"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, '/jobs')}
            className="flex flex-col items-center justify-center flex-1"
          >
            <Icon name="jobs" className={`w-[20px] h-[20px] ${isActive("/jobs") ? activeColor : inactiveColor}`} />
          </Link>
        )}

        {/* Profile */}
        {isFeatureActive('enableProfileTab') && (() => {
          const isProfActive = Boolean(
            pathname === "/profile" ||
            pathname === "/profile/posts" ||
            pathname?.startsWith("/profile/edit") ||
            ((isCompany || activeProfile?.type === "COMPANY") &&
              activeProfile?.slug &&
              pathname?.startsWith(`/organization/${activeProfile.slug}`) &&
              !pathname?.endsWith("/settings") &&
              !pathname?.endsWith("/events") &&
              !pathname?.endsWith("/analytics"))
          );
          const profileHref = activeProfile?.type === "COMPANY" && activeProfile?.slug ? `/organization/${activeProfile.slug}` : "/profile";

          const handleProfileClick = (e: React.MouseEvent) => {
            clearLongPress();
            if (isProfActive) {
              e.preventDefault();
              setIsProfileSwitcherOpen(true);
            } else {
              handleNavClick(e as any, profileHref);
              router.push(profileHref);
            }
          };

          return (
            <div className="flex flex-col items-center justify-center flex-1">
              <button
                type="button"
                onClick={handleProfileClick}
                onTouchStart={handleProfileTouchStart}
                onTouchEnd={clearLongPress}
                onTouchCancel={clearLongPress}
                className="flex flex-col items-center justify-center w-full focus-visible:outline-none cursor-pointer"
                aria-label="Profile"
              >
                <Icon name="profile" className={`w-[20px] h-[20px] ${isProfActive ? activeColor : inactiveColor}`} />
              </button>
            </div>
          );
        })()}
      </div>

      <MobileProfileSwitcher
        isOpen={isProfileSwitcherOpen}
        onOpenChange={setIsProfileSwitcherOpen}
      />
    </nav>
  )
}

export default MobileBottomNav
