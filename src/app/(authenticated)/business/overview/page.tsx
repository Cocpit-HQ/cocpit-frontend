"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Rss, 
  Briefcase, 
  Calendar, 
  ArrowUpRight, 
  Plus, 
  Zap, 
  Trophy,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { companyService } from '@/services/organization.service'
import { StatCard, ActivityItem } from '@/components/business/BusinessOverview'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function OverviewPage() {
  const { activeProfile } = useActiveProfile()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recentPosts, setRecentPosts] = useState<any[]>([])

  useEffect(() => {
    const fetchOverview = async () => {
      // If we don't have an active profile ID, we can't fetch real data yet.
      // But we still want to show the UI for exploration.
      if (!activeProfile?.id) {
        setLoading(false)
        return
      }

      try {
        const [analytics, postsResponse] = await Promise.all([
          companyService.getAnalyticsOverview(activeProfile.id).catch(err => {
            console.warn('Analytics API failed (expected in exploration mode):', err.message)
            return { followers: { total: 1240 }, views: { total: 8500 } } // Mock fallback
          }),
          companyService.getOrganizationPosts(activeProfile.id).catch(err => {
            console.warn('Posts API failed (expected in exploration mode):', err.message)
            return { posts: [] }
          })
        ])
        
        setStats(analytics)
        setRecentPosts(postsResponse?.posts?.slice(0, 5) || [])
      } catch (error) {
        console.error('Failed to fetch overview data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchOverview()
  }, [activeProfile?.id])

  if (loading) {
    return (
      <div className="space-y-10 animate-pulse">
        <div className="h-32 bg-white/5 rounded-[32px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-white/5 rounded-[32px]" />)}
        </div>
      </div>
    )
  }

  const kpis = [
    { label: 'Total Followers', value: stats?.followers?.total || 0, icon: Users, trend: { value: 12, isPositive: true } },
    { label: 'Profile Views', value: stats?.views?.total || 0, icon: TrendingUp, trend: { value: 8, isPositive: true } },
    { label: 'Active Jobs', value: activeProfile?.viewer_role_data?.permissions?.includes('POST_JOBS') ? '4' : '0', icon: Briefcase }, // Mocked or from job service
    { label: 'Monthly Reach', value: '12.4k', icon: Rss, trend: { value: 15, isPositive: true } }
  ]

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-20">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative p-10 rounded-[40px] bg-gradient-to-br from-[#818cf8]/20 via-indigo-500/5 to-transparent border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Trophy className="w-48 h-48 text-[#818cf8]" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <Avatar className="h-24 w-24 rounded-3xl ring-2 ring-white/10 shadow-2xl">
            <AvatarImage src={activeProfile?.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-slate-800 text-slate-400 text-2xl font-black uppercase">
              {activeProfile?.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center md:text-left flex-1 space-y-2">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-[#818cf8]/20 border border-[#818cf8]/30 text-[10px] font-black text-[#818cf8] uppercase tracking-widest">Premium Account</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Venture Suite v2.0</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
              Welcome back, {activeProfile?.name}
            </h1>
            <p className="text-slate-400 font-bold tracking-tight opacity-80 max-w-xl">
              Your company profile and reach are performing 12% better than last month. 
              Review your newest leads and content insights below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-end shrink-0">
             <Button className="h-14 px-8 rounded-2xl bg-[#818cf8] hover:bg-[#818cf8]/90 text-white shadow-xl shadow-[#818cf8]/20 border-none font-black text-xs uppercase tracking-widest gap-2">
                <Plus className="w-5 h-5" />
                New Activity
             </Button>
          </div>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <StatCard key={kpi.label} {...kpi} delay={i * 0.1} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10">
        {/* Activity Feed */}
        <div className="p-10 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#818cf8]/5 blur-[80px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-[0.2em]">Live Stream</h3>
            </div>
            <Link href="/business/marketing" className="text-[10px] font-black text-slate-500 hover:text-[#818cf8] transition-colors uppercase tracking-[0.2em] flex items-center gap-1">
              Marketing Hub <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4 relative z-10">
            <ActivityItem 
              key="static-member-1"
              type="member"
              title="New Team Member: Sarah Connor"
              timestamp="2M AGO"
              description="Joined as Senior Software Engineer via direct application."
            />
            <ActivityItem 
              key="static-job-1"
              type="job"
              title="Job Posted: Fullstack Developer"
              timestamp="5H AGO"
              description="New listing published targeting Mid-Level talent."
            />
            {recentPosts.map((post, i) => (
              <ActivityItem 
                key={post.id || `post-${i}`}
                type="post"
                title="New Company Story Published"
                timestamp={`${i + 1}D AGO`}
                description={post.content ? (post.content.slice(0, 60) + '...') : 'No content available'}
              />
            ))}
          </div>

          <Button variant="ghost" className="w-full mt-8 h-14 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest gap-2">
            View Full Timeline
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Hiring Pipeline Mini Funnel */}
        <div className="p-10 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group h-full">
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none opacity-40" />
           
           <div className="flex items-center gap-4 mb-10">
              <div className="p-3 rounded-2xl bg-[#818cf8]/10 border border-[#818cf8]/20 text-[#818cf8]">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-[0.2em]">Hiring Funnel</h3>
           </div>

           <div className="space-y-8 relative z-10">
              {[
                { label: 'Active Pipeline', value: '42 Candidates', sub: '7 in interview phase', color: 'bg-[#818cf8]', width: '85%' },
                { label: 'Engagement Rate', value: '78% Acceptance', sub: 'Based on last 50 offers', color: 'bg-indigo-400', width: '78%' },
                { label: 'Time to Hire', value: '18 Days', sub: 'Outperforming 80% of industry', color: 'bg-slate-700', width: '60%' }
              ].map((item, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{item.label}</h4>
                      <p className="text-base font-bold text-white tracking-tight">{item.value}</p>
                    </div>
                    <span className="text-[10px] italic text-slate-600 font-medium tracking-tight h-10 flex items-end">{item.sub}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: item.width }}
                      transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                      className={cn("h-full rounded-full shadow-[0_0_12px_rgba(129,140,248,0.3)]", item.color)} 
                    />
                  </div>
                </div>
              ))}
           </div>

           <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5">
              <h4 className="text-[10px] font-black text-[#818cf8] uppercase tracking-widest mb-2">AI Talent Insight</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed italic opacity-80">
                You have 12 highly qualified candidates in your "React" pipeline matching your recent tech-stack update.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
