"use client"

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail } from 'lucide-react'

const users = [
  { id: '1', name: 'Sarah Jenkins', action: 'Viewed profile 3 times', status: 'online' },
  { id: '2', name: 'Robert Fox', action: 'Downloaded your pitch deck', status: 'offline' },
  { id: '3', name: 'Esther Howard', action: 'Engaged with "New Campaign"', status: 'offline' },
]

export function InterestedUsersList() {
  return (
    <div className="flex flex-col gap-10 p-8 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-3xl shadow-2xl h-full">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-black text-white tracking-tight uppercase tracking-wider">Interested Users</h3>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest opacity-60">Past 24h</span>
      </div>

      <div className="space-y-8">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between group cursor-pointer transition-all hover:translate-x-2 duration-500">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-11 w-11 rounded-2xl ring-1 ring-white/10 group-hover:ring-[#818cf8]/50 transition-all duration-500 group-hover:scale-105">
                  <AvatarFallback className="bg-slate-900 text-slate-500 text-xs font-black uppercase tracking-tighter">{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                {user.status === 'online' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-[3px] border-[#0a0f1d] shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse" />
                )}
              </div>
              <div className="flex flex-col">
                <h4 className="text-[13px] font-black text-white tracking-tight group-hover:text-[#818cf8] transition-colors">{user.name}</h4>
                <p className="text-[10px] font-bold text-slate-500 leading-tight tracking-tight opacity-70 mt-0.5">{user.action}</p>
              </div>
            </div>
            <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-600 hover:bg-[#818cf8]/10 hover:border-[#818cf8]/20 hover:text-[#818cf8] transition-all duration-300">
              <Mail className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
