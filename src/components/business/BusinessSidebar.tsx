"use client"

import React from 'react'
import { LayoutDashboard, Building2, Megaphone, BarChart3, Users, ArrowLeft, Target, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useActiveProfile } from '@/context/ActiveProfileContext'

export function BusinessSidebar() {
  const pathname = usePathname()
  const { isCompany } = useActiveProfile()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/business/overview' },
    { icon: Building2, label: 'My Company', href: '/business/company' },
    { icon: Megaphone, label: 'Marketing', href: '/business/marketing' },
    { icon: BarChart3, label: 'Analytics', href: '/business/analytics' },
    { icon: Target, label: 'Leads', href: '/business/leads' },
    { icon: Users, label: 'Connections', href: '/business/connections' },
  ]

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col bg-[#020617] border-r border-white/5 z-40">
      <div className="px-8 py-10">
        <h2 className="text-xl font-bold text-white tracking-tight">Business Cocpit</h2>
        <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1 uppercase">Professional Suite</p>
      </div>

      <div className="px-4 mb-4">
        <Link
          href="/feed"
          className="flex items-center gap-2.5 px-4 py-2 text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
          <span>Return to Social</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all group ${isActive ? 'text-[#818cf8] bg-[#818cf8]/5' :
                  'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#818cf8]' :
                  'text-slate-400 group-hover:text-white'
                }`} />
              <span className="text-[13px] font-medium tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute left-[-16px] w-1 h-6 bg-[#818cf8] rounded-r-full shadow-[4px_0_12px_rgba(129,140,248,0.5)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* New Campaign Button */}
      <div className="p-4 mt-auto">
        <Button
          className="w-full h-12 rounded-xl bg-[#818cf8]/80 hover:bg-[#818cf8] text-white flex items-center gap-2 font-bold shadow-[0_4px_20px_-5px_rgba(129,140,248,0.4)] transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>New Campaign</span>
        </Button>
      </div>
    </aside>
  )
}
