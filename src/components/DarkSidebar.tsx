"use client"

import React from 'react'
import { Home, Users, Calendar, User, Settings, Briefcase, BarChart3, Crown } from 'lucide-react'

type Page = string

interface DarkSidebarProps {
  navigateTo?: (page: Page) => void
  currentPage?: string
}

export function DarkSidebar({ navigateTo = () => {}, currentPage = 'home' }: DarkSidebarProps) {
  const navItems = [
    { icon: Home, label: 'Feed', subtext: 'Latest updates', page: 'home' as Page },
    { icon: Users, label: 'Showcase', subtext: 'Professional stories', page: 'network' as Page },
    { icon: Calendar, label: 'Events', subtext: 'Network & earn', page: 'events' as Page },
    { icon: User, label: 'Profile', subtext: 'Your presence', page: 'profile' as Page },
    { icon: Settings, label: 'Settings', subtext: 'Preferences', page: 'settings' as Page },
  ];

  const quickActions = [
    { icon: Briefcase, label: 'Jobs', badge: '12 new', page: 'jobs' as Page },
    { icon: BarChart3, label: 'Analytics', badge: 'Insights', page: 'analytics' as Page },
    
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col border-r bg-sidebar border-sidebar-border">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <h1 className="text-2xl text-primary">COCPIT</h1>
      </div>

      <div className="flex-1 py-6 overflow-auto">
        <div className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.page === currentPage
            return (
              <button
                key={item.label}
                onClick={() => navigateTo(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                <Icon className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <div className={`${isActive ? 'text-primary-foreground' : 'text-sidebar-foreground'}`}>{item.label}</div>
                  {item.subtext && <div className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{item.subtext}</div>}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 px-3">
          <h3 className="text-xs text-muted-foreground px-3 mb-2">QUICK ACTIONS</h3>
          <div className="space-y-1">
            {quickActions.map((item) => {
              const Icon = item.icon
              return (
                <button key={item.label} onClick={() => navigateTo(item.page)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <Icon className="w-5 h-5" />
                  <div className="flex-1 text-left">
                    <div className="text-sidebar-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.badge}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-6 h-6" />
            <h3>Go Premium</h3>
          </div>
          <p className="text-sm mb-4 text-white/90">Unlock advanced features and analytics</p>
          <button className="w-full bg-white text-orange-600 py-2.5 rounded-lg hover:bg-gray-100 transition-all">Upgrade Now</button>
        </div>
      </div>
    </aside>
  )
}

export default DarkSidebar
