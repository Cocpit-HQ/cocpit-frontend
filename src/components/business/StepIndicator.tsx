"use client"

import React from 'react'

interface StepProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepProps) {
  const steps = [
    { number: 1, label: 'Info' },
    { number: 2, label: 'Details' },
    { number: 3, label: 'Tags' },
    { number: 4, label: 'Preview' },
  ]

  return (
    <div className="flex items-center gap-20 py-10">
      {steps.map((step) => {
        const isActive = currentStep === step.number
        const isPast = currentStep > step.number

        return (
          <div key={step.number} className="flex flex-col items-center gap-4 group">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${isActive ? 'bg-[#818cf8] border-[#818cf8] text-white shadow-[0_0_20px_rgba(129,140,248,0.5)]' : 'border-slate-800 text-slate-500 group-hover:border-slate-600 group-hover:text-slate-400'}`}>
                {step.number}
             </div>
             <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>
                {step.label}
             </span>
          </div>
        )
      })}
    </div>
  )
}
