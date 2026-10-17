"use client"

import React, { useState } from 'react'
import { Building2, Rocket, Landmark, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function CreateCompanyForm() {
  const [formData, setFormData] = useState({
    name: '',
    type: 'startup',
    headline: ''
  })

  const entityTypes = [
    { id: 'startup', label: 'Startup', icon: Rocket },
    { id: 'enterprise', label: 'Enterprise', icon: Building2 },
    { id: 'organization', label: 'Organization', icon: Landmark },
  ]

  return (
    <div className="max-w-3xl w-full p-10 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#818cf8]/5 blur-[100px] pointer-events-none" />
      
      <div className="flex items-center gap-4 mb-10 relative z-10">
        <div className="p-3 rounded-2xl bg-[#818cf8]/10 border border-[#818cf8]/20">
          <Building2 className="w-6 h-6 text-[#818cf8]" />
        </div>
        <h3 className="text-2xl font-black text-white tracking-tight">Company Information</h3>
      </div>

      <div className="space-y-10 relative z-10">
        {/* Company Name */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Company Name</label>
          <Input 
            placeholder="e.g. Nexus Cybernetics" 
            className="h-16 bg-slate-900/40 border-white/5 text-white placeholder:text-slate-600 focus:border-[#818cf8]/50 focus:bg-slate-900/60 focus:ring-0 rounded-2xl px-6 text-lg font-medium transition-all"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        {/* Entity Type */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Entity Type</label>
          <div className="grid grid-cols-3 gap-5">
            {entityTypes.map((type) => {
              const Icon = type.icon
              const isSelected = formData.type === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => setFormData({...formData, type: type.id})}
                  className={`flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden ${isSelected ? 'border-[#818cf8] bg-[#818cf8]/5 text-white shadow-[0_0_30px_rgba(129,140,248,0.15)] ring-1 ring-[#818cf8]/30' : 'border-white/5 bg-slate-900/30 text-slate-500 hover:border-white/10 hover:bg-slate-900/50 hover:text-slate-300'}`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#818cf8] shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                  )}
                  <Icon className={`w-8 h-8 transition-transform duration-500 ${isSelected ? 'text-[#818cf8] scale-110' : 'text-slate-600 opacity-60'}`} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{type.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Company Headline</label>
          <Textarea 
            placeholder="Briefly describe your company's mission..." 
            className="min-h-[160px] bg-slate-900/40 border-white/5 text-white placeholder:text-slate-600 focus:border-[#818cf8]/50 focus:bg-slate-900/60 focus:ring-0 rounded-[24px] p-6 resize-none text-base font-medium transition-all"
            value={formData.headline}
            onChange={(e) => setFormData({...formData, headline: e.target.value})}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-10 border-t border-white/5">
           <button className="text-[11px] font-black text-slate-600 hover:text-slate-300 transition-colors uppercase tracking-[0.2em] ml-2">
              Save Draft
           </button>
           <Button className="h-16 px-10 rounded-[20px] bg-[#818cf8] hover:bg-[#747ef4] text-white shadow-[0_8px_25px_-5px_rgba(129,140,248,0.5)] hover:shadow-[0_12px_35px_-8px_rgba(129,140,248,0.6)] transition-all duration-300 gap-3 group border-none">
              <span className="font-black text-[13px] uppercase tracking-widest">Next Step</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" strokeWidth={3} />
           </Button>
        </div>
      </div>
    </div>
  )
}
