'use client'

import React from 'react'
import { Filter, MousePointerClick, UserCheck, MessageCircle } from 'lucide-react'
import { FunnelStage } from '@/app/analytics/data'

interface RecruiterFunnelProps {
  data: FunnelStage[]
  isDark: boolean
}

const icons = [Filter, MousePointerClick, UserCheck, MessageCircle]
const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500']

export function RecruiterFunnel({ data, isDark }: RecruiterFunnelProps) {
  return (
    <div className={`p-6 rounded-xl border h-full
      ${isDark
        ? 'bg-[#242b3d] border-[#2d3548]'
        : 'bg-white border-gray-200'
      }`}
    >
      <div className="mb-6">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recruiter Funnel
        </h3>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
                <div className={`absolute left-5 top-10 bottom-0 w-0.5 h-8 z-0
                  ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                />
              )}

              <div className={`relative z-10 flex items-center p-3 rounded-lg border transition-colors
                ${isDark
                  ? 'bg-[#1a1f2e] border-[#2d3548] hover:border-gray-600'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 text-white shadow-sm ${colors[index]}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stage.stage}
                  </div>
                  <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stage.count.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'
                  }`}>
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
