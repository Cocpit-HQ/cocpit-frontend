"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  PieChart, 
  Target, 
  Globe, 
  Download, 
  Calendar,
  ChevronDown,
  ArrowUpRight,
  Info,
  Clock,
  Briefcase,
  Users,
  Rss
} from 'lucide-react'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FeatureGuard } from "@/components/feature-flags"

// Import existing data providers and components
import {
    DateRange,
    getKpiMetrics,
    getDailyViews,
    getFollowerGrowth,
    getContentEngagement,
    getActivityHeatmap,
    getInsights,
} from '@/app/(authenticated)/(dashboard)/company-analytics/data'

import { DailyViewsChart } from '@/components/organization-analytics/DailyViewsChart'
import { FollowerGrowthChart } from '@/components/organization-analytics/FollowerGrowthChart'
import { ContentEngagementChart } from '@/components/organization-analytics/ContentEngagementChart'
import { ActivityHeatmap } from '@/components/organization-analytics/ActivityHeatmap'
import { InsightsPanel } from '@/components/organization-analytics/InsightsPanel'
import { OrganizationKpiCards } from '@/components/organization-analytics/OrganizationKpiCards'

export default function BusinessAnalyticsPage() {
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const { activeProfile } = useActiveProfile()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoized Data
  const kpiMetrics = useMemo(() => getKpiMetrics(dateRange), [dateRange])
  const dailyViews = useMemo(() => getDailyViews(dateRange), [dateRange])
  const followerGrowth = useMemo(() => getFollowerGrowth(dateRange), [dateRange])
  const contentEngagement = useMemo(() => getContentEngagement(dateRange), [dateRange])
  const heatmapData = useMemo(() => getActivityHeatmap(), [])
  const insights = useMemo(() => getInsights(), [])

  if (!mounted) return null

  return (
    <FeatureGuard featureKey="enableAnalyticsTab" moduleName="Analytics">
      <div className="max-w-[1400px] mx-auto space-y-12 pb-20">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <div className="p-2.5 rounded-xl bg-[#818cf8]/10 border border-[#818cf8]/20 text-[#818cf8]">
                  <BarChart3 className="w-5 h-5 font-black" />
               </div>
               <h1 className="text-3xl font-black text-white tracking-tight uppercase tracking-widest leading-none">Intelligence Suite</h1>
            </div>
            <p className="text-slate-400 font-bold tracking-tight opacity-70 ml-1">Deep-dive performance metrics and AI-driven growth insights.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
               <select 
                 className="appearance-none h-12 pl-6 pr-12 rounded-xl bg-[#0a0f1d]/60 border border-white/5 text-xs font-black text-slate-300 uppercase tracking-widest focus:outline-none focus:border-[#818cf8]/40 transition-all cursor-pointer backdrop-blur-md"
                 value={dateRange}
                 onChange={(e) => setDateRange(e.target.value as DateRange)}
               >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">This Year</option>
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
            </div>
            
            <Button className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black text-[11px] uppercase tracking-widest gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* KPI Cards section */}
        <div className="cockpit-analytics-kpis">
           <OrganizationKpiCards metrics={kpiMetrics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
           <div className="space-y-10">
              {/* Reach & Views */}
              <div className="p-10 rounded-[40px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                 <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                       <div className="p-3 rounded-2xl bg-[#818cf8]/10 border border-[#818cf8]/20 text-[#818cf8]">
                         <TrendingUp className="w-5 h-5" />
                       </div>
                       <h3 className="text-xl font-black text-white uppercase tracking-widest">Growth Velocity</h3>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#818cf8]" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Page Views</span>
                       </div>
                    </div>
                 </div>
                 <div className="cockpit-chart-dark">
                    <DailyViewsChart data={dailyViews} />
                 </div>
              </div>

              {/* Content & Engagement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="p-8 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-8">Follower Growth</h4>
                    <div className="cockpit-chart-dark h-[300px]">
                       <FollowerGrowthChart data={followerGrowth} />
                    </div>
                 </div>
                 <div className="p-8 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-8">Engagement Mix</h4>
                    <div className="cockpit-chart-dark h-[300px]">
                       <ContentEngagementChart data={contentEngagement} />
                    </div>
                 </div>
              </div>

              {/* HEATMAP / BEST TIME TO POST */}
              <div className="p-10 rounded-[40px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                 <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                       <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                         <Clock className="w-5 h-5" />
                       </div>
                       <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-widest leading-none">Best Time to Post</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">AI Recommendation based on audience activity</p>
                       </div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                       Premium Insight ⚡
                    </div>
                 </div>
                 <div className="cockpit-heatmap-dark">
                    <ActivityHeatmap data={heatmapData} />
                 </div>
              </div>
           </div>

           {/* Sidebar Stats & Insights */}
           <div className="space-y-10">
              {/* Competitor Benchmarking */}
              <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#818cf8]/10 via-[#0a0f1d]/40 to-transparent border border-white/5 backdrop-blur-xl shadow-2xl space-y-8">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Competitor Index</h4>
                    <PieChart className="w-4 h-4 text-[#818cf8]" />
                 </div>
                 
                 <div className="space-y-6">
                    {[
                      { label: 'Your Growth', value: '+12.4%', color: 'from-[#818cf8] to-indigo-500', width: '85%' },
                      { label: 'Industry Avg', value: '+4.2%', color: 'from-slate-700 to-slate-800', width: '40%' },
                      { label: 'Top 10% Orgs', value: '+18.1%', color: 'from-emerald-500 to-emerald-600', width: '92%' }
                    ].map((bench, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">{bench.label}</span>
                            <span className="text-white">{bench.value}</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: bench.width }}
                              transition={{ duration: 1, delay: i * 0.2 }}
                              className={cn("h-full rounded-full bg-gradient-to-r", bench.color)}
                            />
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">
                      "Your organic reach velocity is in the top 5% for the 'Technology' sector this month."
                    </p>
                 </div>
              </div>

              {/* AI Insights Panel */}
              <div className="p-8 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl flex flex-col h-fit">
                 <div className="flex items-center gap-3 mb-8">
                    <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Smart Insights</h4>
                 </div>
                 <div className="cockpit-insights-dark space-y-4">
                    <InsightsPanel insights={insights} />
                 </div>
              </div>

              {/* Reach Velocity Score */}
              <div className="p-10 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target className="w-32 h-32 text-[#818cf8]" />
                 </div>
                 <div className="relative z-10 space-y-4">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Platform Reach Velocity</h4>
                    <div className="flex items-center justify-center gap-2">
                       <span className="text-6xl font-black text-white tracking-tighter tabular-nums">78</span>
                       <span className="text-xl font-black text-[#818cf8] tracking-widest">/100</span>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      Exceptional Momentum
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <style jsx global>{`
          /* Analytics Components Theme Overrides */
          .cockpit-analytics-kpis > div { 
            display: grid !important;
            grid-template-cols: repeat(auto-fit, minmax(240px, 1fr)) !important;
            gap: 1.5rem !important;
            background: transparent !important;
          }
          .cockpit-analytics-kpis .bg-card {
            background: rgba(10, 15, 29, 0.4) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
            border-radius: 32px !important;
            padding: 2rem !important;
            backdrop-filter: blur(20px) !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          }
          .cockpit-analytics-kpis p.text-muted-foreground { font-size: 10px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.15em !important; color: #64748b !important; }
          .cockpit-analytics-kpis div.text-2xl { font-weight: 900 !important; color: white !important; font-size: 2rem !important; letter-spacing: -0.05em !important; }
          
          .cockpit-chart-dark .recharts-cartesian-grid-horizontal line,
          .cockpit-chart-dark .recharts-cartesian-grid-vertical line {
            stroke: rgba(255, 255, 255, 0.05) !important;
          }
          .cockpit-chart-dark .recharts-text {
            fill: rgba(148, 163, 184, 0.5) !important;
            font-weight: 700 !important;
            font-size: 10px !important;
          }
          .cockpit-chart-dark .recharts-tooltip-wrapper .bg-background {
            background: #0f172a !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          }
          
          .cockpit-heatmap-dark > div { background: transparent !important; border: none !important; padding: 0 !important; }
          .cockpit-heatmap-dark h2 { display: none !important; }
          
          .cockpit-insights-dark > div { background: transparent !important; border: none !important; padding: 0 !important; box-shadow: none !important; }
          .cockpit-insights-dark h2 { display: none !important; }
        `}</style>
      </div>
    </FeatureGuard>
  )
}
