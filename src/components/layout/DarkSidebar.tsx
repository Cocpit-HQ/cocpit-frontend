"use client"

import React from 'react'
import { Home, Users, Compass, Sparkles, Briefcase, Calendar, BarChart3, User, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
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

  const sections = [
    {
      title: 'Core',
      items: [
        { icon: Home, label: 'Feed', href: '/feed', show: true },
        { icon: Users, label: 'Connection', href: '/connections', show: true },
        { icon: Compass, label: 'Explore', href: '/explore', show: true },
        { icon: Sparkles, label: 'AI', href: '/ai-assistant', show: true },
      ]
    },
    {
      title: 'Work',
      items: [
        { icon: Briefcase, label: 'Jobs', href: '/jobs', show: !isCompany || checkPermission('POST_JOBS') || checkPermission('VIEW_APPLICANTS') },
        { icon: Calendar, label: 'Events', href: '/events', show: true },
      ]
    },
    {
      title: 'Insights',
      items: [
        { icon: BarChart3, label: 'Analytics', href: analyticsHref, show: !isCompany || checkPermission('VIEW_ANALYTICS') },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', href: profileHref, show: true },
        { icon: Settings, label: 'Settings', href: settingsHref, show: !isCompany || canEdit || checkPermission('MANAGE_SETTINGS') },
      ]
    }
  ];

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/feed') return pathname === '/feed' || pathname === '/'
    if (href.startsWith('/organization/') && !href.endsWith('/settings') && !href.endsWith('/analytics')) {
        return pathname === href;
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className={`w-72 h-screen fixed left-0 top-0 flex flex-col bg-white border-r border-slate-100 ${className}`}>
      {/* Header / Logo */}
      <div className="px-8 py-8 flex items-center gap-3">
        <div className="relative w-8 h-8">
          <Image 
            src="/assets/logo.PNG" 
            alt="Cocpit" 
            fill 
            className="object-contain"
          />
        </div>
        <span className="sr-only">Cocpit</span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-none">
        {sections.map((section) => {
          const visibleItems = section.items.filter(i => i.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              <h3 className="px-4 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, item.href)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        active 
                          ? 'bg-[#EEE9FF] text-[#6366F1]' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-[22px] h-[22px] ${active ? 'text-[#6366F1]' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={active ? 2.5 : 2} />
                      <span className={`text-[15px] font-medium leading-none`}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Business Hub Card */}
        <div className="mt-4 px-2">
          <div className="bg-[#EEE9FF] rounded-[24px] p-6 relative overflow-hidden group transition-all hover:bg-[#E5DEFF] cursor-pointer">
            <Link 
              href={isCompany ? "/business/overview" : "/business/create-company"}
              className="block"
            >
              <h4 className="text-[#6366F1] font-semibold text-[15px] mb-1">Business Hub</h4>
              <p className="text-[#6366F1]/70 text-[12px] leading-snug">
                Manage your business page here
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-6 border-t border-slate-50">
        <div className="flex items-center gap-3 px-2">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-slate-100 flex-shrink-0">
            {activeProfile?.avatar_url ? (
              <Image 
                src={activeProfile.avatar_url} 
                alt={activeProfile.name} 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <User className="w-6 h-6 text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-slate-900 text-[15px] truncate">
              {activeProfile?.name || 'Cocpit User'}
            </h5>
            <p className="text-slate-400 text-[13px] truncate">
              @{activeProfile?.slug || activeProfile?.name?.toLowerCase().replace(/\s/g, '') || 'cocpit23'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default DarkSidebar
