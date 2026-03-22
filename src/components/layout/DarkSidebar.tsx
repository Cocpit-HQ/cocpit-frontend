"use client"

import React from 'react'
import { Home, Users, Calendar, User, Settings, Briefcase, BarChart3, Bot } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProfileSwitcher } from './ProfileSwitcher'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { useCompanyPermissions } from '@/components/organizations/hooks/use-company'
import { useNavigationMemoryLink } from '@/hooks/use-navigation-memory'

interface DarkSidebarProps {
  className?: string
}

export function DarkSidebar({ className }: DarkSidebarProps) {
  const pathname = usePathname()
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

  const allNavItems = [
    { icon: Home, label: 'Feed', subtext: 'Latest updates', href: '/feed', show: true },
    { icon: Users, label: 'Showcase', subtext: 'Professional stories', href: '/showcase', show: true },
    { icon: Bot, label: 'AI Assistant', subtext: 'Smart suggestions', href: '/ai-assistant', show: true },
    { icon: Calendar, label: 'Events', subtext: 'Network & earn', href: '/events', show: true },
    { icon: User, label: 'Profile', subtext: 'Your presence', href: profileHref, show: true },
    { icon: Settings, label: 'Settings', subtext: 'Preferences', href: settingsHref, show: !isCompany || canEdit || checkPermission('MANAGE_SETTINGS') },
  ];

  const navItems = allNavItems.filter(item => item.show);

  const allQuickActions = [
    { icon: Briefcase, label: 'Jobs', badge: '12 new', href: '/jobs', show: !isCompany || checkPermission('POST_JOBS') || checkPermission('VIEW_APPLICANTS') },
    { icon: BarChart3, label: 'Analytics', badge: 'Insights', href: analyticsHref, show: !isCompany || checkPermission('VIEW_ANALYTICS') },
  ];

  const quickActions = allQuickActions.filter(item => item.show);

  const isActive = (href: string) => {
    if (!pathname) return false

    // Feed special case
    if (href === '/feed') {
      return pathname === '/feed' || pathname === '/'
    }

    // Profile special case
    if (href === '/profile') {
      return pathname === '/profile'
    }

    // Default behavior
    
    // For organization profile, ensure we don't match sub-paths like /settings
    if (href.startsWith('/organization/') && !href.endsWith('/settings') && !href.endsWith('/analytics')) {
        return pathname === href;
    }

    return pathname.startsWith(href)
  }

  return (
    <aside className={`w-64 h-screen fixed left-0 top-0 flex flex-col border-r bg-sidebar border-sidebar-border ${className}`}>
      <div className="px-6 py-6 border-b border-sidebar-border">
        <h1 className="text-2xl text-primary">COCPIT</h1>
      </div>

      <div className="flex-1 py-6 overflow-auto">
        <div className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${active ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                <Icon className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <div className={`${active ? 'text-primary-foreground' : 'text-sidebar-foreground'}`}>{item.label}</div>
                  {item.subtext && <div className={`text-xs ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{item.subtext}</div>}
                </div>
              </Link>
            )
          })}
        </div>

        {quickActions.length > 0 && (
          <div className="mt-8 px-3">
            <h3 className="text-xs text-muted-foreground px-3 mb-2">QUICK ACTIONS</h3>
            <div className="space-y-1">
              {quickActions.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link key={item.label} href={item.href} onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, item.href)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${active ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                    <Icon className="w-5 h-5" />
                    <div className="flex-1 text-left">
                      <div className="text-sidebar-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.badge}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50">
          <ProfileSwitcher showArrow={true} align="start" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{activeProfile?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {activeProfile?.type === 'USER' ? 'Personal Account' : (activeProfile?.entityType === 'INSTITUTION' ? 'Institution' : 'Company')}
            </p>
          </div>
        </div>
      </div>

    </aside>
  )
}

export default DarkSidebar
