"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Megaphone, 
  Calendar as CalendarIcon, 
  Plus, 
  MoreVertical, 
  Users, 
  Target, 
  Clock, 
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  Send,
  Layout,
  Zap
} from 'lucide-react'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type CampaignStatus = 'draft' | 'scheduled' | 'published' | 'archived'

interface Campaign {
  id: string
  name: string
  goal: 'Brand Awareness' | 'Hiring' | 'Product Launch' | 'Event Promotion'
  status: CampaignStatus
  startDate: string
  endDate: string
  reach: string
  engagement: string
}

const DEFAULT_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Q2 Tech Hiring Drive', goal: 'Hiring', status: 'published', startDate: '2024-04-01', endDate: '2024-04-30', reach: '12.4k', engagement: '8.2%' },
  { id: '2', name: 'Cloud Native Product Launch', goal: 'Product Launch', status: 'scheduled', startDate: '2024-05-15', endDate: '2024-06-15', reach: '0', engagement: '0%' },
  { id: '3', name: 'Diversity in Tech Webinar', goal: 'Event Promotion', status: 'draft', startDate: '2024-06-01', endDate: '2024-06-02', reach: '0', engagement: '0%' },
]

export default function MarketingPage() {
  const { activeProfile } = useActiveProfile()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [view, setView] = useState<'board' | 'calendar'>('board')

  useEffect(() => {
    const saved = localStorage.getItem(`cocpit_campaigns_${activeProfile?.id}`)
    if (saved) {
      setCampaigns(JSON.parse(saved))
    } else {
      setCampaigns(DEFAULT_CAMPAIGNS)
    }
  }, [activeProfile?.id])

  const saveCampaigns = (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns)
    localStorage.setItem(`cocpit_campaigns_${activeProfile?.id}`, JSON.stringify(newCampaigns))
  }

  const moveCampaign = (id: string, newStatus: CampaignStatus) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c)
    saveCampaigns(updated)
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-20">
      {/* Header section with View Toggle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-[#818cf8]/10 border border-[#818cf8]/20 text-[#818cf8]">
                <Megaphone className="w-5 h-5 font-black" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tight uppercase tracking-widest leading-none">Marketing Hub</h1>
          </div>
          <p className="text-slate-400 font-bold tracking-tight opacity-70 ml-1">Plan, launch, and track cross-platform campaigns.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center p-1 rounded-2xl bg-[#0a0f1d]/60 border border-white/5 backdrop-blur-md">
            <button
              onClick={() => setView('board')}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                view === 'board' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Layout className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                view === 'calendar' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>
          
          <Button className="h-12 px-6 rounded-xl bg-[#818cf8] hover:bg-[#818cf8]/90 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-xl shadow-[#818cf8]/10">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'board' ? (
          <motion.div 
            key="board"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start"
          >
            {(['draft', 'scheduled', 'published', 'archived'] as CampaignStatus[]).map((status) => (
              <div key={status} className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    {status} <span className="opacity-40">({campaigns.filter(c => c.status === status).length})</span>
                  </h3>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                </div>

                <div className="space-y-4 min-h-[500px] p-2 bg-[#0a0f1d]/20 rounded-[32px] border border-dashed border-white/5">
                  {campaigns.filter(c => c.status === status).map((campaign) => (
                    <div 
                      key={campaign.id} 
                      className="p-6 rounded-3xl bg-[#0f172a]/60 border border-white/5 hover:border-[#818cf8]/30 transition-all duration-500 group cursor-grab active:cursor-grabbing relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#818cf8]/5 blur-2xl pointer-events-none group-hover:bg-[#818cf8]/10" />
                      
                      <div className="flex items-start justify-between mb-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border",
                          campaign.goal === 'Hiring' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          campaign.goal === 'Product Launch' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}>
                          {campaign.goal}
                        </span>
                        <button className="text-slate-600 hover:text-white transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-tight leading-snug mb-4">{campaign.name}</h4>

                      <div className="flex items-center gap-4 mb-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Reach</p>
                          <p className="text-xs font-black text-slate-300 tabular-nums">{campaign.reach}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Engagement</p>
                          <p className="text-xs font-black text-slate-400 tabular-nums">{campaign.engagement}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex -space-x-2">
                           {[1, 2].map(i => (
                             <Avatar key={i} className="h-6 w-6 rounded-full border-2 border-[#020617] ring-1 ring-white/5">
                               <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Admin${i}`} />
                               <AvatarFallback>U</AvatarFallback>
                             </Avatar>
                           ))}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                           <Clock className="w-3 h-3" />
                           {campaign.startDate.split('-').slice(1).join('/')}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {campaigns.filter(c => c.status === status).length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center opacity-20">
                       <Plus className="w-8 h-8 mb-2" strokeWidth={1} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Drop here</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="calendar"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-10 rounded-[40px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl space-y-10"
          >
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-black text-white uppercase tracking-widest">April 2024</h3>
                  <div className="flex items-center gap-1">
                     <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"><ChevronLeft className="w-4 h-4" /></button>
                     <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"><ChevronRight className="w-4 h-4" /></button>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Post</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Event</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Job</span>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-[32px] overflow-hidden">
               {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                 <div key={day} className="bg-[#020617] p-4 text-center border-b border-white/5">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{day}</span>
                 </div>
               ))}
               {Array.from({ length: 31 }).map((_, i) => (
                 <div key={i} className="min-h-[140px] bg-[#020617]/40 p-4 border-r border-b border-white/5 group hover:bg-[#818cf8]/5 transition-colors relative">
                    <span className={cn("text-sm font-black text-slate-600 transition-colors group-hover:text-white", (i + 1 === 12) && "text-[#818cf8]")}>
                      {i + 1}
                    </span>
                    {i + 1 === 12 && (
                      <div className="mt-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                         <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">Published</p>
                         <p className="text-[10px] font-bold text-white truncate truncate">Tech Hiring Drive Blog</p>
                      </div>
                    )}
                    {i + 1 === 18 && (
                      <div className="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
                         <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">12:00 PM</p>
                         <p className="text-[10px] font-bold text-white truncate">Founder AMA Event</p>
                      </div>
                    )}
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Broadcast Post Panel */}
         <div className="p-10 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#818cf8]/5 blur-[100px] pointer-events-none" />
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 rounded-2xl bg-[#818cf8]/10 border border-[#818cf8]/20 text-[#818cf8]">
                 <Send className="w-5 h-5" />
               </div>
               <h3 className="text-xl font-black text-white uppercase tracking-widest">Broadcast Blast</h3>
            </div>
            
            <div className="space-y-6">
               <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                     <span>Target Audience</span>
                     <span className="text-[#818cf8]">1,240 Followers Reachable</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     {['All Followers', 'Paid Members', 'Recruiters'].map(aud => (
                       <button key={aud} className={cn(
                         "p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
                         aud === 'All Followers' ? "bg-[#818cf8]/10 border-[#818cf8]/40 text-[#818cf8]" : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                       )}>
                         {aud}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Broadcast Message</label>
                  <textarea 
                    className="w-full min-h-[140px] bg-slate-900/60 border border-white/5 rounded-3xl p-6 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#818cf8]/40 resize-none transition-all"
                    placeholder="Wanna share something major with your entire following? Type here..."
                  />
               </div>

               <Button className="w-full h-14 rounded-2xl bg-[#818cf8] hover:bg-[#818cf8]/90 text-white font-black text-xs uppercase tracking-widest gap-2">
                  Launch Broadcast
                  <Zap className="w-4 h-4 fill-current" />
               </Button>
            </div>
         </div>

         {/* Marketing Performance Overview */}
         <div className="p-10 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
            <div className="flex items-center gap-4 mb-10">
               <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                 <Target className="w-5 h-5" />
               </div>
               <h3 className="text-xl font-black text-white uppercase tracking-widest">ROI Analysis</h3>
            </div>

            <div className="flex-1 space-y-10">
               {[
                 { label: 'Organic Viral Reach', value: '45.2k', trend: '+22%', sub: 'Last 90 days performance' },
                 { label: 'Avg Engagement Rate', value: '7.82%', trend: '+1.4%', sub: '2x Higher than industry avg' },
                 { label: 'Conversion Velocity', value: '1.2 hr', trend: '-8m', sub: 'Faster response to broadcasts' }
               ].map((stat, i) => (
                 <div key={i} className="flex items-end justify-between border-b border-white/5 pb-6 last:border-0 last:pb-0">
                    <div className="space-y-1">
                       <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</h4>
                       <p className="text-xs italic text-slate-600 font-medium tracking-tight">{stat.sub}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-white tracking-tighter tabular-nums mb-1">{stat.value}</p>
                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">{stat.trend}</span>
                    </div>
                 </div>
               ))}
            </div>

            <Button variant="ghost" className="mt-auto h-12 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest gap-2">
               Download Detailed Report (PDF)
               <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
            </Button>
         </div>
      </div>
    </div>
  )
}
