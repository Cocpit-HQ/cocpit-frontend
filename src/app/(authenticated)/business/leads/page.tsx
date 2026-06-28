"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Target, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Star, 
  MessageSquare, 
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Trash2,
  ShieldCheck
} from 'lucide-react'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { companyService } from '@/services/organization.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Lead {
  id: string
  name: string
  headline: string
  avatar: string
  type: 'Person' | 'Company'
  industry: string
  score: number
  reasons: string[]
  isFollowing: boolean
  lastActive: string
}

const DEFAULT_LEADS: Lead[] = [
  { id: '1', name: 'Alexander Wright', headline: 'Senior DevOps Architect @ CloudScale', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', type: 'Person', industry: 'Cloud Tech', score: 92, reasons: ['Skills match "DevOps" job', 'Follows your company'], isFollowing: true, lastActive: '2 hours ago' },
  { id: '2', name: 'Nexus Cybernetics', headline: 'Full-stack development agency specializing in AI', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nexus', type: 'Company', industry: 'Software Dev', score: 85, reasons: ['Mutual connections with Founders', 'Target industry overlap'], isFollowing: false, lastActive: '1d ago' },
  { id: '3', name: 'Sarah Chen', headline: 'Product Manager | Ex-Google | MIT Grad', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', type: 'Person', industry: 'Product', score: 78, reasons: ['Applied to "Product Lead"', 'Open to work'], isFollowing: true, lastActive: 'Just now' },
]

export default function LeadsPage() {
  const { activeProfile } = useActiveProfile()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'All' | 'Person' | 'Company'>('All')
  const [leads, setLeads] = useState<Lead[]>([])
  const [savedLeads, setSavedLeads] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, we'd fetch followers and apply scoring logic
    // For now, loading the "intelligent" defaults and saved state
    const saved = localStorage.getItem(`cocpit_saved_leads_${activeProfile?.id}`)
    if (saved) setSavedLeads(JSON.parse(saved))
    
    setTimeout(() => {
      setLeads(DEFAULT_LEADS)
      setLoading(false)
    }, 800)
  }, [activeProfile?.id])

  const toggleSave = (id: string) => {
    const newSaved = savedLeads.includes(id) 
      ? savedLeads.filter(l => l !== id)
      : [...savedLeads, id]
    setSavedLeads(newSaved)
    localStorage.setItem(`cocpit_saved_leads_${activeProfile?.id}`, JSON.stringify(newSaved))
  }

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                          l.headline.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'All' || l.type === filterType
      return matchSearch && matchType
    })
  }, [leads, search, filterType])

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                <Target className="w-5 h-5" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tight uppercase tracking-widest leading-none">Lead Targeting</h1>
          </div>
          <p className="text-slate-400 font-bold tracking-tight opacity-70 ml-1">AI-assisted discovery for hiring, partnerships, and growth.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="p-3.5 px-5 rounded-2xl bg-white/5 border border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest hidden lg:flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#818cf8]" />
              <span>Premium Intelligence Active</span>
           </div>
           <Button className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black text-[11px] uppercase tracking-widest gap-2">
              <Download className="w-4 h-4" />
              Report
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-10 items-start">
        {/* Filters Sidebar */}
        <aside className="space-y-8 sticky top-12">
            <div className="space-y-6 p-8 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Search Database</label>
                  <div className="relative">
                    <Input 
                      placeholder="Name, role, skill..." 
                      className="h-12 bg-slate-900/60 border-white/5 rounded-xl pl-10 text-xs text-white placeholder:text-slate-600 focus:border-[#818cf8]/40"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Entity Type</label>
                  <div className="flex flex-col gap-2">
                     {['All', 'Person', 'Company'].map((type) => (
                       <button
                         key={type}
                         onClick={() => setFilterType(type as any)}
                         className={cn(
                           "flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest",
                           filterType === type ? "bg-[#818cf8]/10 text-[#818cf8] border border-[#818cf8]/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                         )}
                       >
                         {type}
                         {filterType === type && <CheckCircle2 className="w-3.5 h-3.5" />}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Min Score Index</label>
                  <div className="flex items-center gap-4">
                     <div className="h-1.5 flex-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[60%]" />
                     </div>
                     <span className="text-[11px] font-black text-slate-300">60+</span>
                  </div>
               </div>
            </div>

            <div className="p-6 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20">
               <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Growth Opportunity</h4>
               </div>
               <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                 There are 150+ professionals in London matching your current hiring needs. 
                 <Link href="#" className="text-white underline ml-1">View Heatmap</Link>
               </p>
            </div>
        </aside>

        {/* Main Leads List */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                 Identified Targets <span className="opacity-40">({filteredLeads.length})</span>
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-[#818cf8] uppercase tracking-widest">
                 <Filter className="w-3.5 h-3.5" />
                 Best Match First
              </div>
           </div>

           <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-white/5 rounded-[32px] animate-pulse" />
                ))
              ) : filteredLeads.map((lead) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={lead.id}
                  className="p-8 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:bg-[#0a0f1d]/60 transition-all duration-500"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#818cf8]/5 blur-[60px] pointer-events-none group-hover:bg-[#818cf8]/10" />
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                     <Avatar className="h-16 w-16 rounded-2xl ring-1 ring-white/10 shadow-xl group-hover:scale-105 transition-transform duration-500">
                        <AvatarImage src={lead.avatar} />
                        <AvatarFallback className="bg-slate-800 text-slate-500 font-black">{lead.name.slice(0, 2)}</AvatarFallback>
                     </Avatar>

                     <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                           <h4 className="text-lg font-black text-white tracking-tight">{lead.name}</h4>
                           <span className={cn(
                             "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                             lead.type === 'Person' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                           )}>
                              {lead.type}
                           </span>
                           {lead.isFollowing && (
                             <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Follower</span>
                           )}
                        </div>
                        <p className="text-sm font-bold text-slate-400 tracking-tight leading-none">{lead.headline}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                           {lead.reasons.map((reason, i) => (
                             <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <Users className="w-3 h-3 text-[#818cf8]" />
                                {reason}
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-3 w-full md:w-auto pt-6 md:pt-0 border-t md:border-0 border-white/5">
                        <div className="text-right">
                           <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Score Index</p>
                           <div className="flex items-center gap-2">
                              <div className="h-2 w-20 bg-slate-900 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500" style={{ width: `${lead.score}%` }} />
                              </div>
                              <span className="text-sm font-black text-emerald-400 tabular-nums">{lead.score}%</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                           <button 
                             onClick={() => toggleSave(lead.id)}
                             className={cn(
                               "p-2.5 rounded-xl border transition-all",
                               savedLeads.includes(lead.id) ? "bg-[#818cf8] border-[#818cf8] text-white" : "bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                             )}
                           >
                              <Star className={cn("w-4 h-4", savedLeads.includes(lead.id) && "fill-current")} />
                           </button>
                           <Button className="h-10 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest gap-2">
                              Access Profile
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-50" />
                           </Button>
                        </div>
                     </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Saved Leads & Lists */}
        <aside className="space-y-8 sticky top-12">
            <div className="p-8 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl space-y-8">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Saved Radar</h4>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
               </div>

               <div className="space-y-4">
                  {savedLeads.length === 0 ? (
                    <div className="py-10 text-center space-y-4 opacity-30">
                       <Star className="w-8 h-8 mx-auto" />
                       <p className="text-[10px] font-black uppercase tracking-widest leading-none">No saved leads</p>
                    </div>
                  ) : filteredLeads.filter(l => savedLeads.includes(l.id)).map(lead => (
                    <div key={lead.id} className="flex items-center gap-4 group">
                       <Avatar className="h-10 w-10 rounded-xl border border-white/5 ring-4 ring-[#020617]">
                          <AvatarImage src={lead.avatar} />
                          <AvatarFallback className="bg-slate-800 text-[10px] text-slate-500 font-black">{lead.name.slice(0, 2)}</AvatarFallback>
                       </Avatar>
                       <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">{lead.name}</h5>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest truncate">{lead.industry}</p>
                       </div>
                       <button onClick={() => toggleSave(lead.id)} className="text-slate-800 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  ))}
               </div>

               <Button className="w-full h-12 rounded-2xl bg-white/5 border border-white/5 text-slate-300 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-white/10 hover:text-white transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  Create List
               </Button>
            </div>

            <div className="p-10 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl text-center space-y-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <Users className="w-24 h-24 text-white" />
               </div>
               <div className="space-y-1">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Connect to Network</h4>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sync with Recruiters</p>
               </div>
               <div className="flex -space-x-3 justify-center">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Avatar key={i} className="h-8 w-8 rounded-full border-2 border-[#020617] ring-1 ring-white/5 uppercase font-black text-[10px]">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Recruiter${i}`} />
                      <AvatarFallback>R</AvatarFallback>
                    </Avatar>
                  ))}
               </div>
               <Button className="w-full h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[#818cf8] font-black text-[10px] uppercase tracking-widest hover:bg-[#818cf8] hover:text-white transition-all">
                  Sync Talent Cloud
               </Button>
            </div>
        </aside>
      </div>
    </div>
  )
}
