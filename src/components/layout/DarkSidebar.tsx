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
import { useCompanyPermissions } from '@/features/businessProfile'
import { useNavigationMemoryLink } from '@/hooks/use-navigation-memory'
import { useCompanyOnboardingStore } from '@/features/company-onboarding/store/company-onboarding.store'
import { useQueryClient } from '@tanstack/react-query'
import { useFeatureFlags } from '@/context/FeatureFlagContext'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  const { isFeatureActive } = useFeatureFlags()

  const settingsHref = isCompany && activeProfile?.slug
    ? `/organization/${activeProfile.slug}/settings`
    : "/settings";


  const analyticsHref = isCompany && activeProfile?.slug ? `/organization/${activeProfile.slug}/analytics` : "/analytics";
  const profileHref = activeProfile?.type === 'COMPANY' && activeProfile.slug
    ? `/organization/${activeProfile.slug}`
    : '/profile';

  const sections = useMemo(() => {
    if (isCompany) {
      return [
        {
          title: 'Core',
          items: [
            { icon: IconoirHome, label: 'Feed', href: '/feed', show: isFeatureActive('enableFeedAccess') },
            { icon: (props: any) => <Icon icon="quill:inbox-newsletter" {...props} />, label: 'Channel', href: '/channel', show: true, disabled: !checkPermission('CHANNEL') },
            { icon: Compass, label: 'Explore', href: '/explore', show: false },
            { icon: Sparkles, label: 'AI', href: '/ai-assistant', show: isFeatureActive('enableAITab') },
          ]
        },
        {
          title: 'Work',
          items: [
            { icon: (props: any) => <Icon icon="hugeicons:job-search" {...props} />, label: 'Jobs', href: '/jobs', show: isFeatureActive('enableJobsBoard'), disabled: !(checkPermission('POST_JOBS') || checkPermission('VIEW_APPLICANTS')) },
            { icon: (props: any) => <Icon icon="uit:calender" {...props} />, label: 'Events', href: '/events', show: false },
          ]
        },
        {
          title: 'Insights',
          items: [
            { icon: (props: any) => <Icon icon="streamline-ultimate:team-meeting" {...props} />, label: 'Team', href: '/team', show: true, disabled: !checkPermission('TEAMS') },
            { icon: (props: any) => <Icon icon="hugeicons:analytics-up" {...props} />, label: 'Analytics', href: analyticsHref, show: true, disabled: !checkPermission('VIEW_ANALYTICS') },
          ]
        },
        {
          title: 'Account',
          items: [
            { icon: (props: any) => <Icon icon="iconoir:profile-circle" {...props} />, label: 'Profile', href: profileHref, show: isFeatureActive('enableProfileTab') },
            { icon: Settings, label: 'Settings', href: settingsHref, show: isFeatureActive('enableSettingsModule'), disabled: !checkPermission('SETTINGS') },
          ]
        }
      ];
    }

    return [
      {
        title: 'Core',
        items: [
          { icon: IconoirHome, label: 'Feed', href: '/feed', show: isFeatureActive('enableFeedAccess') },
          { icon: (props: any) => <Icon icon="quill:inbox-newsletter" {...props} />, label: 'Channel', href: '/channels', show: true },
          { icon: Users, label: 'Connection', href: '/connections', show: isFeatureActive('enableConnectionsTab') },
          { icon: Compass, label: 'Explore', href: '/explore', show: false },
          { icon: Sparkles, label: 'AI', href: '/ai-assistant', show: isFeatureActive('enableAITab') },
        ]
      },
      {
        title: 'Work',
        items: [
          { icon: (props: any) => <Icon icon="hugeicons:job-search" {...props} />, label: 'Jobs', href: '/jobs', show: isFeatureActive('enableJobsBoard') },
          { icon: (props: any) => <Icon icon="uit:calender" {...props} />, label: 'Events', href: '/events', show: false },
        ]
      },
      {
        title: 'Insights',
        items: [
          { icon: (props: any) => <Icon icon="hugeicons:analytics-up" {...props} />, label: 'Analytics', href: analyticsHref, show: true },
        ]
      },
      {
        title: 'Account',
        items: [
          { icon: (props: any) => <Icon icon="iconoir:profile-circle" {...props} />, label: 'Profile', href: profileHref, show: isFeatureActive('enableProfileTab') },
          { icon: Settings, label: 'Settings', href: settingsHref, show: isFeatureActive('enableSettingsModule') },
        ]
      }
    ];
  }, [isCompany, checkPermission, analyticsHref, profileHref, settingsHref, canEdit, isFeatureActive]);

  const isActive = (href: string) => {
    const currentPath = optimisticPath || pathname
    if (!currentPath) return false
    if (href === '/feed') return currentPath === '/feed' || currentPath === '/'
    if (href === '/channel') return currentPath === '/channel' || currentPath.startsWith('/channel/')
    if (href.startsWith('/organization/') && !href.endsWith('/settings') && !href.endsWith('/analytics')) {
      return currentPath === href;
    }
    return currentPath.startsWith(href)
  }

  return (
    <aside className={`sidebar ${isCompany ? 'sidebar--company' : ''} ${className || ''}`} aria-label="Primary navigation">
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
                {visibleItems.map((item: any) => {
                  const active = isActive(item.href)

                  const content = (
                    <>
                      <item.icon className="sidebar__item-icon" />
                      <span className="sidebar__item-label">
                        {item.label}
                      </span>
                    </>
                  )

                  if (item.disabled) {
                    return (
                      <TooltipProvider key={item.label} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`sidebar__item ${isCompany ? 'sidebar__item--company' : ''} !cursor-default`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              {content}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-gray-800 text-white border-gray-700">
                            <p>You don't have permission to access this</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  }

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
                      className={`sidebar__item ${isCompany ? 'sidebar__item--company' : ''} ${active ? (isCompany ? 'sidebar__item--company-active' : 'sidebar__item--active') : ''}`}
                    >
                      {content}
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
          {isCompany ? 'Cocpit Engine' : 'Cocpit business'}
        </Link>
      </div>
    </aside>
  )
}

export default DarkSidebar
