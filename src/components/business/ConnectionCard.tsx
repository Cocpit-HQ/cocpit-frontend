"use client"

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'

interface ConnectionCardProps {
  name: string
  title: string
  matchScore: number
  description: string
  tags: string[]
  imageUrl?: string
  isEntity?: boolean
}

export function ConnectionCard({ name, title, matchScore, description, tags, imageUrl, isEntity = false }: ConnectionCardProps) {
  return (
    <div className="p-6 rounded-[28px] bg-[#0a0f1d]/50 border border-white/5 flex flex-col gap-5 transition-all hover:bg-[#0a0f1d]/80 hover:border-white/10 group shadow-lg">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {isEntity ? (
            <div className="h-16 w-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Building2 className="w-8 h-8" />
            </div>
          ) : (
            <Avatar className="h-16 w-16 rounded-2xl ring-1 ring-white/10 group-hover:ring-[#818cf8]/50 transition-all duration-500">
              <AvatarImage src={imageUrl} alt={name} className="object-cover" />
              <AvatarFallback className="bg-slate-800 text-slate-400 font-bold">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
           <div className="flex items-center gap-2">
              <h4 className="text-lg font-black text-white tracking-tight truncate">{name}</h4>
              <span className="shrink-0 text-[10px] font-black text-[#818cf8] bg-[#818cf8]/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {matchScore}% Match
              </span>
           </div>
           <p className="text-sm text-slate-500 font-bold tracking-tight uppercase opacity-80">{title}</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed font-bold italic opacity-70 px-1">
        "{description}"
      </p>

      <div className="flex flex-wrap gap-2.5 px-1">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="bg-slate-900 border-white/5 text-[10px] font-black text-slate-500 py-1.5 px-3.5 rounded-xl uppercase tracking-widest hover:text-white transition-colors">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <Button className="flex-1 h-12 bg-[#818cf8] hover:bg-[#747ef4] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-[#818cf8]/20 transition-all duration-300 border-none">
          Connect
        </Button>
        <Button variant="outline" className="flex-1 h-12 text-slate-500 hover:text-white border-white/5 bg-white/5 hover:bg-white/10 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all duration-300">
          View Profile
        </Button>
      </div>
    </div>
  )
}
