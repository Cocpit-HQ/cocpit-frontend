"use client"

import React, { useMemo } from 'react'
import { flushSync } from 'react-dom'
import { Users, Compass, Sparkles, Settings } from 'lucide-react'

import { Home as IconoirHome } from 'iconoir-react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { useCompanyPermissions } from '@/components/organizations/hooks/use-company'
import { useNavigationMemoryLink } from '@/hooks/use-navigation-memory'
import { useCompanyOnboardingStore } from '@/features/company-onboarding/store/company-onboarding.store'
import { useQueryClient } from '@tanstack/react-query'
import './sidebar.css'

interface DarkSidebarProps {
  className?: string
}

export function DarkSidebar({ className }: DarkSidebarProps) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [optimisticPath, setOptimisticPath] = React.useState(pathname)

  React.useEffect(() => {
    setOptimisticPath(pathname)
  }, [pathname])

  const { handleNavClick } = useNavigationMemoryLink()
  const { activeProfile, isCompany } = useActiveProfile()
  const { canEdit, checkPermission } = useCompanyPermissions(activeProfile)

  const settingsHref = isCompany && activeProfile?.slug
    ? `/organization/${activeProfile.slug}/settings`
    : "/settings";

  const analyticsHref = isCompany && activeProfile?.slug ? `/organization/${activeProfile.slug}/analytics` : "/analytics";
  const profileHref = activeProfile?.type === 'COMPANY' && activeProfile.slug
    ? `/organization/${activeProfile.slug}`
    : '/profile';

  const sections = useMemo(() => [
    {
      title: 'Core',
      items: [
        { icon: IconoirHome, label: 'Feed', href: '/feed', show: true },
        { icon: Users, label: 'Connection', href: '/connections', show: true },
        { icon: Compass, label: 'Explore', href: '/explore', show: false },
        { icon: Sparkles, label: 'AI', href: '/ai-assistant', show: false },
      ]
    },
    {
      title: 'Work',
      items: [
        { icon: (props: any) => <Icon icon="hugeicons:job-search" {...props} />, label: 'Jobs', href: '/jobs', show: !isCompany || checkPermission('POST_JOBS') || checkPermission('VIEW_APPLICANTS') },
        { icon: (props: any) => <Icon icon="uit:calender" {...props} />, label: 'Events', href: '/events', show: false },
      ]
    },
    {
      title: 'Insights',
      items: [
        { icon: (props: any) => <Icon icon="hugeicons:analytics-up" {...props} />, label: 'Analytics', href: analyticsHref, show: !isCompany || checkPermission('VIEW_ANALYTICS') },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: (props: any) => <Icon icon="iconoir:profile-circle" {...props} />, label: 'Profile', href: profileHref, show: true },
        { icon: Settings, label: 'Settings', href: settingsHref, show: !isCompany || canEdit || checkPermission('MANAGE_SETTINGS') },
      ]
    }
  ], [isCompany, checkPermission, analyticsHref, profileHref, settingsHref, canEdit]);

  const isActive = (href: string) => {
    const currentPath = optimisticPath || pathname
    if (!currentPath) return false
    if (href === '/feed') return currentPath === '/feed' || currentPath === '/'
    if (href.startsWith('/organization/') && !href.endsWith('/settings') && !href.endsWith('/analytics')) {
      return currentPath === href;
    }
    return currentPath.startsWith(href)
  }

  return (
    <aside className={`sidebar ${className || ''}`} aria-label="Primary navigation">
      {/* Logo */}
      <div className="sidebar__logo">
        <Link 
          href="/feed"
          onClick={(e) => {
            if (pathname === '/feed' || pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              queryClient.invalidateQueries({ queryKey: ['feed'] });
            }
          }}
          className="relative w-14 h-14 block"
        >
          <Image
            src="/assets/weblogo.png.PNG"
            alt="Cocpit"
            fill
            className="sidebar__logo-img"
          />
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar__nav" aria-label="Main sections">
        {sections.map((section) => {
          const visibleItems = section.items.filter(i => i.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="sidebar__section">
              <h3 className="sidebar__section-title">
                {section.title}
              </h3>
              <div className="sidebar__items">
                {visibleItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        // Use flushSync to force an immediate, synchronous re-render 
                        // before the Next.js routing transition begins.
                        flushSync(() => {
                          setOptimisticPath(item.href)
                        })
                        handleNavClick(e, item.href)
                      }}
                      className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`}
                    >
                      <item.icon className="sidebar__item-icon" />
                      <span className="sidebar__item-label">
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Cocpit Business CTA */}
      <div className="sidebar__business-cta" aria-label="Business navigation">
        <Link
          href={isCompany ? "/business/overview" : "/company-onboarding"}
          className="sidebar__business-btn"
          onClick={() => {
            if (!isCompany) {
              useCompanyOnboardingStore.getState().resetStore();
            }
          }}
        >
          Cocpit business
        </Link>
      </div>
    </aside>
  )
}

export default DarkSidebar
