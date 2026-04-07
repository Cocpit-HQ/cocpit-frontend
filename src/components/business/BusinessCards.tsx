"use client"

import React from 'react'
import { Lightbulb, Image as ImageIcon } from 'lucide-react'

export function ProTips() {
  return (
    <div className="p-6 rounded-3xl bg-[#0a0f1d] border border-white/5 space-y-5 shadow-2xl">
      <div className="flex items-center gap-2.5 text-[#818cf8]">
        <Lightbulb className="w-5 h-5" />
        <h4 className="text-sm font-black text-white uppercase tracking-widest">Pro Tips</h4>
      </div>
      <ul className="space-y-4">
        {[
          "Use a professional name that resonates with your industry vertical.",
          "Startups get specialized access to Cocpit's \"Venture Launchpad\" features.",
          "Your headline will be the first thing investors and talent see."
        ].map((tip, i) => (
          <li key={i} className="flex gap-3.5 text-xs text-slate-400 leading-relaxed font-medium">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#818cf8] shrink-0 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DesignGuide() {
  return (
    <div className="relative h-40 rounded-3xl overflow-hidden border border-white/10 group shadow-2xl transition-transform hover:scale-[1.02] duration-500 cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-900 to-black" />
      {/* Abstract design elements */}
      <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#818cf8]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-4 left-6 right-6">
         <span className="inline-block px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-black text-white/80 uppercase tracking-widest backdrop-blur-md mb-3">Design Guide</span>
         <div className="w-full h-[3px] bg-slate-800 rounded-full overflow-hidden">
            <div className="w-[45%] h-full bg-gradient-to-r from-[#818cf8] to-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.4)]" />
         </div>
      </div>
    </div>
  )
}

export function LivePreview() {
  return (
    <div className="p-8 rounded-3xl bg-[#0a0f1d] border border-white/5 flex flex-col items-center justify-center gap-5 py-14 text-center border-dashed border-slate-800/80 shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-slate-900/50 flex items-center justify-center text-slate-600 border border-white/5">
        <ImageIcon className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <div className="w-32 h-2.5 bg-slate-900 rounded-full mx-auto opacity-60" />
        <div className="w-20 h-2 bg-slate-900 rounded-full mx-auto opacity-30" />
      </div>
      <p className="text-[10px] font-bold italic text-slate-600 mt-2 tracking-wide">
        Live Preview will generate as you type.
      </p>
    </div>
  )
}
