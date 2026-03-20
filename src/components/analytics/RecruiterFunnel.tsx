'use client'

import React from 'react'
import { Filter, MousePointerClick, UserCheck, MessageCircle } from 'lucide-react'
import { FunnelStage, getFunnelData } from '@/app/(authenticated)/(dashboard)/analytics/data';

interface RecruiterFunnelProps {
  data: FunnelStage[]
  isDark?: boolean // Optional
}

const icons = [Filter, MousePointerClick, UserCheck, MessageCircle]
const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500']

export function RecruiterFunnel({ data }: RecruiterFunnelProps) {
  return (
    <div className="p-6 rounded-xl border h-full bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">
          Recruiter Funnel
        </h3>
        <p className="text-sm mt-1 text-muted-foreground">
          From search to conversation
        </p>
      </div>

      <div className="space-y-4">
        {data.map((stage, index) => {
          const Icon = icons[index % icons.length]
          const isLast = index === data.length - 1

          return (
            <div key={stage.stage} className="relative">
              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 h-8 z-0 bg-border" />
              )}

              <div className="relative z-10 flex items-center p-3 rounded-lg border transition-colors bg-card border-border hover:border-muted-foreground/30">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 text-white shadow-sm ${colors[index]}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="text-xs font-medium uppercase tracking-wider mb-0.5 text-muted-foreground">
                    {stage.stage}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {stage.count.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {stage.conversionRate}
                  </div>
                </div>
              </div>

              {/* Funnel narrowing visual */}
              {!isLast && (
                <div className="ml-14 my-1 flex justify-center">
                  {/* Spacer to simulate funnel drop */}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
