"use client"

import React from 'react'
import { Sparkles } from 'lucide-react'

export function AIInsightCard() {
  return (
    <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#1e1b4b] via-[#0a0f1d] to-black border border-[#818cf8]/20 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group cursor-default">
      <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#818cf8]/10 blur-[80px] rounded-full group-hover:bg-[#818cf8]/20 transition-all duration-700" />
      
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="p-2 rounded-xl bg-[#818cf8] shadow-[0_0_20px_rgba(129,140,248,0.6)] group-hover:scale-110 transition-transform duration-500">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-[11px] font-black text-[#818cf8] uppercase tracking-[0.3em] opacity-90 underline underline-offset-8 decoration-2 decoration-[#818cf8]/30">AI Insight</h3>
      </div>

      <div className="space-y-6 relative z-10">
        <p className="text-sm font-black text-white leading-relaxed tracking-tight uppercase tracking-widest">
          You have 12 new high-intent visitors this week.
        </p>
        <p className="text-xs font-bold text-slate-400 leading-relaxed tracking-tight opacity-80">
          Reach out to <span className="text-[#818cf8] font-black cursor-pointer hover:underline underline-offset-4 decoration-2 transition-all">Sarah Jenkins</span> first—she matches your ideal client persona perfectly.
        </p>
      </div>

      <div className="mt-10 pt-6 border-t border-[#818cf8]/10 flex items-center justify-between relative z-10">
         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Growth Forecast</span>
         <div className="flex items-center gap-1.5 font-black text-[13px] text-emerald-400 uppercase tracking-widest">
            <span className="text-[10px] transform rotate-[-45deg] scale-125">↑</span>
            <span>+24%</span>
         </div>
      </div>
    </div>
  )
}
