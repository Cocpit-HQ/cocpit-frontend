"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  MessageSquare, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowUpRight, 
  Clock, 
  TrendingUp,
  Download,
  ShieldCheck,
  CheckCircle2,
  Mail,
  UserCheck
} from 'lucide-react'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { companyService } from '@/services/organization.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type TabID = 'followers' | 'pending' | 'discover'

export default function ConnectionsPage() {
  const { activeProfile } = useActiveProfile()
  const [activeTab, setActiveTab] = useState<TabID>('followers')
  const [search, setSearch] = useState('')
  const [followers, setFollowers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!activeProfile?.id) {
        setLoading(false)
        return
      }

      try {
        const data = await companyService.getCompanyFollowers(activeProfile.id).catch(err => {
          console.warn('Followers API failed (expected in exploration mode):', err.message)
          // Return some mock followers for UI exploration
          return [
            { user_id: '1', full_name: 'Sarah Connor', headline: 'Resistance Leader | Tech Enthusiast', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
            { user_id: '2', full_name: 'John Doe', headline: 'Open Source Contributor', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
            { user_id: '3', full_name: 'Jane Smith', headline: 'UX Designer @ CreativeFlow', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' }
          ]
        })
        setFollowers(data || [])
      } catch (error) {
        console.error('Failed to fetch followers:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFollowers()
  }, [activeProfile?.id])

  const filteredFollowers = useMemo(() => {
    return followers.filter(f => 
      f.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      f.headline?.toLowerCase().includes(search.toLowerCase())
    )
  }, [followers, search])

  const tabs: { id: TabID; label: string; icon: any; count?: number }[] = [
    { id: 'followers', label: 'Followers', icon: Users, count: followers.length },
    { id: 'pending', label: 'Pending Requests', icon: Clock, count: 0 },
    { id: 'discover', label: 'Discover', icon: UserPlus },
  ]

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Users className="w-5 h-5 font-black" />
             </div>
             <h1 className="text-3xl font-black text-white tracking-tight uppercase tracking-widest leading-none">Ecosystem Graph</h1>
          </div>
          <p className="text-slate-400 font-bold tracking-tight opacity-70 ml-1">Manage corporate connections, followers, and network reach.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center p-1.5 rounded-2xl bg-[#0a0f1d]/60 border border-white/5 backdrop-blur-md">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    isActive 
                      ? "bg-[#818cf8] text-white shadow-lg shadow-[#818cf8]/20" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-600")} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={cn("ml-1 opacity-60", isActive ? "text-white" : "text-slate-700")}>
                      ({tab.count})
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          
          <Button className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black text-[11px] uppercase tracking-widest gap-2">
             <Download className="w-4 h-4" />
             Export List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">
        {/* Main List Column */}
        <div className="space-y-8">
           {/* Search & Actions Bar */}
           <div className="flex flex-col sm:flex-row items-center gap-4 px-4">
              <div className="relative flex-1 w-full">
                <Input 
                  placeholder={`Search in ${activeTab}...`} 
                  className="h-14 bg-[#0a0f1d]/40 border-white/5 rounded-2xl pl-12 text-sm text-white placeholder:text-slate-600 focus:border-[#818cf8]/40 backdrop-blur-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 <Button variant="ghost" className="h-14 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest gap-2 border border-white/5">
                    <Filter className="w-4 h-4" />
                    Filters
                 </Button>
                 <Button className="h-14 px-8 rounded-2xl bg-[#818cf8] hover:bg-[#818cf8]/90 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-[#818cf8]/20">
                    <Mail className="w-4 h-4" />
                    Blast Message
                 </Button>
              </div>
           </div>

           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-40 bg-white/5 rounded-[40px] animate-pulse" />
                  ))
                ) : activeTab === 'followers' && filteredFollowers.length > 0 ? (
                  filteredFollowers.map((follower) => (
                    <div 
                      key={follower.user_id}
                      className="p-8 rounded-[40px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:bg-[#0a0f1d]/60 transition-all duration-500"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#818cf8]/5 blur-[60px] pointer-events-none group-hover:bg-[#818cf8]/10" />
                      
                      <div className="flex items-center gap-5 mb-6 relative z-10">
                         <Avatar className="h-14 w-14 rounded-2xl ring-1 ring-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                            <AvatarImage src={follower.avatar_url} />
                            <AvatarFallback className="bg-slate-800 text-slate-500 font-black">{follower.full_name?.slice(0, 2)}</AvatarFallback>
                         </Avatar>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-base font-black text-white tracking-tight truncate">{follower.full_name}</h4>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest truncate">{follower.headline || 'Professional Member'}</p>
                         </div>
                         <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-600 hover:text-white transition-all">
                            <MoreVertical className="w-4 h-4" />
                         </button>
                      </div>

                      <div className="flex items-center justify-between relative z-10">
                         <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                            <UserCheck className="w-3 h-3" />
                            Connected
                         </div>
                         <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 text-[#818cf8]">
                               <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest">
                               Profile <ArrowUpRight className="ml-1 w-3.5 h-3.5" />
                            </Button>
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                     <Users className="w-16 h-16" strokeWidth={1} />
                     <div className="space-y-1">
                        <h4 className="text-sm font-black uppercase tracking-widest">No connections found</h4>
                        <p className="text-[10px] font-medium italic">Adjust your search or filters to see more results.</p>
                     </div>
                  </div>
                )}
              </motion.div>
           </AnimatePresence>
        </div>

        {/* Sidebar Insights */}
        <aside className="space-y-10 sticky top-12">
            {/* Reach Analytics Card */}
            <div className="p-10 rounded-[40px] bg-gradient-to-br from-[#818cf8]/10 via-[#0a0f1d]/40 to-transparent border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="w-32 h-32 text-indigo-400" />
               </div>
               
               <div className="relative z-10 space-y-8">
                  <div className="space-y-1">
                     <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Network Growth</h4>
                     <h3 className="text-4xl font-black text-white tracking-tighter">+1,240</h3>
                  </div>

                  <div className="space-y-4">
                     {[
                       { label: 'Organic Search', value: '64%', color: 'bg-emerald-400' },
                       { label: 'Through Ads', value: '22%', color: 'bg-[#818cf8]' },
                       { label: 'Referrals', value: '14%', color: 'bg-slate-700' }
                     ].map((item, i) => (
                       <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-slate-500">{item.label}</span>
                             <span className="text-white">{item.value}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: item.value }}
                               transition={{ duration: 1, delay: i * 0.2 }}
                               className={cn("h-full rounded-full", item.color)}
                             />
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="pt-6 border-t border-white/5">
                     <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">
                        "Your profile visibility has increased by <strong>42%</strong> following your last broadcast."
                     </p>
                  </div>
               </div>
            </div>

            {/* Quick Suggestions */}
            <div className="p-8 rounded-[40px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl space-y-8">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Smart Discovery</h4>
                  <ShieldCheck className="w-4 h-4 text-[#818cf8]" />
               </div>

               <div className="space-y-5">
                  {[
                    { name: 'Dr. Evelyn Reed', role: 'Head of AI @ Nexus', avatar: '1' },
                    { name: 'Quantum Systems', role: 'Enterprise Cloud', avatar: '2' },
                    { name: 'Julian Marx', role: 'Product Architect', avatar: '3' }
                  ].map((sug, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                       <Avatar className="h-10 w-10 rounded-xl border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Sug${sug.avatar}`} />
                          <AvatarFallback className="text-[10px] font-black">U</AvatarFallback>
                       </Avatar>
                       <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-white truncate group-hover:text-[#818cf8] transition-colors">{sug.name}</h5>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest truncate">{sug.role}</p>
                       </div>
                       <button className="text-[#818cf8] hover:scale-110 transition-transform">
                          <UserPlus className="w-4 h-4" />
                       </button>
                    </div>
                  ))}
               </div>

               <Button className="w-full h-11 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all">
                  Browse All Suggestions
               </Button>
            </div>
        </aside>
      </div>
    </div>
  )
}
