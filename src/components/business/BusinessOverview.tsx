"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  delay?: number
}

export function StatCard({ label, value, icon: Icon, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="p-8 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:bg-[#0a0f1d]/60 transition-all duration-500"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#818cf8]/5 blur-[60px] pointer-events-none group-hover:bg-[#818cf8]/10 transition-all duration-700" />
      
      <div className="flex items-start justify-between mb-6">
        <div className="p-3.5 rounded-2xl bg-[#818cf8]/10 border border-[#818cf8]/20 text-[#818cf8] group-hover:scale-110 transition-transform duration-500">
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
            trend.isPositive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}>
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</h4>
        <div className="text-3xl font-black text-white tracking-tighter tabular-nums">
          {value}
        </div>
      </div>
    </motion.div>
  )
}

interface ActivityItemProps {
  title: string
  timestamp: string
  type: 'post' | 'job' | 'event' | 'member'
  description?: string
}

export function ActivityItem({ title, timestamp, type, description }: ActivityItemProps) {
  const icons = {
    post: 'bg-blue-500',
    job: 'bg-emerald-500',
    event: 'bg-violet-500',
    member: 'bg-amber-500'
  }

  return (
    <div className="flex gap-5 group py-4 items-start first:pt-0 last:pb-0">
      <div className="relative mt-1">
        <div className={cn("w-2.5 h-2.5 rounded-full z-10 relative ring-4 ring-[#020617]", icons[type])} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[calc(100%+32px)] bg-white/5" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <h5 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors tracking-tight leading-none">{title}</h5>
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0">{timestamp}</span>
        </div>
        {description && (
          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-1 italic">{description}</p>
        )}
      </div>
    </div>
  )
}
